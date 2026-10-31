import { DownloadSimple, X } from '@phosphor-icons/react'
import { sanitizeFilename } from '../lib/filename'

function downloadTemplate(template) {
  const content = template.content || '该模板暂无内容。'
  const ext = content.trim().startsWith('{') ? 'json' : 'md'
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(template.name, '模板')}.${ext}`
  a.click()
  URL.revokeObjectURL(url)
}

export default function TemplateModal({ template, onClose }) {
  if (!template) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-in flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-stone-900">{template.name}</h2>
              {template.builtin ? (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">内置</span>
              ) : (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">自定义</span>
              )}
            </div>
            <p className="mt-1 text-sm text-stone-500">{template.description || '自定义上传模板'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            aria-label="关闭"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-stone-50/60 px-6 py-5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-stone-700">
            {template.content || '该模板暂无内容。'}
          </pre>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button type="button" className="btn-secondary" onClick={onClose}>
            关闭
          </button>
          <button type="button" className="btn-primary" onClick={() => downloadTemplate(template)}>
            <DownloadSimple size={18} weight="bold" /> 下载模板
          </button>
        </div>
      </div>
    </div>
  )
}
