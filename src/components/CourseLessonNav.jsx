import { CheckCircle } from '@phosphor-icons/react'
import { useLesson } from '../context/LessonContext'

// 统一的「课程 → 章节」两层导航，放在每个展示页顶部。
// 父级为课程选择器，子级为当前课程的章节列表。
export default function CourseLessonNav({ doneKey = 'lessonPlan' }) {
  const { courses, courseId, switchCourse, lessons, activeLessonId, setActiveLesson } = useLesson()

  if (!courses?.length) return null

  return (
    <div className="card p-4">
      <div className="grid gap-3 md:grid-cols-[260px_1fr] md:items-start">
        <div>
          <label className="mb-1 block text-xs font-semibold text-stone-500">课程</label>
          <select
            className="form-input w-full py-2"
            value={courseId || ''}
            onChange={(e) => switchCourse(e.target.value)}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.input?.courseName || '未命名课程'}（{c.lessons?.length || 0} 讲）
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold text-stone-500">章节</div>
          {lessons?.length ? (
            <div className="flex flex-wrap gap-2">
              {lessons.map((l, i) => {
                const active = l.id === activeLessonId
                const done = Boolean(l[doneKey])
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveLesson(l.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <span>第 {i + 1} 讲 · {l.title}</span>
                    {done && <CheckCircle size={14} weight="fill" />}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400">暂无章节</p>
          )}
        </div>
      </div>
    </div>
  )
}
