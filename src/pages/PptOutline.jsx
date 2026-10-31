import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardText } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import { exportPpt } from '../lib/export'
import Loading from '../components/Loading'
import CourseLessonNav from '../components/CourseLessonNav'

export default function PptOutline() {
  const { input, ppt, activeLessonId, generatePptContent, regenerateSlide, ensurePpt } = useLesson()

  const [selectedId, setSelectedId] = useState(null)
  const [pageCount, setPageCount] = useState('10')
  const [pageCountHint, setPageCountHint] = useState('')
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [regeneratingId, setRegeneratingId] = useState(null)
  const generatedRef = useRef(null)

  // 进入页面时若还没有 PPT，自动生成默认 10 页（缺导入案例/教案会先补上）；切换课时后重新生成
  useEffect(() => {
    if (input && !ppt && generatedRef.current !== activeLessonId) {
      generatedRef.current = activeLessonId
      setGenerating(true)
      setActionError('')
      ensurePpt(10)
        .catch((e) => setActionError(e.message || '生成 PPT 大纲失败，请稍后重试'))
        .finally(() => setGenerating(false))
    }
  }, [input, ppt, activeLessonId, ensurePpt])

  // 默认选中第一页
  useEffect(() => {
    if (ppt?.pages?.length && !ppt.pages.find((p) => p.id === selectedId)) {
      setSelectedId(ppt.pages[0].id)
    }
  }, [ppt, selectedId])

  if (!input) {
    return (
      <div className="animate-fade-in space-y-5">
        <CourseLessonNav doneKey="ppt" />
        <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ClipboardText size={40} weight="light" className="text-stone-300" />
          <p className="text-stone-500">请先新建课程并完成课程规划。</p>
          <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
        </div>
      </div>
    )
  }

  const selectedPage = ppt?.pages?.find((p) => p.id === selectedId)

  // 页数只允许 8-12；越界时给出提示并按边界值处理，而不是静默改掉
  const resolvePageCount = () => {
    const num = Number(pageCount)
    if (Number.isFinite(num) && num >= 8 && num <= 12) {
      setPageCountHint('')
      return Math.round(num)
    }
    const clamped = Math.min(12, Math.max(8, Number.isFinite(num) ? Math.round(num) : 10))
    setPageCountHint(`页数需在 8-12 之间，已调整为 ${clamped} 页`)
    return clamped
  }

  const handlePageCountBlur = () => {
    setPageCount(String(resolvePageCount()))
  }

  const handleRegenerate = async () => {
    const count = resolvePageCount()
    setPageCount(String(count))
    setGenerating(true)
    setSelectedId(null)
    setActionError('')
    try {
      await generatePptContent(count)
    } catch (e) {
      setActionError(e.message || '生成 PPT 大纲失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!ppt?.pages?.length) return
    setDownloading(true)
    setDownloadError('')
    try {
      await exportPpt(input, ppt)
    } catch (e) {
      setDownloadError(e.message || '导出失败，请稍后重试')
    } finally {
      setDownloading(false)
    }
  }

  const handleRegenerateSlide = async (pageId) => {
    setRegeneratingId(pageId)
    setActionError('')
    try {
      await regenerateSlide(pageId)
    } catch (e) {
      setActionError(e.message || '重新生成本页讲稿失败，请稍后重试')
    } finally {
      setRegeneratingId(null)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <CourseLessonNav doneKey="ppt" />

      {/* 头部：页数调整 */}
      <div className="card flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">PPT 大纲与讲稿</h1>
          <p className="mt-1 text-sm text-stone-500">共 {ppt?.pages?.length || 0} 页 · 点击左侧页面查看对应讲稿</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-primary"
            onClick={handleDownload}
            disabled={downloading || !ppt?.pages?.length}
          >
            {downloading ? '导出中…' : '下载 PPT'}
          </button>
          <label className="ml-1 text-sm text-stone-500">总页数（8-12）</label>
          <input
            type="number"
            min="8"
            max="12"
            className="form-input w-20 py-1.5 text-center"
            value={pageCount}
            onChange={(e) => setPageCount(e.target.value)}
            onBlur={handlePageCountBlur}
          />
          <button className="btn-secondary py-1.5" onClick={handleRegenerate} disabled={generating}>
            {generating ? '生成中…' : '重新生成'}
          </button>
        </div>
      </div>

      {pageCountHint && <p className="text-sm text-stone-500">{pageCountHint}</p>}
      {downloadError && <p className="text-sm text-red-500">{downloadError}</p>}
      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      {generating && <Loading text="正在生成 PPT 大纲与讲稿…" />}

      {!generating && ppt?.pages?.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* 左侧大纲列表 */}
          <aside className="card max-h-[70vh] overflow-y-auto p-3">
            <ul className="space-y-1">
              {ppt.pages.map((p, i) => (
                <li key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                      p.id === selectedId ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-100 text-xs font-semibold text-stone-500">
                        {p.id}
                      </span>
                      <span className={`line-clamp-1 text-sm font-medium ${p.id === selectedId ? 'text-brand-700' : 'text-stone-800'}`}>
                        {p.title}
                      </span>
                    </div>
                    {p.tag && (
                      <span className="ml-8 mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                        {p.tag}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* 右侧讲稿 */}
          <div className="card p-5 md:p-6">
            {selectedPage ? (
              <div key={selectedPage.id} className="animate-fade-in">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-sm font-semibold text-white">
                    {selectedPage.id}
                  </span>
                  <h2 className="text-lg font-semibold text-stone-900">{selectedPage.title}</h2>
                  {selectedPage.tag && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs text-amber-700">{selectedPage.tag}</span>
                  )}
                </div>

                {/* 核心要点 */}
                <div className="mt-4 rounded-xl bg-stone-50 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-stone-900">本页核心要点</h3>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-stone-700">
                    {selectedPage.points.map((pt, i) => (
                      <li key={i}>{pt}</li>
                    ))}
                  </ul>
                </div>

                {/* 讲师讲稿 */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-stone-900">讲师讲稿</h3>
                    <button
                      className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      onClick={() => handleRegenerateSlide(selectedPage.id)}
                      disabled={regeneratingId === selectedPage.id}
                    >
                      {regeneratingId === selectedPage.id ? '重新生成中…' : '重新生成本页讲稿'}
                    </button>
                  </div>
                  <p className="rounded-xl border border-stone-100 bg-white p-4 text-sm leading-relaxed text-stone-700">
                    {selectedPage.script}
                  </p>
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-stone-400">请选择左侧页面</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={() => window.history.back()}>返回</button>
        <Link to="/cases" className="btn-primary">下一步：课堂导入案例 →</Link>
      </div>
    </div>
  )
}
