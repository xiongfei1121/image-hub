import { useCallback, useEffect, useState } from 'react'
import {
  Crop,
  Image as ImageIcon,
  LayoutGrid,
  Maximize2,
  Repeat,
  Scissors,
  Sparkles,
  Stamp,
} from 'lucide-react'
import { CompressWorkbench } from './components/compress/CompressWorkbench'
import { ConvertWorkbench } from './components/convert/ConvertWorkbench'
import { CropWorkbench } from './components/crop/CropWorkbench'
import { CutoutWorkbench } from './components/cutout/CutoutWorkbench'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { MergeWorkbench } from './components/merge/MergeWorkbench'
import { ResizeWorkbench } from './components/resize/ResizeWorkbench'
import { UpscaleWorkbench } from './components/upscale/UpscaleWorkbench'
import { WatermarkWorkbench } from './components/watermark/WatermarkWorkbench'
import { languagePrefix, useTranslation } from './i18n'

type Tool =
  | 'compress'
  | 'convert'
  | 'crop'
  | 'resize'
  | 'merge'
  | 'watermark'
  | 'upscale'
  | 'cutout'

const PATHS: Record<Tool, string> = {
  compress: '/',
  convert: '/convert/',
  crop: '/crop/',
  resize: '/resize/',
  merge: '/merge/',
  watermark: '/watermark/',
  upscale: '/upscale/',
  cutout: '/cutout/',
}

const TOOLS = Object.keys(PATHS) as Tool[]

/**
 * hash 优先（站内切换标签时写它），路径兜底（/upscale/ 这类独立入口进来时用）。
 */
function resolveTool(): Tool {
  const hash = window.location.hash.slice(1)
  const fromHash = TOOLS.find((tool) => tool === hash)
  if (fromHash) return fromHash
  const fromPath = TOOLS.find(
    (tool) => tool !== 'compress' && new RegExp(`/${tool}/?$`).test(window.location.pathname),
  )
  return fromPath ?? 'compress'
}

export function App() {
  const { lang, t } = useTranslation()
  const [tool, setTool] = useState<Tool>(resolveTool)

  useEffect(() => {
    const onHashChange = () => setTool(resolveTool())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const switchTool = useCallback(
    (next: Tool) => {
      setTool(next)
      // 顺手把路径改成语义化的那个，但不整页跳转 —— 所有工具共用同一份 bundle，
      // 切换应当是瞬时的。history.replaceState 不进历史栈，避免退格键要走两步。
      const prefix = languagePrefix(lang)
      window.history.replaceState(null, '', `${prefix}${PATHS[next]}`)
    },
    [lang],
  )

  const tabs = [
    { id: 'compress' as const, label: t.compressTool, desc: t.compressToolDesc, Icon: ImageIcon },
    { id: 'convert' as const, label: t.convertTool, desc: t.convertToolDesc, Icon: Repeat },
    { id: 'crop' as const, label: t.cropTool, desc: t.cropToolDesc, Icon: Crop },
    { id: 'resize' as const, label: t.resizeTool, desc: t.resizeToolDesc, Icon: Maximize2 },
    { id: 'merge' as const, label: t.mergeTool, desc: t.mergeToolDesc, Icon: LayoutGrid },
    { id: 'watermark' as const, label: t.watermarkTool, desc: t.watermarkToolDesc, Icon: Stamp },
    { id: 'upscale' as const, label: t.upscaleTool, desc: t.upscaleToolDesc, Icon: Sparkles },
    { id: 'cutout' as const, label: t.cutoutTool, desc: t.cutoutToolDesc, Icon: Scissors },
  ]

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/85 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/85">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
              <ImageIcon className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-medium">{t.brand}</p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{t.allToolsLine}</p>
            </div>
          </div>

          <nav
            aria-label={t.toolNavAria}
            className="order-last flex w-full flex-wrap items-center justify-center gap-1 rounded-2xl bg-neutral-100 p-1 sm:order-none sm:w-auto dark:bg-neutral-900"
          >
            {tabs.map(({ id, label, desc, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTool(id)}
                title={desc}
                aria-current={tool === id ? 'page' : undefined}
                className={[
                  'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition sm:flex-none',
                  tool === id
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-neutral-800 dark:text-blue-300'
                    : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100',
                ].join(' ')}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {tool === 'compress' && <CompressWorkbench />}
        {tool === 'convert' && <ConvertWorkbench />}
        {tool === 'crop' && <CropWorkbench />}
        {tool === 'resize' && <ResizeWorkbench />}
        {tool === 'merge' && <MergeWorkbench />}
        {tool === 'watermark' && <WatermarkWorkbench />}
        {tool === 'upscale' && <UpscaleWorkbench />}
        {tool === 'cutout' && <CutoutWorkbench />}
      </main>

      <div className="mx-auto max-w-6xl space-y-6 px-4 pb-10 sm:px-6">
        <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t.tagline}
        </p>

        <footer className="border-t border-neutral-200 pt-6 text-center text-sm text-neutral-400 dark:border-neutral-800 dark:text-neutral-600">
          <span>{t.footerBefore}</span>
          <a
            href="https://blog.1day.vip/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            {t.footerLink}
          </a>
          <span>{t.footerAfter}</span>
        </footer>
      </div>
    </div>
  )
}