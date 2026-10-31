import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import * as api from '../lib/api'
import {
  saveCourse,
  getCourseById,
  createCourseId,
  createLessonId,
  getActiveCourseState,
  setActiveCourseState,
} from '../lib/storage'

const LessonContext = createContext(null)

const EMPTY_LESSON_ARTIFACTS = {
  lessonPlan: null,
  ppt: null,
  importCases: null,
  assignments: null,
  generationError: null,
}

function normalizeLesson(lesson) {
  return {
    ...EMPTY_LESSON_ARTIFACTS,
    ...lesson,
  }
}

export function LessonProvider({ children }) {
  const [course, setCourse] = useState(null)
  const [courseId, setCourseId] = useState(null)
  const [activeLessonId, setActiveLessonId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [batchGenerating, setBatchGenerating] = useState(false)
  const [batchProgress, setBatchProgress] = useState(null)
  const [courses, setCourses] = useState([])

  const lessons = course?.lessons || []
  const activeLesson = lessons.find((l) => l.id === activeLessonId) || lessons[0] || null

  const input = useMemo(() => {
    if (!course?.input || !activeLesson) return null
    return {
      topic: activeLesson.title,
      hours: activeLesson.hours,
      audience: course.input.audience,
      major: course.input.major,
      goals: course.input.goals,
      template: course.input.template || '通用教案模板',
      // 课程规划为本讲产出的教学大纲：下游的教案 / PPT / 作业都要消费它们
      knowledgePoints: activeLesson.knowledgePoints || [],
      objectives: activeLesson.objectives || [],
      keyPoints: activeLesson.keyPoints || [],
      difficulties: activeLesson.difficulties || [],
    }
  }, [course, activeLesson])

  const lessonPlan = activeLesson?.lessonPlan || null
  const ppt = activeLesson?.ppt || null
  const importCases = activeLesson?.importCases || null
  const assignments = activeLesson?.assignments || null

  // 初始化加载课程列表，并恢复上次活跃的课程与课时
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const list = await getCourses()
      if (cancelled) return
      setCourses(list)

      const active = await getActiveCourseState()
      if (!active.courseId || cancelled) return
      const record =
        list.find((r) => r.id === active.courseId) || (await getCourseById(active.courseId))
      if (!record || cancelled) return
      setCourseId(record.id)
      setCourse(record)
      setActiveLessonId(active.lessonId || record.lessons?.[0]?.id || null)
    })().catch(console.error)
    return () => {
      cancelled = true
    }
  }, [])

  // 课程变化时自动持久化；批量生成期间改为逐课显式保存，避免重复写入
  useEffect(() => {
    if (!courseId || !course || batchGenerating) return
    saveCourse(course).catch(console.error)
  }, [courseId, course, batchGenerating])

  // 当前课程变化时同步进课程列表，保证顶部课程下拉始终是最新内容
  useEffect(() => {
    if (!courseId || !course) return
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === course.id)
      if (idx === -1) return [course, ...prev]
      const next = [...prev]
      next[idx] = course
      return next
    })
  }, [courseId, course])

  const updateLesson = useCallback((lessonId, patch) => {
    setCourse((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
      }
    })
  }, [])

  const setActiveLesson = useCallback(
    (lessonId) => {
      setActiveLessonId(lessonId)
      if (courseId) setActiveCourseState(courseId, lessonId).catch(console.error)
    },
    [courseId],
  )

  const switchCourse = useCallback(
    async (id) => {
      if (!id || id === courseId) return
      const record = courses.find((r) => r.id === id) || (await getCourseById(id))
      if (!record) return
      setCourseId(record.id)
      setCourse(record)
      const firstId = record.lessons?.[0]?.id || null
      setActiveLessonId(firstId)
      await setActiveCourseState(record.id, firstId)
    },
    [courses, courseId],
  )

  const createCourse = useCallback(async (form) => {
    setCreating(true)
    try {
      const { lessons: rawLessons } = await api.generateCoursePlan(form)
      const normalized = rawLessons.map((l, i) =>
        normalizeLesson({
          ...l,
          id: l.id || createLessonId(),
          title: l.title || `第 ${i + 1} 讲`,
        }),
      )

      const newCourse = {
        id: createCourseId(),
        input: form,
        lessons: normalized,
        createdAt: new Date().toISOString(),
      }

      setCourse(newCourse)
      setCourseId(newCourse.id)
      const firstId = normalized[0]?.id || null
      setActiveLessonId(firstId)
      await setActiveCourseState(newCourse.id, firstId)
      await saveCourse(newCourse)
      return newCourse.id
    } finally {
      setCreating(false)
    }
  }, [])

  const regenerateCoursePlan = useCallback(async () => {
    if (!course?.input) return
    setCreating(true)
    try {
      const { lessons: rawLessons } = await api.generateCoursePlan(course.input)
      const normalized = rawLessons.map((l, i) =>
        normalizeLesson({
          ...l,
          id: l.id || createLessonId(),
          title: l.title || `第 ${i + 1} 讲`,
        }),
      )
      const next = { ...course, lessons: normalized }
      setCourse(next)
      const firstId = normalized[0]?.id || null
      setActiveLessonId(firstId)
      await setActiveCourseState(course.id, firstId)
      await saveCourse(next)
    } finally {
      setCreating(false)
    }
  }, [course])

  const addLesson = useCallback(() => {
    const lesson = normalizeLesson({
      id: createLessonId(),
      title: '新建课时',
      hours: 2,
      knowledgePoints: [],
      objectives: [],
      keyPoints: [],
      difficulties: [],
    })
    setCourse((prev) => (prev ? { ...prev, lessons: [...(prev.lessons || []), lesson] } : prev))
    setActiveLesson(lesson.id)
  }, [setActiveLesson])

  const deleteLesson = useCallback(
    (lessonId) => {
      if (!course) return
      const nextLessons = course.lessons.filter((l) => l.id !== lessonId)
      setCourse({ ...course, lessons: nextLessons })
      if (activeLessonId === lessonId) {
        const nextId = nextLessons[0]?.id || null
        setActiveLessonId(nextId)
        if (courseId) setActiveCourseState(courseId, nextId).catch(console.error)
      }
    },
    [course, activeLessonId, courseId],
  )

  const moveLesson = useCallback((lessonId, direction) => {
    setCourse((prev) => {
      if (!prev) return prev
      const arr = [...prev.lessons]
      const idx = arr.findIndex((l) => l.id === lessonId)
      const to = idx + direction
      if (idx < 0 || to < 0 || to >= arr.length) return prev
      const [item] = arr.splice(idx, 1)
      arr.splice(to, 0, item)
      return { ...prev, lessons: arr }
    })
  }, [])

  const generateLessonPlan = useCallback(
    async (cases) => {
      if (!input || !activeLesson) return null
      const importCases = cases ?? activeLesson.importCases
      const plan = await api.generateLessonPlan(input, importCases)
      updateLesson(activeLesson.id, { lessonPlan: plan })
      return plan
    },
    [input, activeLesson, updateLesson],
  )

  const generatePptContent = useCallback(
    async (pageCount = 10, deps = {}) => {
      if (!input || !activeLesson) return null
      const importCases = deps.importCases ?? activeLesson.importCases
      const plan = deps.lessonPlan ?? activeLesson.lessonPlan
      const data = await api.generatePpt(input, pageCount, importCases, plan)
      updateLesson(activeLesson.id, { ppt: data })
      return data
    },
    [input, activeLesson, updateLesson],
  )

  const generateCases = useCallback(
    async (batch = 0) => {
      if (!input || !activeLesson) return null
      const data = await api.generateImportCases(input, batch)
      updateLesson(activeLesson.id, { importCases: data })
      return data
    },
    [input, activeLesson, updateLesson],
  )

  const generateQuiz = useCallback(
    async (count = 5, difficulty = '中等', deps = {}) => {
      if (!input || !activeLesson) return null
      const importCases = deps.importCases ?? activeLesson.importCases
      const plan = deps.lessonPlan ?? activeLesson.lessonPlan
      const data = await api.generateAssignments(input, count, difficulty, importCases, plan)
      updateLesson(activeLesson.id, { assignments: data })
      return data
    },
    [input, activeLesson, updateLesson],
  )

  const rewriteProcess = useCallback(async () => {
    if (!input || !activeLesson?.lessonPlan) return
    const process = await api.rewriteLessonProcess(input, activeLesson.lessonPlan)
    updateLesson(activeLesson.id, {
      lessonPlan: { ...activeLesson.lessonPlan, process },
    })
  }, [input, activeLesson, updateLesson])

  const regenerateSlide = useCallback(
    async (pageId) => {
      if (!input || !activeLesson?.ppt) return
      const page = activeLesson.ppt.pages.find((p) => p.id === pageId)
      if (!page) return
      const script = await api.regenerateSlideScript(input, page, activeLesson.lessonPlan)
      updateLesson(activeLesson.id, {
        ppt: {
          ...activeLesson.ppt,
          pages: activeLesson.ppt.pages.map((p) => (p.id === pageId ? { ...p, script } : p)),
        },
      })
    },
    [input, activeLesson, updateLesson],
  )

  // ---------- 依赖串接：确保前置产物已生成，再生成自己这一步 ----------
  // 每一步都消费上游产物（案例 → 教案 → PPT / 作业），所以缺前置就先补上。

  const ensureCases = useCallback(
    async (batch = 0) => {
      if (activeLesson?.importCases?.length) return activeLesson.importCases
      return generateCases(batch)
    },
    [activeLesson, generateCases],
  )

  const ensureLessonPlan = useCallback(async () => {
    if (activeLesson?.lessonPlan) return activeLesson.lessonPlan
    const cases = await ensureCases()
    return generateLessonPlan(cases)
  }, [activeLesson, ensureCases, generateLessonPlan])

  const ensurePpt = useCallback(
    async (pageCount = 10) => {
      if (activeLesson?.ppt) return activeLesson.ppt
      const cases = await ensureCases()
      const plan = activeLesson?.lessonPlan || (await generateLessonPlan(cases))
      return generatePptContent(pageCount, { importCases: cases, lessonPlan: plan })
    },
    [activeLesson, ensureCases, generateLessonPlan, generatePptContent],
  )

  const ensureAssignments = useCallback(
    async (count = 5, difficulty = '中等') => {
      if (activeLesson?.assignments) return activeLesson.assignments
      const cases = await ensureCases()
      const plan = activeLesson?.lessonPlan || (await generateLessonPlan(cases))
      return generateQuiz(count, difficulty, { importCases: cases, lessonPlan: plan })
    },
    [activeLesson, ensureCases, generateLessonPlan, generateQuiz],
  )

  const setAssignments = useCallback(
    (updater) => {
      if (!activeLesson) return
      const next = typeof updater === 'function' ? updater(activeLesson.assignments) : updater
      updateLesson(activeLesson.id, { assignments: next })
    },
    [activeLesson, updateLesson],
  )

  const batchGenerate = useCallback(async () => {
    if (!course || batchGenerating) return
    const snapshot = course
    const total = snapshot.lessons.length
    if (!total) return

    setBatchGenerating(true)
    setBatchProgress({ current: 0, total, lessonId: null, message: '准备生成…' })

    try {
      const working = snapshot.lessons.map((l) => ({ ...l }))
      for (let i = 0; i < total; i++) {
        const lesson = working[i]
        setBatchProgress({
          current: i,
          total,
          lessonId: lesson.id,
          message: `正在生成第 ${i + 1}/${total} 讲：${lesson.title}`,
        })

        const lessonInput = {
          topic: lesson.title,
          hours: lesson.hours,
          audience: snapshot.input.audience,
          major: snapshot.input.major,
          goals: snapshot.input.goals,
          template: snapshot.input.template || '通用教案模板',
          knowledgePoints: lesson.knowledgePoints || [],
          objectives: lesson.objectives || [],
          keyPoints: lesson.keyPoints || [],
          difficulties: lesson.difficulties || [],
        }

        try {
          // 严格按依赖顺序：案例 → 教案 →（PPT 与作业可并行）
          const cases = await api.generateImportCases(lessonInput, 0)
          const plan = await api.generateLessonPlan(lessonInput, cases)
          const [pptData, assignmentData] = await Promise.all([
            api.generatePpt(lessonInput, 10, cases, plan),
            api.generateAssignments(lessonInput, 5, '中等', cases, plan),
          ])
          working[i] = {
            ...lesson,
            lessonPlan: plan,
            ppt: pptData,
            importCases: cases,
            assignments: assignmentData,
            generationError: null,
          }
        } catch (e) {
          working[i] = { ...lesson, generationError: e.message || String(e) }
        }

        const nextCourse = { ...snapshot, lessons: [...working] }
        setCourse(nextCourse)
        try {
          await saveCourse(nextCourse)
        } catch (e) {
          // 单次持久化失败不应中断整轮生成：界面已更新，下一次保存会带上本讲内容
          console.error('保存课时失败', e)
        }
        setBatchProgress({ current: i + 1, total, lessonId: null, message: `已完成第 ${i + 1}/${total} 讲` })
      }
    } finally {
      // 无论中途是否出错，都必须解除「生成中」状态，否则界面会永久卡死
      setBatchGenerating(false)
    }
    setBatchProgress({ current: total, total, lessonId: null, message: '生成完成' })
  }, [course, batchGenerating])

  const restoreFromCourse = useCallback((record) => {
    setCourseId(record.id)
    setCourse(record)
    const firstId = record.lessons?.[0]?.id || null
    setActiveLessonId(firstId)
    setActiveCourseState(record.id, firstId).catch(console.error)
  }, [])

  const value = {
    course,
    courseId,
    courses,
    lessons,
    activeLessonId,
    activeLesson,
    input,
    lessonPlan,
    ppt,
    importCases,
    assignments,
    creating,
    batchGenerating,
    batchProgress,
    createCourse,
    regenerateCoursePlan,
    updateLesson,
    addLesson,
    deleteLesson,
    moveLesson,
    setActiveLesson,
    switchCourse,
    generateLessonPlan,
    generatePptContent,
    generateCases,
    generateQuiz,
    rewriteProcess,
    regenerateSlide,
    setAssignments,
    batchGenerate,
    restoreFromCourse,
    ensureCases,
    ensureLessonPlan,
    ensurePpt,
    ensureAssignments,
  }

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>
}

export function useLesson() {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson 必须在 LessonProvider 内使用')
  return ctx
}
