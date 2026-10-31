"""FastAPI 后端入口。

职责：
1. 作为 AI 工作流中转，保护 COZE_TOKEN 等密钥不暴露到前端；
2. 用 SQLite 持久化课程备课记录与教案模板；
3. 当前 AI 生成返回模拟数据，后续可切换到真实 Coze 工作流。
"""

import io
import json
import urllib.parse
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv(Path(__file__).parent / ".env")

import ai_service
import exporters
from database import get_conn, init_db

DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
ZIP_MIME = "application/zip"

app = FastAPI(title="AI 通识课备课助手后端", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


DEFAULT_TEMPLATE = {
    "id": "default",
    "name": "通用教案模板",
    "builtin": True,
    "description": "包含教学目标、重难点、教学过程、教学资源、课后作业与跨学科案例融合的标准结构。",
    "createdAt": None,
    "content": """# 教案标题

## 一、教学目标
1. 知识目标：
2. 能力目标：
3. 素养目标：

## 二、教学重难点
- 教学重点：
- 教学难点：

## 三、教学过程

### 环节一：导入（5 分钟）
- 情境导入 / 案例导入

### 环节二：讲解（20 分钟）
- 概念讲解
- 案例拆解

### 环节三：互动（15 分钟）
- 分组讨论
- 观点分享

### 环节四：总结（5 分钟）
- 知识框架回顾
- 布置作业

## 四、教学资源
- 多媒体课件
- 课堂互动工具

## 五、课后作业
- 作业要求

## 六、跨学科案例融合
- 结合专业背景的案例说明
""",
}


# ---------- 通用序列化 ----------

def serialize(value: Any) -> str | None:
    if value is None:
        return None
    return json.dumps(value, ensure_ascii=False)


def deserialize(raw: Any) -> Any:
    if raw is None:
        return None
    try:
        return json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return raw


def row_to_course(row) -> dict:
    return {
        "id": row["id"],
        "input": deserialize(row["input"]),
        "lessons": deserialize(row["lessons"]),
        "createdAt": row["created_at"],
    }


# ---------- 请求模型 ----------

class CoursePayload(BaseModel):
    id: str
    input: dict | None = None
    lessons: list | None = None
    createdAt: str | None = None


class ActiveCoursePayload(BaseModel):
    courseId: str
    lessonId: str | None = None


class CoursePlanRequest(BaseModel):
    input: dict


class TemplatePayload(BaseModel):
    id: str
    name: str
    builtin: bool = False
    description: str = ""
    content: str = ""
    createdAt: str | None = None


class LessonPlanRequest(BaseModel):
    input: dict
    importCases: list | None = None


class PptRequest(BaseModel):
    input: dict
    pageCount: int = 10
    importCases: list | None = None
    lessonPlan: dict | None = None


class ImportCasesRequest(BaseModel):
    input: dict
    batch: int = 0


class AssignmentsRequest(BaseModel):
    input: dict
    quizCount: int = 5
    difficulty: str = "中等"
    importCases: list | None = None
    lessonPlan: dict | None = None


class RewriteProcessRequest(BaseModel):
    input: dict
    lessonPlan: dict


class RegenerateScriptRequest(BaseModel):
    input: dict
    page: dict
    lessonPlan: dict | None = None


class ExportDocxRequest(BaseModel):
    lessonPlan: dict


class ExportPptRequest(BaseModel):
    input: dict
    ppt: dict


class ExportPackageRequest(BaseModel):
    input: dict
    lessonPlan: dict
    ppt: dict
    assignments: dict
    importCases: list | None = None


# ---------- 健康检查 ----------

@app.get("/api/health")
def health():
    return {"ok": True}


# ---------- 课程记录 ----------

@app.get("/api/courses")
def list_courses():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM courses ORDER BY created_at DESC").fetchall()
    return [row_to_course(r) for r in rows]


@app.post("/api/courses")
def upsert_course(payload: CoursePayload):
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO courses (id, input, lessons, created_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                input=excluded.input,
                lessons=excluded.lessons,
                created_at=excluded.created_at
            """,
            (
                payload.id,
                serialize(payload.input),
                serialize(payload.lessons),
                payload.createdAt,
            ),
        )
    return {"ok": True}


@app.get("/api/courses/active")
def get_active_course():
    with get_conn() as conn:
        course_row = conn.execute("SELECT value FROM settings WHERE key = 'active_course_id'").fetchone()
        lesson_row = conn.execute("SELECT value FROM settings WHERE key = 'active_lesson_id'").fetchone()
    return {
        "courseId": course_row["value"] if course_row else None,
        "lessonId": lesson_row["value"] if lesson_row else None,
    }


@app.put("/api/courses/active")
def set_active_course(payload: ActiveCoursePayload):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES ('active_course_id', ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (payload.courseId,),
        )
        if payload.lessonId:
            conn.execute(
                "INSERT INTO settings (key, value) VALUES ('active_lesson_id', ?) "
                "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                (payload.lessonId,),
            )
        else:
            conn.execute("DELETE FROM settings WHERE key = 'active_lesson_id'")
    return {"ok": True}


@app.delete("/api/courses/active")
def clear_active_course():
    with get_conn() as conn:
        conn.execute("DELETE FROM settings WHERE key IN ('active_course_id', 'active_lesson_id')")
    return {"ok": True}


@app.get("/api/courses/{course_id}")
def get_course(course_id: str):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM courses WHERE id = ?", (course_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="课程不存在")
    return row_to_course(row)


@app.delete("/api/courses/{course_id}")
def delete_course(course_id: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM courses WHERE id = ?", (course_id,))
        active_course = conn.execute("SELECT value FROM settings WHERE key = 'active_course_id'").fetchone()
        if active_course and active_course["value"] == course_id:
            conn.execute("DELETE FROM settings WHERE key = 'active_lesson_id'")
        conn.execute("DELETE FROM settings WHERE key = 'active_course_id' AND value = ?", (course_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="课程不存在")
    return {"ok": True}


# ---------- 教案模板 ----------

def _row_to_template(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "builtin": bool(row["builtin"]),
        "description": row["description"] or "",
        "content": row["content"] or "",
        "createdAt": row["created_at"],
    }


@app.get("/api/templates")
def list_templates():
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
    return [DEFAULT_TEMPLATE] + [_row_to_template(r) for r in rows]


@app.post("/api/templates")
def upsert_template(payload: TemplatePayload):
    if payload.id == "default":
        raise HTTPException(status_code=400, detail="内置模板不可修改")
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO templates (id, name, builtin, description, content, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name=excluded.name,
                builtin=excluded.builtin,
                description=excluded.description,
                content=excluded.content,
                created_at=excluded.created_at
            """,
            (
                payload.id,
                payload.name,
                1 if payload.builtin else 0,
                payload.description,
                payload.content,
                payload.createdAt,
            ),
        )
    return {"ok": True}


@app.delete("/api/templates/{template_id}")
def delete_template(template_id: str):
    if template_id == "default":
        raise HTTPException(status_code=400, detail="内置模板不可删除")
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM templates WHERE id = ?", (template_id,))
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="模板不存在")
    return {"ok": True}


# ---------- AI 生成 ----------

@app.post("/api/ai/course-plan")
async def ai_course_plan(payload: CoursePlanRequest):
    return await ai_service.generate_course_plan(payload.input)


@app.post("/api/ai/lesson-plan")
async def ai_lesson_plan(payload: LessonPlanRequest):
    return await ai_service.generate_lesson_plan(payload.input, payload.importCases)


@app.post("/api/ai/ppt")
async def ai_ppt(payload: PptRequest):
    return await ai_service.generate_ppt(payload.input, payload.pageCount, payload.importCases, payload.lessonPlan)


@app.post("/api/ai/import-cases")
async def ai_import_cases(payload: ImportCasesRequest):
    return await ai_service.generate_import_cases(payload.input, payload.batch)


@app.post("/api/ai/assignments")
async def ai_assignments(payload: AssignmentsRequest):
    return await ai_service.generate_assignments(
        payload.input, payload.quizCount, payload.difficulty, payload.importCases, payload.lessonPlan
    )


@app.post("/api/ai/rewrite-process")
async def ai_rewrite_process(payload: RewriteProcessRequest):
    return await ai_service.rewrite_process(payload.input, payload.lessonPlan)


@app.post("/api/ai/regenerate-script")
async def ai_regenerate_script(payload: RegenerateScriptRequest):
    return await ai_service.regenerate_script(payload.input, payload.page, payload.lessonPlan)


# ---------- 文件导出（Word / PPT） ----------

def _download_headers(filename: str) -> dict:
    """返回附件下载所需的响应头，中文文件名用 RFC 5987 编码。"""
    quoted = urllib.parse.quote(filename)
    return {"Content-Disposition": f"attachment; filename*=UTF-8''{quoted}"}


@app.post("/api/export/lesson-plan")
def export_lesson_plan(payload: ExportDocxRequest):
    plan = payload.lessonPlan
    if not isinstance(plan, dict):
        raise HTTPException(status_code=400, detail="教案内容不是有效对象")
    try:
        data = exporters.build_lesson_plan_docx(plan)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"教案导出失败：{exc}") from exc
    meta = plan.get("meta") or {}
    topic = exporters.sanitize_filename(meta.get("topic")) or "教案"
    return StreamingResponse(
        io.BytesIO(data),
        media_type=DOCX_MIME,
        headers=_download_headers(f"{topic}-教案.docx"),
    )


@app.post("/api/export/ppt")
def export_ppt(payload: ExportPptRequest):
    pages = (payload.ppt or {}).get("pages")
    if not isinstance(pages, list) or not pages:
        raise HTTPException(status_code=400, detail="PPT 大纲为空，无法导出")
    try:
        data = exporters.build_ppt_pptx(payload.input, payload.ppt)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"PPT 导出失败：{exc}") from exc
    topic = exporters.sanitize_filename((payload.input or {}).get("topic")) or "课件"
    return StreamingResponse(
        io.BytesIO(data),
        media_type=PPTX_MIME,
        headers=_download_headers(f"{topic}-PPT.pptx"),
    )


@app.post("/api/export/package")
def export_package(payload: ExportPackageRequest):
    """备课包：教案 docx + 课件 pptx + 作业测验 txt + 导入案例 txt，打包成 zip 下载。"""
    plan = payload.lessonPlan
    if not isinstance(plan, dict):
        raise HTTPException(status_code=400, detail="教案内容不是有效对象")
    try:
        data = exporters.build_teaching_package_zip(
            payload.input, plan, payload.ppt, payload.assignments, payload.importCases
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=f"备课包导出失败：{exc}") from exc
    topic = (payload.input or {}).get("topic")
    topic = exporters.sanitize_filename(topic) if topic else "备课包"
    return StreamingResponse(
        io.BytesIO(data),
        media_type=ZIP_MIME,
        headers=_download_headers(f"{topic}-备课包.zip"),
    )
