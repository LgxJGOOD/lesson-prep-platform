import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardText } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import { exportTeachingPackage } from '../lib/export'

function planWordCount(plan) {
  if (!plan) return 0
  const text = [
    ...(plan.objectives || []),
    ...(plan.keyPoints || []),
    ...(plan.difficulties || []),
    ...(plan.process || []).map((p) => p.content),
    ...(plan.resources || []),
    plan.homeworkSummary || '',
    plan.interdisciplinary || '',
  ].join('')
  return text.length
}

export default function LessonPackage() {
  const { input, lessonPlan, ppt, importCases, assignments } = useLesson()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  if (!input || !lessonPlan) {
    return (
      <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <ClipboardText size={40} weight="light" className="text-stone-300" />
        <p className="text-stone-500">请先新建课程并完成课程规划。</p>
        <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
      </div>
    )
  }

  const stats = [
    { label: '教案', value: `${planWordCount(lessonPlan)} 字`, to: '/lesson-plan' },
    { label: 'PPT 大纲', value: `${ppt?.pages?.length || 0} 页`, to: '/ppt' },
    { label: '导入案例', value: `${importCases?.length || 0} 个`, to: '/cases' },
    {
      label: '作业 / 测验',
      value: `${assignments?.homework?.length || 0} 道 / ${assignments?.quiz?.length || 0} 题`,
      to: '/assignments',
    },
  ]

  // 下载 zip：内含 教案.docx、课件.pptx、作业与测验.txt、导入案例.txt
  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      await exportTeachingPackage(input, lessonPlan, ppt, assignments, importCases)
    } catch (e) {
      setExportError(e.message || '导出备课包失败，请稍后重试')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-stone-900 md:text-2xl">备课包整合</h1>
          <p className="mt-1 text-sm text-stone-500">汇总本次备课内容，一键打包为 ZIP（含教案 Word、课件 PPT、作业与测验、导入案例）。</p>
        </div>
        <button className="btn-primary" onClick={handleExport} disabled={exporting}>
          {exporting ? '打包中…' : '一键导出备课包'}
        </button>
      </div>

      {exportError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{exportError}</p>
      )}

      {/* 统计概览 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Link key={s.label} to={s.to} className="card animate-fade-up p-5 text-center transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-lift" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="text-2xl font-semibold text-brand-700">{s.value}</div>
            <div className="mt-1 text-sm text-stone-500">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* 各模块摘要 */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: '0ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">教案</h2>
            <Link to="/lesson-plan" className="text-sm text-brand-600 hover:text-brand-700">查看</Link>
          </div>
          <p className="text-sm font-medium text-stone-700">{lessonPlan.meta.topic}</p>
          <p className="mt-1 text-xs text-stone-500">
            教学目标 {lessonPlan.objectives.length} 条 · 教学过程 {lessonPlan.process.length} 个环节
          </p>
          <p className="mt-2 line-clamp-2 text-xs text-stone-400">{lessonPlan.interdisciplinary}</p>
        </section>

        <section className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: '80ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">PPT 大纲与讲稿</h2>
            <Link to="/ppt" className="text-sm text-brand-600 hover:text-brand-700">查看</Link>
          </div>
          <p className="text-sm font-medium text-stone-700">共 {ppt?.pages?.length || 0} 页</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(ppt?.pages || []).slice(0, 6).map((p) => (
              <span key={p.id} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {p.id}. {p.title}
              </span>
            ))}
            {(ppt?.pages?.length || 0) > 6 && <span className="text-xs text-stone-400">…</span>}
          </div>
        </section>

        <section className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: '160ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">课堂导入案例</h2>
            <Link to="/cases" className="text-sm text-brand-600 hover:text-brand-700">查看</Link>
          </div>
          <ul className="space-y-1.5">
            {(importCases || []).map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {c.title}
              </li>
            ))}
          </ul>
        </section>

        <section className="card animate-fade-up p-5 transition duration-300 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift" style={{ animationDelay: '240ms' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">作业与测验</h2>
            <Link to="/assignments" className="text-sm text-brand-600 hover:text-brand-700">查看</Link>
          </div>
          <p className="text-sm text-stone-700">
            课后作业 {assignments?.homework?.length || 0} 道 · 测验题 {assignments?.quiz?.length || 0} 题
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(assignments?.quiz || []).slice(0, 4).map((q) => (
              <span key={q.id} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                {q.type}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
