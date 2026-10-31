import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardText } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import Loading from '../components/Loading'
import CourseLessonNav from '../components/CourseLessonNav'

const TYPE_STYLES = {
  新闻事件: 'bg-stone-200/70 text-stone-600',
  争议话题: 'bg-rose-50 text-rose-600',
  趣味演示: 'bg-emerald-50 text-emerald-700',
}

export default function ImportCases() {
  const { input, importCases, activeLessonId, generateCases, ensureCases } = useLesson()

  const [filter, setFilter] = useState('全部')
  const [batch, setBatch] = useState(0)
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const generatedRef = useRef(null)

  useEffect(() => {
    if (input && !importCases && generatedRef.current !== activeLessonId) {
      generatedRef.current = activeLessonId
      setLoading(true)
      setActionError('')
      ensureCases(0)
        .catch((e) => setActionError(e.message || '生成导入案例失败，请稍后重试'))
        .finally(() => setLoading(false))
    }
  }, [input, importCases, activeLessonId, ensureCases])

  if (!input) {
    return (
      <div className="animate-fade-in space-y-5">
        <CourseLessonNav doneKey="importCases" />
        <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ClipboardText size={40} weight="light" className="text-stone-300" />
          <p className="text-stone-500">请先新建课程并完成课程规划。</p>
          <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
        </div>
      </div>
    )
  }

  const types = ['全部', '新闻事件', '争议话题', '趣味演示']
  const filtered = (importCases || []).filter((c) => filter === '全部' || c.type === filter)

  const handleRefresh = async () => {
    setLoading(true)
    setActionError('')
    const next = batch + 1
    try {
      await generateCases(next)
      // 只有成功才推进批次，失败重试时不会跳批
      setBatch(next)
    } catch (e) {
      setActionError(e.message || '生成导入案例失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <CourseLessonNav doneKey="importCases" />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 md:text-2xl">课堂导入案例</h1>
          <p className="mt-1 text-sm text-stone-500">用真实、有趣的开场案例抓住学生注意力，快速进入主题。</p>
        </div>
        <button className="btn-secondary" onClick={handleRefresh} disabled={loading}>
          {loading ? '生成中…' : '换一批'}
        </button>
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            className={`rounded-full border px-4 py-1.5 text-sm transition ${
              filter === t
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <Loading text="正在生成导入案例…" />}

      {!loading && actionError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{actionError}</p>
      )}

      {!loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c, i) => (
            <article key={c.id} className="card flex animate-fade-up flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="line-clamp-2 font-semibold text-stone-900">{c.title}</h2>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${TYPE_STYLES[c.type] || 'bg-stone-100 text-stone-600'}`}>
                  {c.type}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">{c.description}</p>

              <div className="mt-4 rounded-xl bg-stone-50 p-3">
                <h3 className="mb-1.5 text-xs font-semibold text-stone-500">讨论问题</h3>
                <ul className="space-y-1">
                  {c.questions.map((q, i) => (
                    <li key={i} className="flex gap-2 text-sm text-stone-700">
                      <span className="text-brand-500">·</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
                关联知识点：{c.related}
              </p>
            </article>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card px-6 py-12 text-center text-sm text-stone-400">该类型下暂无案例。</div>
      )}

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => window.history.back()}>返回</button>
        <Link to="/assignments" className="btn-primary">下一步：作业与测验 →</Link>
      </div>
    </div>
  )
}
