import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  House,
  Plus,
  MapTrifold,
  Article,
  PresentationChart,
  Lightbulb,
  ClipboardText,
  Package,
  ClockCounterClockwise,
  FileText,
  Check,
  X,
} from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'

function Logo() {
  return (
    <img
      src="/logo.jpg"
      alt="AI 通识课备课助手"
      className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/15"
    />
  )
}

const workflowSteps = [
  { to: '/new', label: '新建课程', icon: Plus, doneKey: 'new' },
  { to: '/course-plan', label: '课程规划', icon: MapTrifold, doneKey: 'coursePlan' },
  { to: '/lesson-plan', label: '教案', icon: Article, doneKey: 'lessonPlan' },
  { to: '/ppt', label: 'PPT 大纲', icon: PresentationChart, doneKey: 'ppt' },
  { to: '/cases', label: '导入案例', icon: Lightbulb, doneKey: 'importCases' },
  { to: '/assignments', label: '作业测验', icon: ClipboardText, doneKey: 'assignments' },
  { to: '/package', label: '备课包', icon: Package, doneKey: 'package' },
]

const resources = [
  { to: '/#history', label: '历史记录', icon: ClockCounterClockwise },
  { to: '/#templates', label: '模板管理', icon: FileText },
]

export default function Sidebar({ open, onClose }) {
  const { course, lessons, activeLessonId, activeLesson, setActiveLesson } = useLesson()
  const location = useLocation()

  const doneMap = {
    new: Boolean(course && lessons.length),
    coursePlan: Boolean(lessons.length),
    lessonPlan: Boolean(activeLesson?.lessonPlan),
    ppt: Boolean(activeLesson?.ppt),
    importCases: Boolean(activeLesson?.importCases),
    assignments: Boolean(activeLesson?.assignments),
    package: Boolean(activeLesson?.lessonPlan),
  }

  // 资源锚点链接在首页高亮
  const isAnchor = (to) => {
    const hash = to.split('#')[1]
    return location.pathname === '/' && location.hash === `#${hash}`
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-brand-950 text-brand-100 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* 品牌区 */}
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" onClick={onClose} className="flex items-center gap-3 transition hover:opacity-90">
          <Logo />
          <div className="leading-tight">
            <div className="text-base font-semibold text-white">AI 通识课备课助手</div>
            <div className="text-xs text-brand-300/70">人工智能通识拓展课</div>
          </div>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-brand-200 hover:bg-white/10 lg:hidden"
          aria-label="关闭菜单"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-3 pb-6">
        {/* 工作台 */}
        <div>
          <NavLink
            to="/"
            end
            onClick={onClose}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-white/10 text-white' : 'text-brand-100/75 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <House size={20} weight="regular" />
            <span>工作台</span>
          </NavLink>
        </div>

        {/* 备课流程 */}
        <div>
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-300/60">
            备课流程
          </p>
          {lessons.length > 0 && (
            <select
              className="mb-2 w-full rounded-xl bg-white/5 px-3 py-2 text-sm text-brand-100 outline-none transition hover:bg-white/10"
              value={activeLessonId || ''}
              onChange={(e) => setActiveLesson(e.target.value)}
            >
              {lessons.map((l, i) => (
                <option key={l.id} value={l.id} className="text-stone-900">
                  第 {i + 1} 讲 · {l.title}
                </option>
              ))}
            </select>
          )}
          <ul className="space-y-1">
            {workflowSteps.map((step, i) => {
              const done = doneMap[step.doneKey]
              const Icon = step.icon
              return (
                <li key={step.to}>
                  <NavLink
                    to={step.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-white/10 text-white'
                          : 'text-brand-100/75 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                    <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                      <Icon size={20} weight="regular" />
                      {done && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-400 text-brand-950">
                          <Check size={9} weight="bold" />
                        </span>
                      )}
                    </span>
                    <span className="flex-1">{step.label}</span>
                    <span className="text-[11px] text-brand-300/50">{i + 1}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </div>

        {/* 资源 */}
        <div>
          <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-brand-300/60">
            资源
          </p>
          <ul className="space-y-1">
            {resources.map((item) => {
              const Icon = item.icon
              const active = isAnchor(item.to)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? 'bg-white/10 text-white' : 'text-brand-100/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={20} weight="regular" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* 底部状态 */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-brand-300/70">
          {course ? `当前课程：${course.input.courseName}` : '尚未开始备课'}
        </p>
        {activeLesson && (
          <p className="mt-1 text-[11px] text-brand-300/50">
            第 {lessons.findIndex((l) => l.id === activeLesson.id) + 1} 讲 · {activeLesson.title}
          </p>
        )}
        <p className="mt-1 text-[11px] text-brand-300/50">演示版本，内容为模拟数据</p>
      </div>
    </aside>
  )
}
