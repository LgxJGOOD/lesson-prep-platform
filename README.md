# 老师备课搭子 · AI 课程备课平台

面向高校教师的 AI 备课工作台：从「新建课程」到「导出可直接上课的教案与课件」，全流程线上完成。

> 已交付一线教师日常使用，独立完成需求沟通 → 架构设计 → 开发 → 云服务器部署运维全链路。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19、Vite、React Router、Tailwind CSS、@phosphor-icons/react |
| 后端 | FastAPI、Uvicorn、SQLite |
| AI | Coze 大模型工作流（多步提示编排）、知识库检索 |
| 导出 | Python 生成 Word（docx）/ PPTX 结构化文档 |

## 核心流程

平台按教师真实备课顺序拆成 8 个环节，每一步的产出自动成为下一步的输入：

```
新建课程 → 课程规划 → 教案 → 导入案例 → 作业测验 → PPT 大纲 → 备课包 → 导出
```

- **课程规划**：拆解知识点、教学目标、重点、难点
- **教案生成**：按课时输出完整教学设计（环节、时间分配、师生活动）
- **导入案例 / 作业测验**：按知识点自动匹配案例与习题
- **PPT 大纲 → 备课包**：把前序内容汇总成可直接授课的结构
- **一键导出**：Word 教案 + PPTX 课件，教师无需再排版

## 目录结构

```
├── src/
│   ├── pages/            # 8 个环节页面（Home / NewCourse / CoursePlan / LessonPlan /
│   │                     #   ImportCases / Assignments / PptOutline / LessonPackage）
│   ├── components/       # 侧边导航、课程-课时联动导航等
│   └── ...
├── backend/
│   ├── main.py           # FastAPI 入口与路由
│   ├── ai_service.py     # Coze 工作流调用（Token 走环境变量）
│   ├── database.py       # SQLite 数据访问
│   ├── exporters.py      # Word / PPTX 导出
│   └── mock_data.py      # 演示数据（无 Token 时可用）
├── Coze工作流描述.txt      # 工作流节点的设计说明
└── 部署说明.md
```

## 本地运行

**后端**

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env        # 填入 COZE_TOKEN / COZE_MAIN_ENDPOINT
uvicorn main:app --reload --port 8000
```

**前端**

```bash
npm install
npm run dev                    # 默认 http://localhost:5173
```

未配置 Coze Token 时，后端会回退到 `mock_data.py` 的演示数据，界面和流程仍可完整体验。

## 设计取舍

- **环节之间用「当前课程 / 当前课时」串起来**：教师不需要反复选择上下文，符合真实备课的线性心智；
- **大模型输出必须结构化**：导出 Word/PPTX 依赖固定字段，因此对模型返回做了字段校验与降级，避免教师拿到半成品；
- **前端不存业务状态**：所有备课数据落库，换设备、换浏览器进度不丢。

## 联系

刘冠湘 · 湖南第一师范学院 · 人工智能专业 · 2027 届
sxangus@qq.com
