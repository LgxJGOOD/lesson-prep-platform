import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardText } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'
import { exportLessonPlanWord } from '../lib/export'
import Loading from '../components/Loading'
import Reveal from '../components/Reveal'
import CourseLessonNav from '../components/CourseLessonNav'

// 将教案对象拼装成纯文本，用于「复制全文」
function lessonPlanToText(plan) {
  const lines = []
  lines.push(`课程主题：${plan.meta.topic}`)
  lines.push(`课时数：${plan.meta.hours} 课时`)
  lines.push(`授课对象：${plan.meta.audience}`)
  lines.push(`专业背景：${plan.meta.major}`)
  lines.push(`教案模板：${plan.meta.template}`)
  lines.push('')
  lines.push('一、教学目标')
  plan.objectives.forEach((o, i) => lines.push(`${i + 1}. ${o}`))
  lines.push('')
  lines.push('二、教学重难点')
  lines.push('【重点】')
  plan.keyPoints.forEach((p) => lines.push(`- ${p}`))
  lines.push('【难点】')
  plan.difficulties.forEach((d) => lines.push(`- ${d}`))
  lines.push('')
  lines.push('三、教学过程')
  plan.process.forEach((p) => {
    lines.push(`[${p.stage}]（${p.minutes} 分钟）`)
    lines.push(p.content)
  })
  lines.push('')
  lines.push('四、教学资源')
  plan.resources.forEach((r) => lines.push(`- ${r}`))
  lines.push('')
  lines.push('五、课后作业（简要）')
  lines.push(plan.homeworkSummary)
  lines.push('')
  lines.push('六、跨学科案例融合')
  lines.push(plan.interdisciplinary)
  return lines.join('\n')
}

export default function LessonPlan() {
  const navigate = useNavigate()
  const { input, lessonPlan, activeLessonId, ensureLessonPlan, rewriteProcess } = useLesson()
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState('')
  const [rewriteTarget, setRewriteTarget] = useState('process')
  const [generating, setGenerating] = useState(false)
  const [autoError, setAutoError] = useState('')
  const generatedRef = useRef(null)

  // 当前课时没有教案时自动生成（缺导入案例会先补上）；切换课时后按课时 id 重新触发
  useEffect(() => {
    if (input && !lessonPlan && generatedRef.current !== activeLessonId) {
      generatedRef.current = activeLessonId
      setGenerating(true)
      setAutoError('')
      ensureLessonPlan()
        .catch((e) => setAutoError(e.message || '生成教案失败，请稍后重试'))
        .finally(() => setGenerating(false))
    }
  }, [input, lessonPlan, activeLessonId, ensureLessonPlan])

  if (generating) {
    return (
      <div className="animate-fade-in space-y-5">
        <CourseLessonNav />
        <Loading text="正在生成教案…" />
      </div>
    )
  }

  if (!lessonPlan) {
    return (
      <div className="animate-fade-in space-y-5">
        <CourseLessonNav />
        <div className="card mx-auto flex max-w-xl flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <ClipboardText size={40} weight="light" className="text-stone-300" />
          <p className="text-stone-500">还没有生成教案，请先新建课程并完成课程规划。</p>
          {autoError && <p className="text-sm text-red-500">{autoError}</p>}
          <Link to="/new" className="btn-primary mt-3">去新建课程</Link>
        </div>
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lessonPlanToText(lessonPlan))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  // 下载真实 .docx（后端 python-docx 生成）
  const handleDownloadWord = async () => {
    setDownloading(true)
    setDownloadError('')
    try {
      await exportLessonPlanWord(lessonPlan)
    } catch (e) {
      setDownloadError(e.message || '导出失败，请稍后重试')
    } finally {
      setDownloading(false)
    }
  }

  const handleRewrite = async () => {
    setRewriting(true)
    setRewriteError('')
    try {
      await rewriteProcess()
    } catch (e) {
      setRewriteError(e.message || '重写教学过程失败，请稍后重试')
    } finally {
      setRewriting(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-5">
      <CourseLessonNav />

      {/* 头部：标题 + 操作 */}
      <div className="card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-stone-900 md:text-2xl">{lessonPlan.meta.topic}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
              <span>课时：{lessonPlan.meta.hours} 课时</span>
              <span>对象：{lessonPlan.meta.audience}</span>
              <span>专业：{lessonPlan.meta.major}</span>
              <span>模板：{lessonPlan.meta.template}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={handleCopy}>
              {copied ? '已复制' : '复制全文'}
            </button>
            <button className="btn-secondary" onClick={handleDownloadWord} disabled={downloading}>
              {downloading ? '导出中…' : '下载 Word'}
            </button>
          </div>
        </div>

        {downloadError && <p className="mt-2 text-sm text-red-500">{downloadError}</p>}

        {/* 重新生成部分内容 */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-4">
          <label className="text-sm text-stone-500">重新生成：</label>
          <select
            className="form-input w-auto py-1.5"
            value={rewriteTarget}
            onChange={(e) => setRewriteTarget(e.target.value)}
          >
            <option value="process">重写教学过程</option>
          </select>
          <button className="btn-secondary py-1.5" onClick={handleRewrite} disabled={rewriting}>
            {rewriting ? '重写中…' : '执行'}
          </button>
        </div>

        {rewriteError && <p className="mt-2 text-sm text-red-500">{rewriteError}</p>}
      </div>

      {rewriting && <Loading text="正在重写教学过程…" />}

      {/* 教学目标 */}
      <Reveal>
      <section className="card p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">一、教学目标</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-stone-700">
          {lessonPlan.objectives.map((o, i) => (
            <li key={i}>{o}</li>
          ))}
        </ol>
      </section>
      </Reveal>

      {/* 教学重难点 */}
      <Reveal delay={60}>
      <section className="card p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">二、教学重难点</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-stone-900">教学重点</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-700">
              {lessonPlan.keyPoints.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-stone-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-stone-900">教学难点</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-stone-700">
              {lessonPlan.difficulties.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      </Reveal>

      {/* 教学过程 */}
      <Reveal delay={120}>
      <section className="card p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">三、教学过程</h2>
        <div className="space-y-4">
          {lessonPlan.process.map((p, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {i + 1}
                </span>
                {i < lessonPlan.process.length - 1 && <span className="mt-1 w-px flex-1 bg-stone-200" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900">{p.stage}</h3>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{p.minutes} 分钟</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-700">{p.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      </Reveal>

      {/* 教学资源 */}
      <Reveal delay={180}>
      <section className="card p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">四、教学资源</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {lessonPlan.resources.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
              {r}
            </li>
          ))}
        </ul>
      </section>
      </Reveal>

      {/* 课后作业 */}
      <Reveal delay={240}>
      <section className="card p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">五、课后作业（简要）</h2>
        <p className="text-sm leading-relaxed text-stone-700">{lessonPlan.homeworkSummary}</p>
      </section>
      </Reveal>

      {/* 跨学科案例融合 */}
      <Reveal delay={300}>
      <section className="card border-brand-100 bg-brand-50/50 p-5 md:p-6">
        <h2 className="mb-3 text-base font-semibold text-brand-700">六、跨学科案例融合</h2>
        <p className="text-sm leading-relaxed text-stone-700">{lessonPlan.interdisciplinary}</p>
      </section>
      </Reveal>

      {/* 底部：生成 PPT */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => navigate('/ppt')}>
          生成 PPT 大纲 →
        </button>
      </div>
    </div>
  )
}
