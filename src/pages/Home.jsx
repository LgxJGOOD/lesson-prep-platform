import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plus, Trash, ClipboardText, Eye, DownloadSimple } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import Reveal from '../components/Reveal'
import TemplateModal from '../components/TemplateModal'
import {
  getCourses,
  removeCourse,
  getTemplates,
  removeTemplate,
  saveTemplate,
  createTemplateId,
} from '../lib/storage'
import { sanitizeFilename } from '../lib/filename'

function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { restoreFromCourse } = useLesson()

  const [courses, setCourses] = useState([])
  const [templates, setTemplates] = useState([])
  const [fileError, setFileError] = useState('')
  const [viewTemplate, setViewTemplate] = useState(null)

  const refresh = async () => {
    const [courseData, templateData] = await Promise.all([getCourses(), getTemplates()])
    setCourses(courseData)
    setTemplates(templateData)
  }

  useEffect(() => {
    refresh()
  }, [])

  // 处理导航栏的锚点跳转
  useEffect(() => {
    if (location.hash === '#history') {
      document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })
    } else if (location.hash === '#templates') {
      document.getElementById('templates')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash])

  const openCourse = (course) => {
    restoreFromCourse(course)
    navigate('/course-plan')
  }

  const deleteCourse = async (e, id) => {
    e.stopPropagation()
    if (window.confirm('确定删除这门课程吗？')) {
      await removeCourse(id)
      refresh()
    }
  }

  const deleteTemplate = async (id) => {
    if (window.confirm('确定删除这个模板吗？')) {
      await removeTemplate(id)
      refresh()
    }
  }

  const downloadTemplate = (t) => {
    const content = t.content || '该模板暂无内容。'
    const ext = content.trim().startsWith('{') ? 'json' : 'md'
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFilename(t.name, '模板')}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUploadTemplate = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      await saveTemplate({
        id: createTemplateId(),
        name: file.name.replace(/\.[^.]+$/, '') || '自定义模板',
        builtin: false,
        description: '自定义上传模板',
        content: typeof reader.result === 'string' ? reader.result : '',
        createdAt: new Date().toISOString(),
      })
      refresh()
      setFileError('')
    }
    reader.onerror = () => setFileError('文件读取失败，请重试')
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-8">
      {/* 顶部欢迎与新建入口 */}
      <section className="card overflow-hidden">
        <div className="hero-panel relative overflow-hidden px-6 py-10 text-white md:px-10 md:py-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="relative">
            <p className="animate-fade-up text-xs font-medium uppercase tracking-[0.18em] text-brand-300">AI 通识拓展课 · 教学辅助</p>
            <h1 className="animate-fade-up mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-white md:text-4xl" style={{ animationDelay: '80ms' }}>
              欢迎使用 AI 通识课备课助手
            </h1>
            <p className="animate-fade-up mt-3 max-w-2xl text-sm leading-relaxed text-brand-100 md:text-base" style={{ animationDelay: '160ms' }}>
              输入课程信息与总课时，AI 自动规划每节课的教学大纲，再逐课生成教案、PPT 大纲与讲稿、课堂导入案例和作业测验。
            </p>
            <Link to="/new" className="animate-fade-up mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-brand-50 active:scale-[0.98]" style={{ animationDelay: '240ms' }}>
              <Plus size={18} weight="bold" /> 新建课程
            </Link>
          </div>
        </div>
      </section>

      {/* 历史课程记录 */}
      <Reveal>
      <section id="history" className="scroll-mt-20">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">历史课程</h2>
          <span className="text-sm text-stone-400">{courses.length} 门</span>
        </div>

        {courses.length === 0 ? (
          <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <ClipboardText size={40} weight="light" className="text-stone-300" />
            <p className="text-sm text-stone-400">还没有课程，点击「新建课程」开始你的第一门课。</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((r) => {
              const total = r.lessons?.length || 0
              const done = r.lessons?.filter((l) => l.lessonPlan && l.ppt && l.importCases && l.assignments).length || 0
              return (
                <div
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openCourse(r)}
                  onKeyDown={(e) => {
                    // 只响应卡片本身获得焦点时的按键，避免和内部删除按钮冲突
                    if (e.target !== e.currentTarget) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openCourse(r)
                    }
                  }}
                  className="card group cursor-pointer p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-semibold text-stone-900 group-hover:text-brand-700">
                      {r.input?.courseName || '未命名课程'}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => deleteCourse(e, r.id)}
                      className="shrink-0 rounded-md p-1 text-stone-300 hover:text-red-500"
                      title="删除"
                      aria-label="删除课程"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-stone-400">{formatDate(r.createdAt)}</p>
                  <p className="mt-1 text-xs text-stone-500">{r.input?.audience || '未填写授课对象'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{total} 讲</span>
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">已生成 {done} 讲</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      </Reveal>

      {/* 教案模板 */}
      <Reveal delay={100}>
      <section id="templates" className="scroll-mt-20">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">教案模板</h2>
          <label className="cursor-pointer text-sm font-medium text-brand-600 hover:text-brand-700">
            上传自定义模板
            <input type="file" accept=".json,.txt,.md" className="hidden" onChange={handleUploadTemplate} />
          </label>
        </div>
        {fileError && <p className="mb-2 text-sm text-red-500">{fileError}</p>}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="card flex flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-stone-900">{t.name}</h3>
                {t.builtin ? (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">内置</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => deleteTemplate(t.id)}
                    className="rounded-md p-1 text-stone-300 hover:text-red-500"
                    title="删除模板"
                  >
                    <Trash size={16} />
                  </button>
                )}
              </div>
              <p className="mt-2 line-clamp-3 flex-1 text-xs text-stone-500">{t.description}</p>
              <div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setViewTemplate(t)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  <Eye size={15} weight="bold" /> 查看
                </button>
                <button
                  type="button"
                  onClick={() => downloadTemplate(t)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
                >
                  <DownloadSimple size={15} weight="bold" /> 下载
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      <TemplateModal template={viewTemplate} onClose={() => setViewTemplate(null)} />
    </div>
  )
}
