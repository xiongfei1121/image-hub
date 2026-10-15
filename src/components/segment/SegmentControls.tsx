import type { ReactNode } from 'react'
import { Undo2, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { formatBytes } from '../../lib/imageOutput'
import { SEGMENT_DOWNLOAD_BYTES, SEGMENT_MODEL } from '../../lib/segment/models'
import type { BackendCapabilities, PromptLabel, PromptPoint } from '../../lib/types'

interface SegmentControlsProps {
  points: PromptPoint[]
  nextLabel: PromptLabel
  onNextLabelChange: (label: PromptLabel) => void
  onUndo: () => void
  onClear: () => void
  capabilities: BackendCapabilities | null
  disabled?: boolean
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
      {children}
    </p>
  )
}

const MODES: PromptLabel[] = [1, 0]

const MODE_DOT: Record<PromptLabel, string> = {
  1: 'bg-green-600',
  0: 'bg-red-600',
}

/**
 * 点选抠图的控制栏。
 *
 * 没有「开始」按钮 —— 点画布就是开始。控制栏要做的是让用户能说明**下一点
 * 是干什么的**，以及在点错之后能干净地退回来。
 */
export function SegmentControls({
  points,
  nextLabel,
  onNextLabelChange,
  onUndo,
  onClear,
  capabilities,
  disabled = false,
}: SegmentControlsProps) {
  const { t } = useTranslation()
  const keep = points.filter((point) => point.label === 1).length
  const drop = points.length - keep
  const note = t.segmentNotes[SEGMENT_MODEL.id]
  const noWebgpu = capabilities !== null && !capabilities.webgpu

return (
    <div
      className={[
        'flex w-full flex-wrap items-center gap-x-5 gap-y-2',
        disabled ? 'pointer-events-none opacity-60' : '',
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5">
        <SectionLabel>{t.segmentSectionPrompt}</SectionLabel>

        <div className="flex gap-1.5">
          {MODES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onNextLabelChange(value)}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                value === nextLabel
                  ? 'border-blue-500 bg-blue-50 text-neutral-900 dark:bg-blue-950/40 dark:text-neutral-100'
                  : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-neutral-700',
              ].join(' ')}
            >
              <span className={`size-1.5 rounded-full ${MODE_DOT[value]}`} />
              {value === 1 ? t.segmentModeKeep : t.segmentModeDrop}
            </button>
          ))}
        </div>
      </div>

      <span className="text-xs text-neutral-600 dark:text-neutral-300">
        {points.length === 0 ? t.segmentPromptNone : t.segmentPromptCount(keep, drop)}
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={points.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <Undo2 className="size-3.5" />
          {t.segmentUndo}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={points.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          <X className="size-3.5" />
          {t.segmentClearPoints}
        </button>
      </div>

      <p className="min-w-0 max-w-md text-[11px] leading-relaxed text-neutral-500 dark:text-neutral-400">
        {t.segmentModeHint}
      </p>

      {(note || noWebgpu) && (
        <p className="w-full text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500">
          <span>
            {SEGMENT_MODEL.label} · {formatBytes(SEGMENT_DOWNLOAD_BYTES)} — {note.note}
          </span>
          <span className="ml-1.5"> {t.segmentEncoderHint}</span>
          {noWebgpu && (
            <span className="text-amber-600 dark:text-amber-400"> {t.segmentNoWebgpu}</span>
          )}
        </p>
      )}
    </div>
  )
}
