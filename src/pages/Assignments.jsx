import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash, ClipboardText } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import Loading from '../components/Loading'
import CourseLessonNav from '../components/CourseLessonNav'

const TYPE_STYLES = {
  单选: 'bg-stone-200/70 text-stone-600',
  多选: 'bg-amber-50 text-amber-700',
  判断: 'bg-rose-50 text-rose-600',
  简答: 'bg-emerald-50 text-emerald-700',
}

export default function Assignments() {
  const { input, assignments, activeLessonId, generateQuiz, setAssignments, ensureAssignments } = useLesson()

  const [activeTab, setActiveTab] = useState('homework')
  const [quizCount, setQuizCount] = useState(5)
  const [difficulty, setDifficulty] = useState('中等')
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newHw, setNewHw] = useState({ title: '', mode: '个人', duration: '30 分钟', criteria: '' })
  const generatedRef = useRef(null)

  useEffect(() => {
    if (input && !assignments && generatedRef.current !== activeLessonId) {
      generatedRef.current = activeLessonId
      setLoading(true)
      setActionError('')
      ensureAssignments(5, '中等')
        .catch((e) => setActionError(e.message || '生成测验题失败，请稍后重试'))
        .finally(() => setLoading(false))
    }
  }, [input, assignments, activeLessonId, ensureAssignments])

  if (!input) {
    return (
      <div className="animate-fade-in space-y-5">
        <CourseLessonNav doneKey="assignments" />
        <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ClipboardText size={40} weight="light" className="text-stone-300" />
          <p className="text-stone-500">请先新建课程并完成课程规划。</p>
          <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
        </div>
      </div>
    )
  }

  const homework = assignments?.homework || []
  const quiz = assignments?.quiz || []

  const handleRegenerateQuiz = async () => {
    setLoading(true)
    setActionError('')
    try {
      await generateQuiz(quizCount, difficulty)
    } catch (e) {
      setActionError(e.message || '生成测验题失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const addHomework = (e) => {
    e.preventDefault()
    if (!newHw.title.trim()) return
    setAssignments((prev) => ({
      ...prev,
      homework: [
        ...(prev?.homework || []),
        { ...newHw, id: Date.now() },
      ],
    }))
    setNewHw({ title: '', mode: '个人', duration: '30 分钟', criteria: '' })
    setShowAdd(false)
  }

  const removeHomework = (id) => {
    setAssignments((prev) => ({
      ...prev,
      homework: prev.homework.filter((h) => h.id !== id),
    }))
  }

  return (
    <div className="animate-fade-in space-y-5">
      <CourseLessonNav doneKey="assignments" />

      <div>
        <h1 className="text-xl font-semibold text-stone-900 md:text-2xl">作业与测验题</h1>
        <p className="mt-1 text-sm text-stone-500">课后作业与课堂测验，内容已结合专业背景进行差异化生成。</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 rounded-xl bg-stone-100 p-1">
        {[
          { key: 'homework', label: '课后作业' },
          { key: 'quiz', label: '测验题' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <Loading text="正在生成题目…" />}

      {!loading && actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{actionError}</p>
      )}

      {/* 课后作业 Tab */}
      {!loading && activeTab === 'homework' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex justify-end">
            <button className="btn-secondary" onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? '取消' : '＋ 添加作业'}
            </button>
          </div>

          {showAdd && (
            <form onSubmit={addHomework} className="card space-y-3 p-5">
              <div>
                <label className="form-label">作业题目</label>
                <input
                  className="form-input"
                  placeholder="输入作业内容"
                  value={newHw.title}
                  onChange={(e) => setNewHw((v) => ({ ...v, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="form-label">完成形式</label>
                  <select
                    className="form-input"
                    value={newHw.mode}
                    onChange={(e) => setNewHw((v) => ({ ...v, mode: e.target.value }))}
                  >
                    <option>个人</option>
                    <option>小组</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">预计用时</label>
                  <input
                    className="form-input"
                    value={newHw.duration}
                    onChange={(e) => setNewHw((v) => ({ ...v, duration: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">评分标准要点</label>
                  <input
                    className="form-input"
                    placeholder="例如：逻辑清晰、有案例支撑"
                    value={newHw.criteria}
                    onChange={(e) => setNewHw((v) => ({ ...v, criteria: e.target.value }))}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">保存作业</button>
            </form>
          )}

          <div className="space-y-3">
            {homework.map((h, i) => (
              <div key={h.id} className="card flex animate-fade-up items-start justify-between gap-3 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-100 text-xs font-semibold text-brand-700">
                      {i + 1}
                    </span>
                    <p className="font-medium text-stone-800">{h.title}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">{h.mode}</span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">{h.duration}</span>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600">评分：{h.criteria}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeHomework(h.id)}
                  className="rounded-md p-1 text-stone-300 hover:text-red-500"
                  title="删除作业"
                >
                  <Trash size={16} />
                </button>
              </div>
            ))}
            {homework.length === 0 && (
              <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <ClipboardText size={40} weight="light" className="text-stone-300" />
                <p className="text-sm text-stone-400">暂无作业，点击右上角添加。</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 测验题 Tab */}
      {!loading && activeTab === 'quiz' && (
        <div className="animate-fade-in space-y-5">
          <div className="card flex flex-wrap items-end gap-3 p-5">
            <div>
              <label className="form-label">题目数量</label>
              <input
                type="number"
                min="2"
                max="8"
                className="form-input w-24"
                value={quizCount}
                onChange={(e) => setQuizCount(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">难度</label>
              <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option>简单</option>
                <option>中等</option>
                <option>较难</option>
              </select>
            </div>
            <button className="btn-secondary" onClick={handleRegenerateQuiz} disabled={loading}>
              重新生成
            </button>
          </div>

          <div className="space-y-4">
            {quiz.map((q, i) => (
              <div key={q.id} className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
                    {q.type}
                  </span>
                  <p className="font-medium text-stone-800">{q.question}</p>
                </div>

                {q.options?.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => (
                      <div key={opt} className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                        {opt}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3 rounded-lg bg-emerald-50/60 p-3 text-sm">
                  <span className="font-semibold text-emerald-700">参考答案：</span>
                  <span className="text-stone-700">{q.answer}</span>
                  <p className="mt-1 text-xs text-stone-500">解析：{q.analysis}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => window.history.back()}>返回</button>
        <Link to="/package" className="btn-primary">下一步：备课包整合 →</Link>
      </div>
    </div>
  )
}
