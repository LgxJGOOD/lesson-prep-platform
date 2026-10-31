import { Routes, Route } from 'react-router-dom'
import { LessonProvider } from './context/LessonContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewCourse from './pages/NewCourse'
import CoursePlan from './pages/CoursePlan'
import LessonPlan from './pages/LessonPlan'
import PptOutline from './pages/PptOutline'
import ImportCases from './pages/ImportCases'
import Assignments from './pages/Assignments'
import LessonPackage from './pages/LessonPackage'

export default function App() {
  return (
    <LessonProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new" element={<NewCourse />} />
          <Route path="course-plan" element={<CoursePlan />} />
          <Route path="lesson-plan" element={<LessonPlan />} />
          <Route path="ppt" element={<PptOutline />} />
          <Route path="cases" element={<ImportCases />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="package" element={<LessonPackage />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </LessonProvider>
  )
}
