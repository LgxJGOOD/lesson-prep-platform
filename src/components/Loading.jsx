// 通用加载中组件：骨架屏，匹配内容布局而非圆形 spinner
export default function Loading({ text = '正在生成…' }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="card space-y-5 p-6">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand-500" />
          <p className="text-sm font-medium text-stone-600">{text}</p>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-full animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
        </div>
      </div>
    </div>
  )
}
