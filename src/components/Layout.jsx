import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { List } from '@phosphor-icons/react'
import Sidebar from './Sidebar'

export default function Layout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      {/* 移动端顶部栏 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-canvas/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img src="/logo.jpg" alt="AI 通识课备课助手" className="h-9 w-9 rounded-[10px] object-cover" />
          <span className="text-base font-semibold text-stone-900">备课助手</span>
        </Link>
        <button
          type="button"
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
          onClick={() => setOpen(true)}
          aria-label="打开菜单"
        >
          <List size={22} weight="bold" />
        </button>
      </header>

      {/* 移动端遮罩 */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* 右侧主内容区 */}
      <div className="flex min-w-0 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-stone-400 md:px-8">
            AI 通识课备课助手，当前为演示版本，AI 内容均为模拟数据
          </div>
        </footer>
      </div>
    </div>
  )
}
