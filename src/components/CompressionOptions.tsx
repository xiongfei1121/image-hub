import type { CompressionOptions, ResizeMode } from '../types';
import { useTranslation } from '../i18n';
import { MAX_SIZE_UNIT } from '../lib/caesium/constants';

interface CompressionOptionsProps {
  options: CompressionOptions;
  onOptionsChange: (options: CompressionOptions) => void;
}

interface TextFieldProps {
  label: string;
  value: number;
  onValue: (value: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}

function TextField({ label, value, onValue, min = 0, max, hint }: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(e) => {
          const parsed = Number(e.target.value);
          if (Number.isFinite(parsed)) onValue(parsed);
        }}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      />
      {hint && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </div>
  );
}

const listInputClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

const checkClass =
  'h-4 w-4 rounded border-neutral-300 accent-blue-600 dark:border-neutral-600';

export function CompressionOptions({ options, onOptionsChange }: CompressionOptionsProps) {
  const { t } = useTranslation();

  const set = (patch: Partial<CompressionOptions>) =>
    onOptionsChange({ ...options, ...patch });

  const sizeInKB = options.maxSize / MAX_SIZE_UNIT.KILOBYTE;

  const setSizeInKB = (kb: number) =>
    set({ maxSize: Math.max(0, Math.round(kb * MAX_SIZE_UNIT.KILOBYTE)) });

  const resizeEdgeModes: ResizeMode[] = [
    'short_edge',
    'long_edge',
    'fixed_width',
    'fixed_height',
  ];
  const showEdge = resizeEdgeModes.includes(options.resizeMode);

  return (
    <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
      {/* 压缩模式 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t.compressMode}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['quality', t.compressModeQuality],
              ['size', t.compressModeSize],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                options.mode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
              }`}
              onClick={() => set({ mode })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 质量优先：质量滑条 */}
      {options.mode === 'quality' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.qualityLabel(options.lossless ? 0 : options.quality)}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={options.lossless ? 0 : options.quality}
            disabled={options.lossless}
            onChange={(e) => set({ quality: Number(e.target.value) })}
            className="w-full accent-blue-600 disabled:opacity-40"
          />
        </div>
      )}

      {/* 大小限制：目标体积 */}
      {options.mode === 'size' && (
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.targetSize}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={Number.isFinite(sizeInKB) ? sizeInKB : 0}
              onChange={(e) => {
                const parsed = Number(e.target.value);
                if (Number.isFinite(parsed)) setSizeInKB(parsed);
              }}
              className={listInputClass}
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-300">
              {t.sizeUnitKB}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {t.sizeModeHint}
          </p>
        </div>
      )}

      {/* 无损 / 保留元数据 */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={options.lossless}
            onChange={(e) => set({ lossless: e.target.checked })}
            className={checkClass}
          />
          {t.lossless}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={options.keepMetadata}
            onChange={(e) => set({ keepMetadata: e.target.checked })}
            className={checkClass}
          />
          {t.keepMetadata}
        </label>
      </div>

      {/* 缩放 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {t.resizeSection}
        </label>
        <select
          value={options.resizeMode}
          onChange={(e) => set({ resizeMode: e.target.value as ResizeMode })}
          className={listInputClass}
        >
          <option value="none">{t.resizeNone}</option>
          <option value="dimensions">{t.resizeDimensions}</option>
          <option value="percentage">{t.resizePercentage}</option>
          <option value="short_edge">{t.resizeShortEdge}</option>
          <option value="long_edge">{t.resizeLongEdge}</option>
          <option value="fixed_width">{t.resizeFixedWidth}</option>
          <option value="fixed_height">{t.resizeFixedHeight}</option>
        </select>

        {options.resizeMode === 'dimensions' && (
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={t.resizeWidth}
              value={options.resizeWidth}
              onValue={(v) => set({ resizeWidth: v })}
              min={1}
            />
            <TextField
              label={t.resizeHeight}
              value={options.resizeHeight}
              onValue={(v) => set({ resizeHeight: v })}
              min={1}
            />
          </div>
        )}

        {options.resizeMode === 'percentage' && (
          <TextField
            label={t.resizePercent}
            value={options.resizePercentage}
            onValue={(v) => set({ resizePercentage: v })}
            min={1}
            max={200}
          />
        )}

        {showEdge && (
          <TextField
            label={t.resizeEdge}
            value={options.resizeEdge}
            onValue={(v) => set({ resizeEdge: v })}
            min={1}
          />
        )}
      </div>
    </div>
  );
}