import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  CaretDown,
  CaretRight,
  CheckCircle,
  WarningCircle,
} from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import Loading from '../components/Loading'

const listToText = (arr) => (arr || []).join('\n')
const textToList = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

const OUTLINE_FIELDS = [
  { key: 'knowledgePoints', label: '知识点' },
  { key: 'objectives', label: '教学目标' },
  { key: 'keyPoints', label: '教学重点' },
  { key: 'difficulties', label: '教学难点' },
]

// 把一讲的「可编辑字段」抽成快照，用于判断外部数据是否变化
const editableFields = (lesson) => ({
  title: lesson.title || '',
  hours: String(lesson.hours ?? 2),
  outline: Object.fromEntries(OUTLINE_FIELDS.map((f) => [f.key, listToText(lesson[f.key])])),
})

function LessonRow({ lesson, index, total, isActive, onSelect, onEdit, onDelete, onMove }) {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState(lesson.title || '')
  const [hours, setHours] = useState(String(lesson.hours ?? 2))
  const [outline, setOutline] = useState(() => editableFields(lesson).outline)
  const [error, setError] = useState('')
  const syncedRef = useRef(editableFields(lesson))

  // 课时数据被外部替换（重新规划 / 换课时）时同步输入框；
  // 数据没变就不动，避免打断用户正在输入的内容
  const signature = JSON.stringify([
    lesson.id,
    lesson.title,
    lesson.hours,
    lesson.knowledgePoints,
    lesson.objectives,
    lesson.keyPoints,
    lesson.difficulties,
  ])
  useEffect(() => {
    const incoming = editableFields(lesson)
    if (JSON.stringify(incoming) === JSON.stringify(syncedRef.current)) return
    syncedRef.current = incoming
    setTitle(incoming.title)
    setHours(incoming.hours)
    setOutline(incoming.outline)
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const hasArtifact = (key) => Boolean(lesson[key])
  const complete =
    hasArtifact('lessonPlan') && hasArtifact('ppt') && hasArtifact('importCases') && hasArtifact('assignments')

  const commitTitle = () => {
    const value = title.trim()
    if (!value) {
      setError('标题不能为空，已恢复原标题')
      setTitle(lesson.title || '')
      return
    }
    setError('')
    if (value !== lesson.title) onEdit(lesson.id, { title: value })
  }

  const commitHours = () => {
    const num = Number(hours)
    if (!hours.trim() || !Number.isFinite(num) || num < 1 || num > 12) {
      setError('课时需为 1-12 之间的数字，已恢复原值')
      setHours(String(lesson.hours ?? 2))
      return
    }
    setError('')
    const value = Math.round(num)
    setHours(String(value))
    if (value !== lesson.hours) onEdit(lesson.id, { hours: value })
  }

  const commitOutline = (key) => {
    const next = textToList(outline[key] || '')
    const current = lesson[key] || []
    if (next.join('\n') === current.join('\n')) return
    onEdit(lesson.id, { [key]: next })
  }

  const confirmDelete = () => {
    const label = lesson.title || `第 ${index + 1} 讲`
    const hasGenerated = hasArtifact('lessonPlan') || hasArtifact('ppt') || hasArtifact('importCases') || hasArtifact('assignments')
    const extra = hasGenerated ? '该讲已生成的教案、PPT、案例与作业会一并删除，且无法恢复。' : ''
    if (window.confirm(`确定删除「${label}」吗？${extra}`)) onDelete(lesson.id)
  }

  return (
    <div className={`rounded-2xl border p-4 transition ${isActive ? 'border-brand-300 bg-brand-50/40' : 'border-stone-200 bg-white'}`}>
      <div className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          onClick={() => onSelect(lesson.id)}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
            isActive ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {index + 1}
        </button>

        <div className="min-w-0 flex-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-semibold text-stone-900 transition hover:border-stone-200 focus:border-brand-300 focus:bg-white focus:outline-none"
          />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <label className="flex items-center gap-1">
              课时
              <input
                type="number"
                min="1"
                max="12"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                onBlur={commitHours}
                className="w-14 rounded-md border border-stone-200 px-2 py-0.5 text-center"
              />
            </label>
            <span className="text-stone-300">|</span>
            <span>知识点 {lesson.knowledgePoints?.length || 0} 项</span>
            <span className="text-stone-300">|</span>
            {complete ? (
              <span className="inline-flex items-center gap-1 text-brand-600">
                <CheckCircle size={14} weight="fill" /> 已生成
              </span>
            ) : lesson.generationError ? (
              <span className="inline-flex items-center gap-1 text-red-500">
                <WarningCircle size={14} weight="fill" /> 生成失败
              </span>
            ) : (
              <span className="text-stone-400">待生成</span>
            )}
          </div>
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
            title={expanded ? '收起大纲' : '编辑大纲'}
          >
            {expanded ? <CaretDown size={18} /> : <CaretRight size={18} />}
          </button>
          <button
            type="button"
            onClick={() => onMove(lesson.id, -1)}
            disabled={index === 0}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
            title="上移"
          >
            <ArrowUp size={18} />
          </button>
          <button
            type="button"
            onClick={() => onMove(lesson.id, 1)}
            disabled={index === total - 1}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
            title="下移"
          >
            <ArrowDown size={18} />
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
            title="删除课时"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 grid gap-3 border-t border-stone-100 pt-3 md:grid-cols-2">
          {OUTLINE_FIELDS.map((field) => (
            <label key={field.key} className="block">
              <span className="mb-1 block text-xs font-medium text-stone-500">{field.label}（每行一条）</span>
              <textarea
                value={outline[field.key] ?? ''}
                onChange={(e) => setOutline((prev) => ({ ...prev, [field.key]: e.target.value }))}
                onBlur={() => commitOutline(field.key)}
                rows={4}
                className="form-input resize-none text-sm"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CoursePlan() {
  const {
    course,
    lessons,
    activeLessonId,
    creating,
    batchGenerating,
    batchProgress,
    regenerateCoursePlan,
    addLesson,
    updateLesson,
    deleteLesson,
    moveLesson,
    batchGenerate,
    setActiveLesson,
  } = useLesson()

  const [actionError, setActionError] = useState('')

  if (!course) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <p className="text-stone-500">还没有课程，请先新建课程。</p>
        <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
      </div>
    )
  }

  const total = lessons.length
  const completed = lessons.filter((l) => l.lessonPlan && l.ppt && l.importCases && l.assignments).length
  const progress = batchProgress?.current || 0
  const progressPercent = total ? Math.round((progress / total) * 100) : 0

  const handleRegenerate = async () => {
    if (!window.confirm('重新规划会覆盖当前课时列表与已生成内容，确定继续吗？')) return
    setActionError('')
    try {
      await regenerateCoursePlan()
    } catch (e) {
      setActionError(e.message || '重新规划失败，请稍后重试')
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-stone-900">{course.input.courseName}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {course.input.totalHours} 总课时 · {course.input.audience}
              {course.input.major ? ` · ${course.input.major}` : ''}
            </p>
            <p className="mt-2 text-sm text-stone-600">{course.input.goals}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary py-2" onClick={handleRegenerate} disabled={creating || batchGenerating}>
              {creating ? '规划中…' : '重新规划'}
            </button>
            <button className="btn-secondary py-2" onClick={addLesson} disabled={batchGenerating}>
              <Plus size={16} className="mr-1 inline" /> 添加课时
            </button>
            <button className="btn-primary py-2" onClick={batchGenerate} disabled={batchGenerating || !total}>
              {batchGenerating ? '生成中…' : '一键批量生成'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-sm text-stone-500">
          <span>
            共 {total} 讲 · 已完成 {completed} 讲
          </span>
          {batchGenerating && (
            <span className="text-brand-600">
              {batchProgress?.message || '生成中…'}
            </span>
          )}
        </div>

        {batchGenerating && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{actionError}</p>
      )}

      {creating && <Loading text="正在重新规划课程结构…" />}

      <div className="space-y-3">
        {lessons.map((lesson, i) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            index={i}
            total={total}
            isActive={lesson.id === activeLessonId}
            onSelect={setActiveLesson}
            onEdit={updateLesson}
            onDelete={deleteLesson}
            onMove={moveLesson}
          />
        ))}
      </div>

      {!creating && total === 0 && (
        <div className="card px-6 py-12 text-center text-stone-500">
          暂无课时，点击「添加课时」或「重新规划」。
        </div>
      )}

      <div className="flex justify-between">
        <Link to="/new" className="btn-secondary">返回修改课程信息</Link>
        <Link to="/lesson-plan" className="btn-primary">进入教案流程 →</Link>
      </div>
    </div>
  )
}
