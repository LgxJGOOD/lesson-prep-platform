import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLesson } from '../context/LessonContext'
import { getTemplates } from '../lib/storage'
import Loading from '../components/Loading'

const MAJOR_SUGGESTIONS = ['计算机', '医学', '金融', '艺术', '法学', '文科', '商科', '工科']

export default function NewCourse() {
  const navigate = useNavigate()
  const { createCourse, creating } = useLesson()

  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState({
    courseName: '',
    totalHours: '32',
    audience: '',
    major: '',
    goals: '',
    templateId: 'default',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    getTemplates().then(setTemplates).catch(console.error)
  }, [])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.courseName.trim()) {
      setError('请填写课程名称')
      return
    }
    if (!form.audience.trim()) {
      setError('请填写授课对象')
      return
    }

    const totalHours = Number(form.totalHours)
    if (!String(form.totalHours).trim() || !Number.isFinite(totalHours) || totalHours < 2 || totalHours > 128) {
      setError('课程总课时请填写 2-128 之间的数字')
      return
    }
    setError('')

    const template = templates.find((t) => t.id === form.templateId)
    try {
      await createCourse({
        courseName: form.courseName.trim(),
        totalHours,
        audience: form.audience.trim(),
        major: form.major.trim(),
        goals: form.goals.trim(),
        template: template?.name || '通用教案模板',
        templateId: form.templateId,
      })
    } catch (err) {
      setError(err.message || '课程规划失败，请稍后重试')
      return
    }
    navigate('/course-plan')
  }

  if (creating) {
    return <Loading text="正在规划课程结构，请稍候…" />
  }

  return (
    <div className="animate-fade-in mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">新建课程</h1>
        <p className="mt-1 text-sm text-stone-500">填写课程基本信息，AI 将据此规划每节课的教学大纲。</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 md:p-8">
        <div>
          <label className="form-label" htmlFor="courseName">课程名称 <span className="text-red-500">*</span></label>
          <input
            id="courseName"
            className="form-input"
            placeholder="例如：人工智能通识"
            value={form.courseName}
            onChange={update('courseName')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="form-label" htmlFor="totalHours">课程总课时</label>
            <input
              id="totalHours"
              type="number"
              min="2"
              max="128"
              className="form-input"
              value={form.totalHours}
              onChange={update('totalHours')}
            />
          </div>
          <div>
            <label className="form-label" htmlFor="audience">授课对象 <span className="text-red-500">*</span></label>
            <input
              id="audience"
              className="form-input"
              placeholder="例如：大一 计算机专业"
              value={form.audience}
              onChange={update('audience')}
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="major">授课专业背景（用于跨学科融合）</label>
          <input
            id="major"
            className="form-input"
            placeholder="例如：医学、金融、艺术"
            value={form.major}
            onChange={update('major')}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {MAJOR_SUGGESTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm((f) => ({ ...f, major: m }))}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  form.major === m
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-brand-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="goals">课程总体目标（可选）</label>
          <textarea
            id="goals"
            rows="3"
            className="form-input resize-none"
            placeholder="例如：侧重概念理解，结合生活案例，控制理论深度"
            value={form.goals}
            onChange={update('goals')}
          />
        </div>

        <div>
          <label className="form-label" htmlFor="template">教案模板</label>
          <select id="template" className="form-input" value={form.templateId} onChange={update('templateId')}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={creating}>
          {creating ? '规划中…' : '开始规划课程'}
        </button>
      </form>
    </div>
  )
}
