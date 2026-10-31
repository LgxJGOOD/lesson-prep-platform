"""AI 生成服务。

统一对接 Coze 的「主工作流」：一个地址、用 workflow 字段路由到各条支流，
请求参数一律 snake_case、结构化入参传 JSON 字符串，返回 {"result": "<JSON 字符串>"}。

workflow 取值：
    course_plan / import_cases / lesson_plan / ppt / assignments / rewrite_process / regenerate_script

未配置 COZE_TOKEN 或 COZE_MAIN_ENDPOINT 时，各环节退回 mock_data 的模拟数据，
方便离线开发与联调。
"""

import json
import os
import re
from datetime import datetime

import httpx

from mock_data import (
    build_assignments,
    build_course_plan,
    build_import_cases,
    build_lesson_plan,
    build_ppt,
    regenerate_slide_script,
    rewrite_lesson_process,
)

COZE_TOKEN = os.getenv("COZE_TOKEN", "")
COZE_MAIN_ENDPOINT = os.getenv("COZE_MAIN_ENDPOINT", "")


def _coze_ready() -> bool:
    return bool(COZE_TOKEN and COZE_MAIN_ENDPOINT)


def _json_or(value, default: str = "[]") -> str:
    """把列表/对象序列化成 JSON 字符串；已是字符串则原样返回。"""
    if value is None:
        return default
    if isinstance(value, str):
        return value
    try:
        return json.dumps(value, ensure_ascii=False)
    except (TypeError, ValueError):
        return default


def _cases_payload(import_cases) -> str:
    """下游支流需要 {"cases":[...]} 形态的 JSON 字符串，这里把数组包一层。"""
    if isinstance(import_cases, list):
        return json.dumps({"cases": import_cases}, ensure_ascii=False)
    return _json_or(import_cases, "{}")


def _extract_json_from_text(text: str):
    """从一段包含解释文字/代码块的文本中提取首个 JSON 数组或对象。"""
    if not isinstance(text, str):
        return None
    cleaned = re.sub(r"```(?:json)?", "", text)
    decoder = json.JSONDecoder()
    for i, ch in enumerate(cleaned):
        if ch not in "[{":
            continue
        try:
            obj, _ = decoder.raw_decode(cleaned[i:])
            return obj
        except json.JSONDecodeError:
            continue
    return None


def _unwrap_result(result):
    """解包主工作流返回：{"result": "<JSON 字符串>"}，可能外面还套一层 data。"""
    if isinstance(result, dict) and "data" in result:
        result = result["data"]
    if isinstance(result, dict) and "result" in result:
        result = result["result"]
    if isinstance(result, str):
        parsed = _extract_json_from_text(result)
        return parsed if parsed is not None else result
    return result


async def _call_main(workflow: str, params: dict):
    """调用统一主工作流：POST {workflow, **params} 到 COZE_MAIN_ENDPOINT。"""
    if not _coze_ready():
        raise RuntimeError("Coze 主工作流未配置（缺少 COZE_TOKEN 或 COZE_MAIN_ENDPOINT）")

    headers = {
        "Authorization": f"Bearer {COZE_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {"workflow": workflow, **params}
    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.post(COZE_MAIN_ENDPOINT, headers=headers, json=payload)
        resp.raise_for_status()
        result = resp.json()

    if isinstance(result, dict) and result.get("code") not in (0, None):
        raise RuntimeError(result.get("msg") or result.get("detail") or str(result))

    return _unwrap_result(result)


def _outline_params(inp: dict) -> dict:
    """WF1-WF6 的公共参数（snake_case；大纲类字段传 JSON 字符串）。"""
    return {
        "topic": inp.get("topic") or inp.get("courseName") or "人工智能通识",
        "hours": inp.get("hours") or 2,
        "audience": inp.get("audience") or "",
        "major": inp.get("major") or "",
        "goals": inp.get("goals") or "",
        "template": inp.get("template") or "通用教案模板",
        "knowledge_points": _json_or(inp.get("knowledgePoints")),
        "objectives": _json_or(inp.get("objectives")),
        "key_points": _json_or(inp.get("keyPoints")),
        "difficulties": _json_or(inp.get("difficulties")),
    }


def _normalize_lesson(raw, index: int) -> dict:
    if not isinstance(raw, dict):
        raw = {"title": str(raw)}
    return {
        "id": raw.get("id") or f"les-{index + 1}",
        "title": raw.get("title") or raw.get("topic") or f"第 {index + 1} 讲",
        "hours": raw.get("hours") or 2,
        "knowledgePoints": raw.get("knowledgePoints") if isinstance(raw.get("knowledgePoints"), list) else [],
        "objectives": raw.get("objectives") if isinstance(raw.get("objectives"), list) else [],
        "keyPoints": raw.get("keyPoints") if isinstance(raw.get("keyPoints"), list) else [],
        "difficulties": raw.get("difficulties") if isinstance(raw.get("difficulties"), list) else [],
        "lessonPlan": None,
        "ppt": None,
        "importCases": None,
        "assignments": None,
        "generationError": None,
    }


def _recover_lessons(lessons):
    """兼容 Coze 工作流结束节点解析失败，把原始输出文本恢复成课时数组。"""
    if not isinstance(lessons, list) or len(lessons) != 1:
        return None
    first = lessons[0]
    if not isinstance(first, dict) or first.get("title") != "解析失败":
        return None

    for key in ("knowledgePoints", "objectives", "keyPoints", "difficulties"):
        values = first.get(key)
        if not isinstance(values, list):
            continue
        for item in values:
            if not isinstance(item, str):
                continue
            if "原始输出" in item or "```json" in item or "lessons" in item:
                extracted = _extract_json_from_text(item)
                if isinstance(extracted, dict) and isinstance(extracted.get("lessons"), list):
                    return extracted["lessons"]
                if isinstance(extracted, list):
                    return extracted
    return None


def _normalize_case(raw, index: int) -> dict:
    if not isinstance(raw, dict):
        raw = {"title": str(raw)}
    questions = raw.get("questions") if isinstance(raw.get("questions"), list) else []
    return {
        "id": raw.get("id") if raw.get("id") is not None else index,
        "title": raw.get("title") or f"案例 {index + 1}",
        "type": raw.get("type") or raw.get("category") or "趣味演示",
        "description": raw.get("description") or raw.get("content") or "",
        "questions": questions,
        "related": raw.get("related") or raw.get("relatedKnowledge") or "",
    }


def _extract_cases(result):
    """从导入案例工作流返回中提取 cases 数组，兼容对象 / 数组 / 字符串三种形态。"""
    cases = result
    if isinstance(cases, dict):
        cases = cases.get("cases") or cases.get("data") or cases.get("result") or []
    if isinstance(cases, str):
        parsed = _extract_json_from_text(cases)
        if isinstance(parsed, dict):
            cases = parsed.get("cases") or parsed.get("data") or []
        elif isinstance(parsed, list):
            cases = parsed
        else:
            cases = []
    return cases if isinstance(cases, list) else []


def _normalize_homework(raw, index: int) -> dict:
    if not isinstance(raw, dict):
        raw = {"title": str(raw)}
    requirements = raw.get("requirements")
    criteria = raw.get("criteria") or raw.get("scoringCriteria") or raw.get("standard")
    if not criteria and isinstance(requirements, list):
        criteria = "；".join(str(x) for x in requirements)
    if not criteria:
        criteria = raw.get("description") or ""
    return {
        "id": raw.get("id") if raw.get("id") is not None else index + 1,
        "title": raw.get("title") or raw.get("content") or "",
        "mode": raw.get("mode") or raw.get("type") or "个人",
        "duration": raw.get("duration") or raw.get("estimated_time") or raw.get("time") or "",
        "criteria": criteria,
    }


_QUIZ_TYPE_MAP = {
    "单选题": "单选",
    "多选题": "多选",
    "判断题": "判断",
    "简答题": "简答",
}


def _normalize_quiz(raw, index: int) -> dict:
    if not isinstance(raw, dict):
        raw = {"question": str(raw)}
    options = raw.get("options") if isinstance(raw.get("options"), list) else []
    raw_type = raw.get("type") or raw.get("questionType") or "简答"
    quiz_type = _QUIZ_TYPE_MAP.get(raw_type, raw_type)
    return {
        "id": raw.get("id") if raw.get("id") is not None else index + 1,
        "type": quiz_type,
        "question": raw.get("question") or raw.get("title") or "",
        "options": options,
        "answer": raw.get("answer") or "",
        "analysis": raw.get("analysis") or raw.get("explanation") or "",
    }


async def generate_course_plan(inp: dict) -> dict:
    """WF0 课程规划：产出每讲的大纲（知识点/目标/重点/难点），是全链路的锚。"""
    params = {
        "course_name": inp.get("courseName") or "人工智能通识",
        "total_hours": inp.get("totalHours") or 32,
        "audience": inp.get("audience") or "",
        "major": inp.get("major") or "",
        "goals": inp.get("goals") or "",
        "template": inp.get("template") or "通用教案模板",
    }

    if _coze_ready():
        result = await _call_main("course_plan", params)
    else:
        result = build_course_plan(inp)

    lessons = result
    if isinstance(result, dict):
        lessons = result.get("lessons") or result.get("data") or result
    if isinstance(lessons, dict) and "lessons" in lessons:
        lessons = lessons["lessons"]
    if not isinstance(lessons, list):
        raise RuntimeError("Coze 课程规划工作流缺少 lessons 字段")

    recovered = _recover_lessons(lessons)
    if recovered:
        lessons = recovered

    return {"lessons": [_normalize_lesson(item, i) for i, item in enumerate(lessons)]}


async def generate_lesson_plan(inp: dict, import_cases=None) -> dict:
    """WF2 教案生成：消费 WF1 的导入案例，让「导入」环节引用真实案例。"""
    params = _outline_params(inp)
    params["import_cases"] = _cases_payload(import_cases)

    if _coze_ready():
        result = await _call_main("lesson_plan", params)
    else:
        result = build_lesson_plan(inp)

    if not isinstance(result, dict):
        raise RuntimeError("Coze 教案工作流返回格式不正确")

    # 保证前端依赖的 meta 字段完整，createdAt 由后端补全
    result.setdefault("meta", {})
    result["meta"].setdefault("topic", params["topic"])
    result["meta"].setdefault("hours", params["hours"])
    result["meta"].setdefault("audience", params["audience"])
    result["meta"].setdefault("major", params["major"])
    result["meta"].setdefault("template", params["template"])
    result["meta"].setdefault("createdAt", datetime.now().isoformat())

    # Coze 不同发布方式可能返回驼峰或下划线字段，统一为前端依赖的驼峰结构
    def _list(key, alt_key=None):
        value = result.get(key)
        if isinstance(value, list):
            return value
        if alt_key:
            alt = result.get(alt_key)
            if isinstance(alt, list):
                return alt
        return []

    return {
        "meta": result.get("meta") or {},
        "objectives": _list("objectives"),
        "keyPoints": _list("keyPoints", "key_points"),
        "difficulties": _list("difficulties"),
        "process": _list("process"),
        "resources": _list("resources"),
        "homeworkSummary": result.get("homeworkSummary") or result.get("homework_summary") or "",
        "interdisciplinary": result.get("interdisciplinary") or result.get("跨学科案例融合") or "",
    }


async def generate_ppt(inp: dict, page_count: int = 10, import_cases=None, lesson_plan=None) -> dict:
    """WF3 PPT 大纲与讲稿：消费 WF1 案例 + WF2 教案。"""
    params = _outline_params(inp)
    params["import_cases"] = _cases_payload(import_cases)
    params["lesson_plan"] = _json_or(lesson_plan, "{}")
    params["page_count"] = min(12, max(8, int(page_count or 10)))

    if _coze_ready():
        result = await _call_main("ppt", params)
    else:
        return build_ppt(inp, page_count)

    if isinstance(result, list):
        result = {"pages": result}
    if not isinstance(result, dict):
        raise RuntimeError("Coze PPT 工作流返回格式不正确")

    pages = result.get("pages")
    if pages is None and "slides" in result:
        pages = result["slides"]
    if not isinstance(pages, list):
        raise RuntimeError("Coze PPT 工作流缺少 pages 字段")

    # 统一前端依赖的字段结构；动画标记 animationPrompt 由工作流返回时原样保留
    normalized_pages = []
    for i, page in enumerate(pages):
        if not isinstance(page, dict):
            page = {"title": str(page)}
        item = {
            "id": page.get("id") if page.get("id") is not None else i + 1,
            "title": page.get("title") or f"第 {i + 1} 页",
            "type": page.get("type") or "knowledge",
            "tag": page.get("tag"),
            "points": page.get("points") if isinstance(page.get("points"), list) else [],
            "script": page.get("script") or "",
        }
        if page.get("animationPrompt"):
            item["animationPrompt"] = page["animationPrompt"]
        normalized_pages.append(item)

    return {"pages": normalized_pages}


async def generate_import_cases(inp: dict, batch: int = 0) -> list:
    """WF1 课堂导入案例：每讲流水线的第一步。"""
    params = _outline_params(inp)
    params["batch"] = int(batch or 0)

    if not _coze_ready():
        return build_import_cases(inp, batch)

    result = await _call_main("import_cases", params)

    cases = _extract_cases(result)
    if not cases:
        # Coze 工作流返回空时退回 mock，保证案例页始终有内容可展示
        return build_import_cases(inp, batch)

    return [_normalize_case(item, i) for i, item in enumerate(cases)]


async def generate_assignments(inp: dict, quiz_count: int = 5, difficulty: str = "中等", import_cases=None, lesson_plan=None) -> dict:
    """WF4 作业与测验：消费 WF1 案例 + WF2 教案。"""
    params = _outline_params(inp)
    params["import_cases"] = _cases_payload(import_cases)
    params["lesson_plan"] = _json_or(lesson_plan, "{}")
    params["quiz_count"] = int(quiz_count or 5)
    params["difficulty"] = difficulty or "中等"

    if not _coze_ready():
        return build_assignments(inp, quiz_count, difficulty)

    result = await _call_main("assignments", params)

    if not isinstance(result, dict):
        raise RuntimeError("Coze 作业工作流返回格式不正确")

    homework = result.get("homework") or result.get("assignments") or result.get("homeworks") or []
    quiz = result.get("quiz") or result.get("quiz_questions") or result.get("quizzes") or result.get("questions") or []
    if not isinstance(homework, list):
        homework = []
    if not isinstance(quiz, list):
        quiz = []

    return {
        "homework": [_normalize_homework(item, i) for i, item in enumerate(homework)],
        "quiz": [_normalize_quiz(item, i) for i, item in enumerate(quiz)],
    }


async def rewrite_process(inp: dict, lesson_plan: dict) -> list:
    """WF5 重写教学过程：消费 WF2 教案。"""
    params = _outline_params(inp)
    params["lesson_plan"] = _json_or(lesson_plan, "{}")

    if not _coze_ready():
        return rewrite_lesson_process(inp, lesson_plan)

    result = await _call_main("rewrite_process", params)

    process = result
    if isinstance(result, dict):
        process = result.get("process") or result.get("data") or []
    if not isinstance(process, list):
        raise RuntimeError("Coze 重写教学过程工作流缺少 process 字段")

    normalized = []
    for i, item in enumerate(process):
        if not isinstance(item, dict):
            item = {"content": str(item)}
        normalized.append(
            {
                "stage": item.get("stage") or item.get("name") or f"环节 {i + 1}",
                "minutes": item.get("minutes") or item.get("duration") or 5,
                "content": item.get("content") or item.get("description") or "",
            }
        )
    return normalized


async def regenerate_script(inp: dict, page: dict, lesson_plan=None) -> str:
    """WF6 重写单页讲稿：消费 WF2 教案 + 目标页。"""
    params = _outline_params(inp)
    params["lesson_plan"] = _json_or(lesson_plan, "{}")
    params["page"] = _json_or(page, "{}")

    if not _coze_ready():
        return regenerate_slide_script(inp, page)

    result = await _call_main("regenerate_script", params)

    if isinstance(result, dict):
        script = result.get("script") or result.get("data") or ""
    elif isinstance(result, str):
        script = result
    else:
        script = ""

    if not script:
        raise RuntimeError("Coze 讲稿重写工作流缺少 script 字段")

    return script
