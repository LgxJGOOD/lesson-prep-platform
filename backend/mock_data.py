"""模拟数据生成器。

当前阶段用 Python 复刻前端 mock 数据，保证全流程可跑通。
未来接入 Coze 时，这些函数可被真实工作流返回结果替换。
"""

from datetime import datetime

PROFILES = [
    {
        "re": ["医学", "临床", "护理", "药学", "生物", "生命", "健康"],
        "name": "医学",
        "crossTitle": "AI + 医学：从影像诊断到药物研发",
        "crossDesc": "在医学场景中，机器学习模型已广泛应用于医学影像识别（如肺结节筛查、眼底病变检测）与药物分子筛选。以「卷积神经网络识别 X 光片」为例，引导医学背景学生理解：数据标注质量如何影响诊断准确率，以及算法结论为何只能作为辅助、不能替代医生判断。",
        "cases": [
            {
                "title": "AI 读片：肺结节筛查准确率超过放射科医生？",
                "type": "新闻事件",
                "description": "某研究团队发布的深度学习模型在肺结节 CT 影像识别任务中取得了接近甚至超过部分放射科医生的准确率，引发关于「AI 是否会取代医生」的讨论。",
                "questions": ["你认为 AI 在医疗中最适合承担哪一类任务？", "算法误诊的责任应由谁承担？"],
                "related": "机器学习中的监督学习、模型评估指标（准确率/召回率）",
            },
            {
                "title": "药物研发：AI 如何把十年周期缩短到几年",
                "type": "趣味演示",
                "description": "传统新药研发平均耗时超过十年、耗资巨大。AI 通过预测分子性质、筛选候选化合物，大幅缩短了早期研发周期。",
                "questions": ["为什么「预测分子活性」适合用机器学习？", "数据不足时，AI 还能发挥作用吗？"],
                "related": "回归与分类任务、特征工程",
            },
            {
                "title": "可穿戴设备与健康监测：你的手表在学什么",
                "type": "趣味演示",
                "description": "智能手表通过心率、睡眠等传感器数据，学习你的健康基线，并对异常发出提醒。",
                "questions": ["这种「异常检测」背后可能用了什么方法？", "健康数据被误判会带来什么后果？"],
                "related": "异常检测、时序数据、隐私与伦理",
            },
        ],
    },
    {
        "re": ["金融", "经济", "财经", "会计", "投资", "保险"],
        "name": "金融",
        "crossTitle": "AI + 金融：风控、量化与智能投顾",
        "crossDesc": "金融行业是机器学习落地最成熟的领域之一。以「信用卡欺诈检测」和「量化交易」为例，说明模型如何在大量交易数据中识别异常模式，以及模型可解释性在金融合规中的重要性。",
        "cases": [
            {
                "title": "信用卡欺诈检测：毫秒级拦截背后的模型",
                "type": "新闻事件",
                "description": "银行系统每天处理海量交易，反欺诈模型需要在毫秒内判断一笔交易是否为欺诈，并尽量降低对正常用户的误拦截。",
                "questions": ["为什么反欺诈对「误报」非常敏感？", "欺诈模式不断变化，模型该如何应对？"],
                "related": "分类问题、类别不平衡、模型更新",
            },
            {
                "title": "量化交易：算法在股市里如何做决策",
                "type": "趣味演示",
                "description": "量化基金利用历史行情与另类数据训练模型，自动生成买卖信号。",
                "questions": ["历史数据一定能预测未来吗？", "模型同质化会带来什么系统性风险？"],
                "related": "时间序列预测、过拟合",
            },
            {
                "title": "智能投顾：人人都能拥有的理财助手",
                "type": "争议话题",
                "description": "智能投顾根据用户风险偏好自动配置资产组合，降低了理财门槛，但也带来「算法是否足够了解我」的疑问。",
                "questions": ["你愿意让算法替你管理资产吗？", "算法推荐的公平性如何保证？"],
                "related": "推荐系统、用户画像、AI 伦理",
            },
        ],
    },
    {
        "re": ["艺术", "设计", "美术", "音乐", "影视", "传媒", "动画"],
        "name": "艺术",
        "crossTitle": "AI + 艺术：生成式创作与人类创造力",
        "crossDesc": "以「AI 绘画与音乐生成」为切入点，讲解生成式模型如何学习风格并创作新内容，同时引导学生思考：当机器能「创作」时，人类艺术家的独特价值在哪里？版权又该如何界定？",
        "cases": [
            {
                "title": "AI 绘画获奖：艺术还是算法？",
                "type": "争议话题",
                "description": "一幅由 AI 生成的画作在艺术比赛中获奖，引发关于「作者是谁」「是否算创作」的激烈争论。",
                "questions": ["AI 作品有「作者」吗？", "如果 AI 模仿了某位画家的风格，是否侵权？"],
                "related": "生成式模型、风格迁移、版权与伦理",
            },
            {
                "title": "从文本到音乐：一句话生成一首歌",
                "type": "趣味演示",
                "description": "输入一段描述，AI 就能生成配乐。影视、游戏行业已开始用它快速制作 demo。",
                "questions": ["AI 生成音乐适合用在哪些场景？", "它会取代配乐师吗？"],
                "related": "生成式模型、序列建模",
            },
            {
                "title": "AI 修图与虚拟偶像",
                "type": "新闻事件",
                "description": "AI 修图、换脸与虚拟偶像技术普及，模糊了真实与虚拟的边界。",
                "questions": ["「真实」在数字时代还重要吗？", "深度伪造可能带来哪些风险？"],
                "related": "计算机视觉、深度伪造、AI 伦理",
            },
        ],
    },
    {
        "re": ["法学", "法律"],
        "name": "法学",
        "crossTitle": "AI + 法律：算法决策与责任归属",
        "crossDesc": "以「AI 辅助判案、法律文书生成、算法歧视」为例，讨论自动化决策中的公平、透明与责任问题，帮助法学背景学生理解技术背后的价值判断。",
        "cases": [
            {
                "title": "算法量刑：更公平还是更偏见？",
                "type": "争议话题",
                "description": "一些地区使用风险评估算法辅助量刑，但研究发现算法可能放大历史数据中的种族与社会偏见。",
                "questions": ["算法能比法官更「客观」吗？", "如何审计一个算法的公平性？"],
                "related": "算法偏见、可解释性、AI 伦理",
            },
            {
                "title": "自动驾驶事故：谁该负责？",
                "type": "争议话题",
                "description": "自动驾驶车辆发生事故时，责任归属涉及车主、车企、算法开发者等多方主体。",
                "questions": ["事故责任应如何划分？", "「算法决策」能被追责吗？"],
                "related": "自主系统、责任伦理",
            },
            {
                "title": "AI 写合同：律师会被替代吗？",
                "type": "新闻事件",
                "description": "法律 AI 已能自动起草和审查合同，大幅提升效率。",
                "questions": ["哪些法律工作最容易被自动化？", "AI 给出的法律建议可信吗？"],
                "related": "自然语言处理、专业领域 AI 应用",
            },
        ],
    },
    {
        "re": ["新闻", "传播", "中文", "文学", "文科", "语言", "教育", "历史", "哲学"],
        "name": "文科",
        "crossTitle": "AI + 人文：内容生产、信息茧房与价值对齐",
        "crossDesc": "以「AI 写作、内容推荐与信息茧房」为例，讲解语言模型与推荐系统如何影响信息传播，引导人文社科背景学生关注技术对社会与价值观的塑造。",
        "cases": [
            {
                "title": "AI 写新闻：效率与真实的博弈",
                "type": "新闻事件",
                "description": "新闻机构开始用 AI 自动生成财经快讯、体育战报，但「AI 幻觉」也可能编造事实。",
                "questions": ["AI 生成内容如何保证真实？", "读者是否有权知道内容由 AI 生成？"],
                "related": "语言模型、幻觉问题、媒介伦理",
            },
            {
                "title": "信息茧房：推荐算法把我们困住了吗？",
                "type": "争议话题",
                "description": "推荐算法根据兴趣持续推送相似内容，可能让用户视野越来越窄。",
                "questions": ["信息茧房是算法造成的吗？", "平台应承担怎样的责任？"],
                "related": "推荐系统、算法与价值观",
            },
            {
                "title": "AI 写诗：机器有「文采」吗？",
                "type": "趣味演示",
                "description": "语言模型可以模仿古典诗词风格创作，引发对「文学创作本质」的讨论。",
                "questions": ["机器写出的文字算文学吗？", "人类创作不可替代的部分是什么？"],
                "related": "语言模型、生成式 AI",
            },
        ],
    },
    {
        "re": ["计算机", "软件", "信息", "人工智能", "电子", "通信", "自动化", "数据", "网络"],
        "name": "计算机",
        "crossTitle": "AI + 计算机：从模型原理到工程落地",
        "crossDesc": "面向计算机背景学生，侧重技术原理与工程实践：以「模型训练、过拟合与部署」为例，说明从数据到上线服务的完整链路，并强调模型评估与可复现性。",
        "cases": [
            {
                "title": "GitHub Copilot：程序员的新搭档",
                "type": "新闻事件",
                "description": "AI 编程助手能根据注释和上下文自动补全代码，改变了许多开发者的工作方式。",
                "questions": ["AI 生成的代码可以直接信任吗？", "开发者需要具备哪些新能力？"],
                "related": "大语言模型、代码生成",
            },
            {
                "title": "一个会「过拟合」的人脸识别系统",
                "type": "趣味演示",
                "description": "训练集上准确率 99%，一到真实场景就失效，这是过拟合的典型表现。",
                "questions": ["如何判断模型是否过拟合？", "有哪些方法可以缓解过拟合？"],
                "related": "过拟合与泛化、交叉验证",
            },
            {
                "title": "从训练到部署：一个模型的上线之路",
                "type": "趣味演示",
                "description": "训练好的模型要经过量化、压缩、部署才能提供在线服务，中间每一步都影响最终效果。",
                "questions": ["模型部署有哪些常见挑战？", "「推理延迟」为什么重要？"],
                "related": "模型部署、推理优化",
            },
        ],
    },
    {
        "re": ["管理", "商", "营销", "工商", "人力", "物流"],
        "name": "商科",
        "crossTitle": "AI + 商业：智能营销与运营决策",
        "crossDesc": "以「用户画像、智能推荐与需求预测」为例，讲解机器学习如何帮助企业做精细化运营，并讨论数据驱动决策的边界。",
        "cases": [
            {
                "title": "电商推荐：猜你喜欢是怎么做到的",
                "type": "趣味演示",
                "description": "电商平台根据浏览、点击、购买行为构建用户画像，实时推荐商品。",
                "questions": ["推荐系统依赖哪些数据？", "过度个性化会带来什么问题？"],
                "related": "推荐系统、用户画像",
            },
            {
                "title": "需求预测：让库存不多不少",
                "type": "新闻事件",
                "description": "零售企业用时间序列模型预测销量，优化补货，减少库存积压与缺货。",
                "questions": ["预测不准会带来什么损失？", "哪些因素最难预测？"],
                "related": "时间序列预测、回归",
            },
            {
                "title": "AI 客服：降本与体验的两难",
                "type": "争议话题",
                "description": "智能客服能 7×24 小时响应，但复杂问题常让用户感到「被踢皮球」。",
                "questions": ["AI 客服适合处理哪些问题？", "如何平衡效率与用户体验？"],
                "related": "对话系统、自然语言处理",
            },
        ],
    },
    {
        "re": ["机械", "土木", "建筑", "化工", "材料", "能源", "环境", "工程", "制造"],
        "name": "工科",
        "crossTitle": "AI + 工程：预测性维护与智能建造",
        "crossDesc": "以「设备预测性维护、结构健康监测」为例，讲解机器学习如何在工程领域实现从「事后维修」到「事前预警」的转变。",
        "cases": [
            {
                "title": "预测性维护：机器在坏之前就「知道」",
                "type": "新闻事件",
                "description": "工厂通过传感器采集振动、温度等数据，提前预测设备故障，避免非计划停机。",
                "questions": ["预测性维护依赖哪些数据？", "误报和漏报哪个代价更高？"],
                "related": "异常检测、时序数据",
            },
            {
                "title": "AI 质检：机器视觉替代人工目检",
                "type": "趣味演示",
                "description": "生产线上的机器视觉系统以远超人工的速度和稳定性检测产品缺陷。",
                "questions": ["机器视觉适合检测哪些缺陷？", "小样本缺陷如何训练模型？"],
                "related": "计算机视觉、缺陷检测",
            },
            {
                "title": "智能建造：BIM + AI 优化施工",
                "type": "趣味演示",
                "description": "AI 结合建筑信息模型，优化施工排期与安全管理。",
                "questions": ["AI 能解决哪些施工痛点？", "工地数据采集有什么难点？"],
                "related": "优化算法、计算机视觉",
            },
        ],
    },
]

GENERIC_PROFILE = {
    "name": "通用",
    "crossTitle": "AI + 跨学科应用案例",
    "crossDesc": "结合授课对象的专业背景，选取一个贴近其学习与未来工作的场景，说明人工智能技术如何与该领域结合，引导学生建立「AI + 专业」的迁移意识。",
    "cases": [
        {
            "title": "AI 正在改变我们的工作方式",
            "type": "新闻事件",
            "description": "从办公自动化到智能决策辅助，AI 工具正在进入各行各业，重新定义「效率」。",
            "questions": ["你所在专业中，哪些环节可能被 AI 改变？", "我们该如何与 AI 协作？"],
            "related": "人工智能概览、行业应用",
        },
        {
            "title": "一个身边的推荐系统",
            "type": "趣味演示",
            "description": "短视频、购物、音乐 App 都在用推荐算法「猜你喜欢」，其背后是机器学习对行为数据的学习。",
            "questions": ["推荐算法用了哪些信息？", "它如何影响你的选择？"],
            "related": "推荐系统、数据与隐私",
        },
        {
            "title": "当 AI 犯错：我们该信任它吗？",
            "type": "争议话题",
            "description": "AI 也会出错，从人脸识别误判到聊天机器人「一本正经地胡说八道」。",
            "questions": ["AI 犯错的原因有哪些？", "关键决策中人类应扮演什么角色？"],
            "related": "模型局限、AI 伦理",
        },
    ],
}


def get_major_profile(major: str) -> dict:
    m = (major or "").strip()
    for profile in PROFILES:
        if any(k in m for k in profile["re"]):
            return profile
    return GENERIC_PROFILE


def build_course_plan(inp: dict) -> list:
    """课程规划 mock 兜底：按总课时拆分为若干讲。"""
    profile = get_major_profile(inp.get("major"))
    course_name = inp.get("courseName") or "人工智能通识"
    total_hours = int(inp.get("totalHours") or 32)
    count = max(2, min(8, total_hours // 2))

    lessons = []
    for i in range(count):
        lessons.append(
            {
                "id": f"les-{i + 1}",
                "title": f"第 {i + 1} 讲 {course_name}（{i + 1}）",
                "hours": 2,
                "knowledgePoints": [
                    f"第 {i + 1} 讲核心概念",
                    f"第 {i + 1} 讲典型方法",
                ],
                "objectives": [f"理解第 {i + 1} 讲的核心内容"],
                "keyPoints": [f"第 {i + 1} 讲教学重点"],
                "difficulties": [f"第 {i + 1} 讲教学难点"],
            }
        )
    return lessons


def build_lesson_plan(inp: dict) -> dict:
    profile = get_major_profile(inp.get("major"))
    topic = inp.get("topic") or "人工智能通识"

    return {
        "meta": {
            "topic": topic,
            "hours": inp.get("hours") or 2,
            "audience": inp.get("audience") or "大一",
            "major": profile["name"],
            "template": inp.get("template") or "通用教案模板",
            "createdAt": datetime.now().isoformat(),
        },
        "objectives": [
            f"理解「{topic}」的核心概念与基本思想，能够用自己的话进行解释。",
            "掌握与本课相关的一到两个典型方法或案例，并能在教师引导下完成简单应用。",
            f"结合「{profile['crossTitle']}」的跨学科案例，建立 AI 技术与本专业融合的意识。",
            "通过课堂互动与讨论，培养对人工智能技术社会影响的批判性思考能力。",
        ],
        "keyPoints": [
            f"「{topic}」的核心概念、典型流程与关键术语。",
            "从具体案例中抽象出「数据、模型、结果」的基本范式。",
        ],
        "difficulties": [
            "理解抽象概念（如模型、特征、训练）与实际案例之间的对应关系。",
            "区分「相关」与「因果」，避免对 AI 结果的过度解读。",
        ],
        "process": [
            {
                "stage": "导入",
                "minutes": 5,
                "content": f"以「{profile['cases'][0]['title']}」作为开场案例，抛出问题引发兴趣，自然引出本节课主题「{topic}」。",
            },
            {
                "stage": "讲解",
                "minutes": max(20, (inp.get("hours") or 2) * 15),
                "content": f"围绕「{topic}」展开系统讲解：先讲清概念与背景，再结合贴近生活的例子拆解核心原理，最后小结本知识点的适用场景与边界。",
            },
            {
                "stage": "互动",
                "minutes": 15,
                "content": f"分组讨论「{profile['cases'][0]['questions'][0]}」，请学生结合自身专业发言；教师点评并引导到跨学科案例「{profile['crossTitle']}」。",
            },
            {
                "stage": "总结",
                "minutes": 5,
                "content": f"回顾本节课知识框架，强调「{topic}」与后续课程的衔接，布置课后作业。",
            },
        ],
        "resources": [
            "多媒体课件（含跨学科案例图文）",
            "课堂互动问卷 / 在线投票工具",
            "推荐阅读材料（AI 通识读本节选）",
            "配套演示视频或交互式 Demo 链接",
        ],
        "homeworkSummary": f"完成一份简短的「AI + {profile['name']}」观察报告，结合本节课「{topic}」的知识点，描述一个身边的 AI 应用并分析其原理。",
        "interdisciplinary": profile["crossDesc"],
    }


def _script_for(title: str, topic: str, profile: dict) -> str:
    return (
        f"各位同学好，这一页我们来看「{title}」。先回顾一下上页提到的要点，再结合「{topic}」这条主线，把它讲透。"
        f"大家注意，这里有一个容易混淆的地方，我会用一个{profile['name']}相关的例子帮大家理解。如果有疑问，可以随时打断我。"
    )


def build_ppt(inp: dict, page_count: int = 10) -> dict:
    profile = get_major_profile(inp.get("major"))
    topic = inp.get("topic") or "人工智能通识"
    count = min(12, max(8, int(page_count or 10)))

    base_pages = [
        {"type": "cover", "title": topic, "tag": None, "points": ["课程名称", "授课教师", "授课对象"]},
        {"type": "import", "title": "课程导入：从一个身边的 AI 说起", "tag": None, "points": ["现象引入", "引发思考", "点明主题"]},
        {"type": "knowledge", "title": f"知识点一：{topic}的核心概念", "tag": None, "points": ["概念定义", "关键术语", "一个简单例子"]},
        {"type": "knowledge", "title": f"知识点二：{topic}的典型流程", "tag": None, "points": ["数据准备", "模型训练", "结果评估"]},
        {"type": "case", "title": profile["crossTitle"], "tag": f"AI+{profile['name']}案例", "points": ["案例背景", "技术原理", "专业启示"]},
        {"type": "interaction", "title": "课堂互动与讨论", "tag": None, "points": ["分组讨论", "观点分享", "教师点评"]},
        {"type": "knowledge", "title": f"知识点三：{topic}的应用与边界", "tag": None, "points": ["常见应用", "能力边界", "潜在风险"]},
        {"type": "summary", "title": "本课小结", "tag": None, "points": ["知识框架回顾", "核心要点", "与下一课的衔接"]},
        {"type": "homework", "title": "课后作业", "tag": None, "points": ["作业要求", "提交方式", "评分要点"]},
        {"type": "thanks", "title": "谢谢 · 欢迎讨论", "tag": None, "points": ["联系方式", "参考资料"]},
    ]

    pages = []
    if count <= 8:
        selected = [0, 1, 2, 4, 6, 7, 8, 9]
        pages = [base_pages[i] for i in selected]
    elif count == 9:
        selected = [0, 1, 2, 3, 4, 6, 7, 8, 9]
        pages = [base_pages[i] for i in selected]
    elif count == 10:
        pages = list(base_pages)
    else:
        pages = list(base_pages[:10])
        if count >= 11:
            pages.insert(6, {"type": "knowledge", "title": f"拓展：{topic}的进阶话题", "tag": None, "points": ["进阶概念", "发展方向"]})
        if count >= 12:
            pages.insert(8, {"type": "knowledge", "title": "拓展：AI 的社会影响", "tag": None, "points": ["就业影响", "伦理挑战"]})

    result = []
    for i, p in enumerate(pages):
        script = (
            f"这一页是我们今天的跨学科重点：{p['title']}。我会用{profile['name']}专业同学熟悉的场景展开，"
            f"把「{topic}」的技术点对应到具体问题上，帮助大家建立迁移意识。"
            if p["type"] == "case"
            else _script_for(p["title"], topic, profile)
        )
        result.append(
            {
                "id": i + 1,
                "title": p["title"],
                "type": p["type"],
                "tag": p["tag"],
                "points": p["points"],
                "script": script,
            }
        )

    return {"pages": result}


def build_import_cases(inp: dict, batch: int = 0) -> list:
    profile = get_major_profile(inp.get("major"))
    cases = profile["cases"]
    offset = batch % len(cases)
    rotated = cases[offset:] + cases[:offset]

    return [
        {
            "id": f"{batch}-{i}",
            "title": c["title"],
            "type": c["type"],
            "description": c["description"],
            "questions": c["questions"],
            "related": c["related"],
        }
        for i, c in enumerate(rotated[:3])
    ]


def build_assignments(inp: dict, quiz_count: int = 5, difficulty: str = "中等") -> dict:
    profile = get_major_profile(inp.get("major"))
    topic = inp.get("topic") or "人工智能通识"

    homework = [
        {
            "id": 1,
            "title": f"结合「{topic}」，观察并描述一个你身边的 AI 应用",
            "mode": "个人",
            "duration": "30 分钟",
            "criteria": "描述清晰、能指出其使用的数据与大致原理、有个人思考",
        },
        {
            "id": 2,
            "title": f"围绕「{profile['crossTitle']}」撰写 300 字案例分析",
            "mode": "个人",
            "duration": "45 分钟",
            "criteria": "案例真实、技术点对应准确、能提出至少一个开放问题",
        },
        {
            "id": 3,
            "title": "小组讨论：AI 在本专业中的机遇与风险",
            "mode": "小组",
            "duration": "课下 1 周",
            "criteria": "观点有依据、分工明确、能形成小组汇报提纲",
        },
    ]

    quiz_pool = [
        {
            "type": "单选",
            "question": f"关于「{topic}」中的「模型训练」，下列说法正确的是？",
            "options": ["A. 模型训练不需要数据", "B. 训练是让模型从数据中学习规律", "C. 训练一次后模型永远不用更新", "D. 训练结果与数据质量无关"],
            "answer": "B",
            "analysis": "模型训练的本质是从数据中学习规律，数据质量会直接影响模型效果。",
        },
        {
            "type": "单选",
            "question": "在监督学习中，训练数据通常需要包含什么？",
            "options": ["A. 只有输入", "B. 只有输出", "C. 输入和对应的标签", "D. 都不需要"],
            "answer": "C",
            "analysis": "监督学习需要「输入与标签」成对的数据，让模型学习输入到输出的映射。",
        },
        {
            "type": "多选",
            "question": f"以下哪些属于「{topic}」可能带来的社会影响？",
            "options": ["A. 提高生产效率", "B. 引发就业结构变化", "C. 带来隐私与伦理挑战", "D. 完全消除人类劳动"],
            "answer": "ABC",
            "analysis": "AI 提升效率的同时会改变就业结构并带来伦理挑战，但「完全消除人类劳动」是过度夸大。",
        },
        {
            "type": "判断",
            "question": "数据量越大，模型效果一定越好，不存在任何反例。",
            "options": ["正确", "错误"],
            "answer": "错误",
            "analysis": "数据量大但质量差、标注错误或与任务无关时，模型效果未必更好。",
        },
        {
            "type": "判断",
            "question": "AI 系统的判断结果可以无条件替代人类在关键场景中的决策。",
            "options": ["正确", "错误"],
            "answer": "错误",
            "analysis": "AI 结果受数据与算法局限影响，关键决策仍需人类把关。",
        },
        {
            "type": "简答",
            "question": f"请用自己的话解释「{topic}」中的一个核心概念，并举一个例子。",
            "options": [],
            "answer": "（开放题，言之成理即可）",
            "analysis": "重点考察对概念的理解与迁移能力，不要求标准答案。",
        },
        {
            "type": "简答",
            "question": f"结合「{profile['crossTitle']}」，说明 AI 如何改变{profile['name']}领域的工作方式。",
            "options": [],
            "answer": "（开放题，言之成理即可）",
            "analysis": "考察跨学科迁移意识，能结合具体场景说明即可。",
        },
    ]

    quiz = list(quiz_pool)
    if difficulty == "简单":
        quiz = [q for q in quiz_pool if q["type"] != "简答"]
    elif difficulty == "较难":
        quiz = list(reversed(quiz_pool))

    count = min(8, max(2, int(quiz_count or 5)))
    quiz = [{**q, "id": i + 1} for i, q in enumerate(quiz[:count])]

    return {"homework": homework, "quiz": quiz}


def rewrite_lesson_process(inp: dict, lesson_plan: dict) -> list:
    process = lesson_plan.get("process") or []
    audience = (inp or {}).get("audience") or "授课对象"
    rotated = process[1:] + process[:1]
    return [
        {**p, "content": f"{p['content']}（已根据「{audience}」重新组织）"}
        for p in rotated
    ]


def regenerate_slide_script(inp: dict, page: dict) -> str:
    topic = (inp or {}).get("topic") or "本课主题"
    major = (inp or {}).get("major") or "专业"
    title = (page or {}).get("title") or "这一页"
    return (
        f"（重新生成）{title}：各位同学，我们重点来看这一页。结合「{topic}」以及{major}背景，"
        "我补充几个更容易理解的例子，帮助大家把要点落到实际场景中。"
    )
