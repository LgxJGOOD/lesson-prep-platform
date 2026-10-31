"""教案 Word(.docx)、PPT(.pptx) 与备课包(.zip) 文件导出。

内容来自 AI 生成的结构化 JSON（lessonPlan / ppt 页面数组），在内存中拼装成
OpenXML 文件字节流返回给调用方（后端接口做流式响应）。
依赖：python-docx、python-pptx（已随 requirements.txt 安装）。
"""

import re
import zipfile
from io import BytesIO

from docx import Document
from docx.oxml.ns import qn as docx_qn
from docx.shared import Inches, Pt, RGBColor as DocxRGBColor

from pptx import Presentation
from pptx.dml.color import RGBColor as PptRGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml.ns import qn as pptx_qn
from pptx.util import Inches as PptInches
from pptx.util import Pt as PptPt

# 中文需要在 XML 里同时声明 latin 字体与东亚字体，否则回落默认字体
LATIN_FONT = "Microsoft YaHei"
EAST_ASIA_FONT = "微软雅黑"

# 品牌「深松绿」+ 暖纸色，与前端 tailwind 一致
GREEN_DARK = 0x275744
GREEN = 0x2F6B52
PAPER = 0xF7F5F1
INK = 0x1C3A2F
GRAY = 0x8A8F8B

INVALID_NAME_CHARS = re.compile(r'[\\/:*?"<>|\r\n\t]+')


def _hex_split(value: int):
    """把 0xRRGGBB 拆成 (r, g, b)，供 RGBColor 使用。"""
    return (value >> 16) & 0xFF, (value >> 8) & 0xFF, value & 0xFF


def sanitize_filename(name) -> str:
    """去掉文件名非法字符并压缩空白；返回空串时给默认名。"""
    if not name:
        return "导出"
    cleaned = INVALID_NAME_CHARS.sub("_", str(name))
    cleaned = re.sub(r"\s+", " ", cleaned).strip(" ._")
    return cleaned or "导出"


def _clean(items) -> list:
    """过滤数组里的空字符串 / None，保留可打印内容。"""
    if not items:
        return []
    out = []
    for x in items:
        if x is None:
            continue
        s = str(x).strip()
        if s:
            out.append(s)
    return out


# --------------------------------------------------------------------------
# Word（教案）
# --------------------------------------------------------------------------

def build_lesson_plan_docx(plan: dict) -> bytes:
    """把 lessonPlan 结构拼成 .docx 字节流。"""
    if not isinstance(plan, dict):
        raise ValueError("教案内容不是有效对象")

    meta = plan.get("meta") or {}
    topic = str(meta.get("topic") or "教案").strip() or "教案"

    doc = Document()
    _init_docx_styles(doc)
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # 标题
    _docx_para(doc, topic, size=20, bold=True, color=GREEN_DARK,
               align="center", space_after=2)

    # meta 行（课时 / 对象 / 专业 / 模板 / 生成时间）
    meta_parts = []
    if meta.get("hours"):
        meta_parts.append(f"{meta['hours']} 课时")
    if meta.get("audience"):
        meta_parts.append(f"授课对象：{meta['audience']}")
    if meta.get("major"):
        meta_parts.append(f"专业背景：{meta['major']}")
    if meta.get("template"):
        meta_parts.append(f"模板：{meta['template']}")
    created = meta.get("createdAt")
    if created:
        meta_parts.append(f"生成于 {str(created)[:16].replace('T', ' ')}")
    if meta_parts:
        _docx_para(doc, "　·　".join(meta_parts), size=9, color=GRAY,
                   align="center", space_after=12)

    # 一、教学目标
    _docx_heading(doc, "一、教学目标")
    _docx_numbered_list(doc, _clean(plan.get("objectives")))

    # 二、教学重难点
    _docx_heading(doc, "二、教学重难点")
    key_points = _clean(plan.get("keyPoints"))
    difficulties = _clean(plan.get("difficulties"))
    _docx_para(doc, "教学重点", size=12, bold=True, color=GREEN, space_after=2)
    _docx_bullet_list(doc, key_points)
    _docx_para(doc, "教学难点", size=12, bold=True, color=GREEN, space_after=2)
    _docx_bullet_list(doc, difficulties)

    # 三、教学过程
    _docx_heading(doc, "三、教学过程")
    process = plan.get("process")
    if isinstance(process, list) and process:
        for step in process:
            if not isinstance(step, dict):
                continue
            stage = str(step.get("stage") or "").strip()
            minutes = step.get("minutes")
            head = stage
            if minutes:
                head = f"{stage or '环节'}（{minutes} 分钟）"
            _docx_para(doc, head, size=12, bold=True, color=INK, space_after=1)
            content = str(step.get("content") or "").strip()
            if content:
                for line in content.splitlines():
                    line = line.strip()
                    if line:
                        _docx_para(doc, line, size=11, color=INK, indent=0.2, space_after=2)
    else:
        _docx_empty(doc)

    # 四、教学资源
    _docx_heading(doc, "四、教学资源")
    _docx_bullet_list(doc, _clean(plan.get("resources")))

    # 五、课后作业（简要）
    _docx_heading(doc, "五、课后作业（简要）")
    _docx_text_block(doc, plan.get("homeworkSummary"))

    # 六、跨学科案例融合
    _docx_heading(doc, "六、跨学科案例融合")
    _docx_text_block(doc, plan.get("interdisciplinary"))

    buf = BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _init_docx_styles(doc: Document) -> None:
    normal = doc.styles["Normal"]
    normal.font.name = LATIN_FONT
    normal.font.size = Pt(11)
    normal.font.color.rgb = DocxRGBColor(0x1C, 0x3A, 0x2F)
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.rFonts
    if rfonts is None:
        rfonts = rpr.get_or_add_rFonts()
    rfonts.set(docx_qn("w:eastAsia"), EAST_ASIA_FONT)


def _docx_run(p, text, size, bold, color, italic=False):
    run = p.add_run(text)
    run.font.name = LATIN_FONT
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = DocxRGBColor(*_hex_split(color))
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.get_or_add_rFonts()
    rfonts.set(docx_qn("w:eastAsia"), EAST_ASIA_FONT)
    return run


def _docx_para(doc, text="", size=11, bold=False, color=INK, align=None,
               indent=None, space_after=4, space_before=0, italic=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_after = Pt(space_after)
    pf.space_before = Pt(space_before)
    if indent is not None:
        pf.left_indent = Inches(indent)
    if align == "center":
        p.alignment = 1  # WD_ALIGN_PARAGRAPH.CENTER
    if text:
        _docx_run(p, text, size=size, bold=bold, color=color, italic=italic)
    return p


def _docx_heading(doc, text, before=14, after=6):
    return _docx_para(doc, text, size=14, bold=True, color=GREEN_DARK,
                      space_after=after, space_before=before)


def _docx_empty(doc):
    _docx_para(doc, "（暂无）", size=11, color=GRAY, italic=True, indent=0.2)


def _docx_numbered_list(doc, items):
    if not items:
        _docx_empty(doc)
        return
    for i, text in enumerate(items, 1):
        _docx_para(doc, f"{i}. {text}", size=11, color=INK, indent=0.2, space_after=2)


def _docx_bullet_list(doc, items):
    if not items:
        _docx_empty(doc)
        return
    for text in items:
        _docx_para(doc, f"• {text}", size=11, color=INK, indent=0.2, space_after=2)


def _docx_text_block(doc, value):
    text = str(value or "").strip()
    if not text:
        _docx_empty(doc)
        return
    for line in text.splitlines():
        line = line.strip()
        if line:
            _docx_para(doc, line, size=11, color=INK, space_after=2)


# --------------------------------------------------------------------------
# PowerPoint（PPT 大纲）
# --------------------------------------------------------------------------

SLIDE_W = 13.333
SLIDE_H = 7.5


def build_ppt_pptx(input_: dict, ppt: dict) -> bytes:
    """把 { pages: [{title, tag, points, script, animationPrompt}], ... } 拼成 .pptx。

    版式：一张封面 + 每页一张内容页。
    - 页面：顶部细条 + 标签 + 课时主题；居中大标题；核心要点列表；页脚页码。
    - 备注：讲师讲稿放入该页「演讲者备注」（动画提示一并附后），保持页面干净。
    """
    pages = (ppt or {}).get("pages")
    if not isinstance(pages, list) or not pages:
        raise ValueError("PPT 大纲为空，无法导出")

    input_ = input_ or {}
    topic = str(input_.get("topic") or "").strip() or "教学课件"

    prs = Presentation()
    prs.slide_width = PptInches(SLIDE_W)
    prs.slide_height = PptInches(SLIDE_H)
    try:
        blank = prs.slide_layouts[6]  # Blank
    except IndexError:
        blank = prs.slide_layouts[-1]

    _ppt_cover(
        prs, blank,
        topic=topic,
        audience=input_.get("audience"),
        major=input_.get("major"),
        hours=input_.get("hours"),
    )

    total = len(pages)
    for idx, page in enumerate(pages, 1):
        if not isinstance(page, dict):
            page = {"title": str(page)}
        _ppt_content_slide(
            prs, blank, page, lesson_topic=topic, index=idx, total=total,
        )

    buf = BytesIO()
    prs.save(buf)
    return buf.getvalue()


def _ppt_cover(prs, layout, topic, audience, major, hours):
    slide = prs.slides.add_slide(layout)
    # 深绿背景
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, PptInches(SLIDE_W), PptInches(SLIDE_H))
    bg.fill.solid()
    bg.fill.fore_color.rgb = PptRGBColor(*_hex_split(GREEN_DARK))
    bg.line.fill.background()

    # 左上角点缀：细条 + 标签文字
    accent = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, PptInches(1.0), PptInches(0.9), PptInches(0.9), PptInches(0.14)
    )
    accent.fill.solid()
    accent.fill.fore_color.rgb = PptRGBColor(*_hex_split(PAPER))
    accent.line.fill.background()

    # 主标题
    tf = _ppt_textbox(slide, 1.0, 2.35, 11.33, 2.0, anchor=MSO_ANCHOR.TOP)
    _ppt_para(tf, topic, size=40, bold=True, color=0xFFFFFF, first=True, line_spacing=1.05)

    # 副信息
    sub = []
    if audience:
        sub.append(f"授课对象　{audience}")
    if major:
        sub.append(f"专业背景　{major}")
    if hours:
        sub.append(f"{hours} 课时")
    if sub:
        tf2 = _ppt_textbox(slide, 1.02, 4.6, 11.3, 1.0)
        _ppt_para(tf2, "　·　".join(sub), size=16, color=0xDDECE3, first=True)

    tf3 = _ppt_textbox(slide, 1.0, 6.6, 11.3, 0.5)
    _ppt_para(tf3, "AI 通识拓展课 · 备课助手", size=12, color=0x92BCA6, first=True)


def _ppt_content_slide(prs, layout, page, lesson_topic, index, total):
    slide = prs.slides.add_slide(layout)

    # 暖纸色页面背景
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, PptInches(SLIDE_W), PptInches(SLIDE_H))
    bg.fill.solid()
    bg.fill.fore_color.rgb = PptRGBColor(*_hex_split(PAPER))
    bg.line.fill.background()

    # 顶部品牌绿细条
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, PptInches(SLIDE_W), PptInches(0.12))
    bar.fill.solid()
    bar.fill.fore_color.rgb = PptRGBColor(*_hex_split(GREEN))
    bar.line.fill.background()

    title = str(page.get("title") or f"第 {index} 页").strip()
    tag = str(page.get("tag") or "").strip()
    points = _clean(page.get("points"))

    # 顶部小字：左侧标签徽标，右侧课时主题
    if tag:
        _ppt_para(_ppt_textbox(slide, 0.9, 0.42, 6.0, 0.5), tag, size=13, bold=True,
                  color=GREEN, first=True)
    _ppt_para(_ppt_textbox(slide, 7.2, 0.42, 5.2, 0.5), lesson_topic, size=12,
              color=GRAY, align=PP_ALIGN.RIGHT, first=True)

    # 标题（按长度微调字号）
    size = 30 if len(title) <= 16 else 26
    tf_title = _ppt_textbox(slide, 0.9, 1.45, 11.5, 1.1)
    _ppt_para(tf_title, title, size=size, bold=True, color=INK, first=True)

    # 分隔细线
    rule = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, PptInches(0.92), PptInches(2.72), PptInches(0.6), PptInches(0.05)
    )
    rule.fill.solid()
    rule.fill.fore_color.rgb = PptRGBColor(*_hex_split(GREEN))
    rule.line.fill.background()

    # 核心要点
    if not points:
        points = ["（本页无要点）"]
    # 文字过多时适当缩小，保证一页放得下
    total_chars = sum(len(p) for p in points)
    bullet_size = 18 if total_chars <= 500 else 16
    tf_points = _ppt_textbox(slide, 0.95, 3.0, 11.45, 3.2)
    for i, p in enumerate(points):
        _ppt_para(tf_points, f"•  {p}", size=bullet_size, color=INK,
                  first=(i == 0), space_after=10, line_spacing=1.12)

    # 页脚页码
    tf_footer = _ppt_textbox(slide, 0.9, 6.95, 11.5, 0.4)
    _ppt_para(tf_footer, f"{index} / {total}", size=11, color=GRAY,
              align=PP_ALIGN.RIGHT, first=True)

    # 备注：讲师讲稿 + 动画提示
    note_parts = []
    script = page.get("script")
    if script and str(script).strip():
        note_parts.append(str(script).strip())
    animation = page.get("animationPrompt")
    if animation and str(animation).strip():
        note_parts.append("【动画提示】" + str(animation).strip())
    if note_parts:
        slide.notes_slide.notes_text_frame.text = "\n".join(note_parts)


def _ppt_textbox(slide, x, y, w, h, anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(PptInches(x), PptInches(y), PptInches(w), PptInches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.margin_left = tf.margin_right = PptInches(0.05)
    tf.margin_top = tf.margin_bottom = PptInches(0)
    tf.vertical_anchor = anchor
    return tf


def _ppt_para(tf, text, size, bold=False, color=INK, align=PP_ALIGN.LEFT,
              first=False, space_after=0, space_before=0, line_spacing=1.0):
    p = tf.paragraphs[0] if first else tf.add_paragraph()
    p.alignment = align
    p.line_spacing = line_spacing
    if space_before:
        p.space_before = PptPt(space_before)
    p.space_after = PptPt(space_after)

    run = p.add_run()
    run.text = text
    run.font.size = PptPt(size)
    run.font.bold = bold
    run.font.color.rgb = PptRGBColor(*_hex_split(color))
    run.font.name = LATIN_FONT
    rpr = run._r.get_or_add_rPr()
    ea = rpr.find(pptx_qn("a:ea"))
    if ea is None:
        ea = rpr.makeelement(pptx_qn("a:ea"), {})
        rpr.append(ea)
    ea.set("typeface", EAST_ASIA_FONT)
    return p


# --------------------------------------------------------------------------
# 备课包（zip：教案 docx + 课件 pptx + 作业测验 txt）
# --------------------------------------------------------------------------

def build_assignments_txt(topic: str, assignments: dict) -> bytes:
    """把课后作业与测验题拼成纯文本。

    用 UTF-8 BOM + CRLF，双击用 Windows 记事本打开不会乱码。
    """
    homework = (assignments or {}).get("homework")
    quiz = (assignments or {}).get("quiz")
    homework = homework if isinstance(homework, list) else []
    quiz = quiz if isinstance(quiz, list) else []

    lines = [f"{topic} · 作业与测验", "=" * 32, ""]

    lines += ["一、课后作业", ""]
    if homework:
        for i, item in enumerate(homework, 1):
            if not isinstance(item, dict):
                continue
            lines.append(f"{i}. {str(item.get('title') or '（未命名作业）').strip()}")
            meta = []
            if item.get("mode"):
                meta.append(f"完成形式：{item['mode']}")
            if item.get("duration"):
                meta.append(f"预计用时：{item['duration']}")
            if meta:
                lines.append("   " + "    ".join(meta))
            criteria = str(item.get("criteria") or "").strip()
            if criteria:
                lines.append(f"   评分要点：{criteria}")
            lines.append("")
    else:
        lines += ["（暂无）", ""]

    lines += ["二、测验题", ""]
    if quiz:
        for i, item in enumerate(quiz, 1):
            if not isinstance(item, dict):
                continue
            qtype = str(item.get("type") or "").strip()
            prefix = f"{i}. " + (f"【{qtype}】" if qtype else "")
            lines.append(prefix + str(item.get("question") or "").strip())
            options = item.get("options")
            if isinstance(options, list):
                for opt in options:
                    text = str(opt).strip()
                    if text:
                        lines.append(f"   {text}")
            answer = str(item.get("answer") or "").strip()
            if answer:
                lines.append(f"   参考答案：{answer}")
            analysis = str(item.get("analysis") or "").strip()
            if analysis:
                lines.append(f"   解析：{analysis}")
            lines.append("")
    else:
        lines += ["（暂无）", ""]

    return "\r\n".join(lines).encode("utf-8-sig")


def build_import_cases_txt(topic: str, cases) -> bytes:
    """把课堂导入案例拼成纯文本（UTF-8 BOM + CRLF，便于记事本打开）。"""
    items = cases if isinstance(cases, list) else []

    lines = [f"{topic} · 课堂导入案例", "=" * 32, ""]

    if items:
        for i, item in enumerate(items, 1):
            if not isinstance(item, dict):
                continue
            title = str(item.get("title") or f"案例 {i}").strip()
            ctype = str(item.get("type") or "").strip()
            lines.append(f"{i}. {title}" + (f"　【{ctype}】" if ctype else ""))
            description = str(item.get("description") or "").strip()
            if description:
                lines.append(f"   {description}")
            questions = item.get("questions")
            if isinstance(questions, list) and questions:
                lines.append("   讨论问题：")
                for q in questions:
                    text = str(q).strip()
                    if text:
                        lines.append(f"   · {text}")
            related = str(item.get("related") or "").strip()
            if related:
                lines.append(f"   关联知识点：{related}")
            lines.append("")
    else:
        lines += ["（暂无）", ""]

    return "\r\n".join(lines).encode("utf-8-sig")


def build_teaching_package_zip(input_: dict, lesson_plan: dict, ppt: dict,
                               assignments: dict, import_cases=None) -> bytes:
    """把教案、课件、作业测验与导入案例打包成一个 zip 字节流。"""
    input_ = input_ or {}
    raw_topic = input_.get("topic")
    topic = sanitize_filename(raw_topic) if raw_topic else "备课包"

    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"{topic}-教案.docx", build_lesson_plan_docx(lesson_plan))
        zf.writestr(f"{topic}-课件.pptx", build_ppt_pptx(input_, ppt))
        zf.writestr(f"{topic}-作业与测验.txt", build_assignments_txt(topic, assignments))
        zf.writestr(f"{topic}-导入案例.txt", build_import_cases_txt(topic, import_cases))
    return buf.getvalue()
