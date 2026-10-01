import { useCallback, useRef, useState } from 'react';
import { Download, FlipHorizontal2, FlipVertical2, RotateCw, Upload } from 'lucide-react';
import { useTranslation } from '../../i18n';

type OutputFormat = 'png' | 'jpeg' | 'webp';

interface ResizeImage {
  file: File;
  name: string;
  url: string;
  width: number;
  height: number;
}

const MIME: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const inputClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

export function ResizeWorkbench() {
  const { t } = useTranslation();

  // 设置
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const [scalePercent, setScalePercent] = useState(100);
  const [usePercent, setUsePercent] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');

  // 状态
  const [image, setImage] = useState<ResizeImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const outputName =
    image?.name
      ? `${image.name.replace(/\.[^.]+$/, '')}_resized.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`
      : `resized.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`;

  const loadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (image?.url) URL.revokeObjectURL(image.url);

    setResultUrl(null);
    setResultSize(null);
    setTargetWidth(0);
    setTargetHeight(0);
    setScalePercent(100);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setUsePercent(false);

    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });
    setImage({ file, name: file.name, url, width: img.width, height: img.height });
    setTargetWidth(img.width);
    setTargetHeight(img.height);
  }, [image]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    },
    [loadImage],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadImage(file);
      e.target.value = '';
    },
    [loadImage],
  );

  const updateWidth = (w: number) => {
    setTargetWidth(w);
    if (keepRatio && image) {
      setTargetHeight(Math.max(1, Math.round((w / image.width) * image.height)));
    }
  };

  const updateHeight = (h: number) => {
    setTargetHeight(h);
    if (keepRatio && image) {
      setTargetWidth(Math.max(1, Math.round((h / image.height) * image.width)));
    }
  };

  const applyPercent = (p: number) => {
    setScalePercent(p);
    if (image) {
      setTargetWidth(Math.max(1, Math.round((image.width * p) / 100)));
      setTargetHeight(Math.max(1, Math.round((image.height * p) / 100)));
    }
  };

  const rotate = (deg: number) => {
    setRotation((r) => (r + deg + 360) % 360);
  };

  const applyResize = useCallback(async () => {
    if (!image || (!targetWidth && !targetHeight)) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image.url;
      });

      const w = Math.max(1, Math.round(targetWidth || (targetHeight / image.height) * image.width));
      const h = Math.max(1, Math.round(targetHeight || (targetWidth / image.width) * image.height));

      const canvas = document.createElement('canvas');
      const rotated = rotation % 180 !== 0;
      canvas.width = rotated ? h : w;
      canvas.height = rotated ? w : h;
      const ctx = canvas.getContext('2d')!;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (flipH) ctx.scale(-1, 1);
      if (flipV) ctx.scale(1, -1);

      // 旋转 90/270 时，原始图平移到中心
      const drawW = rotated ? h : w;
      const drawH = rotated ? w : h;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, MIME[outputFormat], 0.92),
      );
      if (!blob) throw new Error('toBlob failed');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize({ width: canvas.width, height: canvas.height });
    } catch (e) {
      console.error('调整尺寸失败:', e);
    }
    setIsProcessing(false);
  }, [image, targetWidth, targetHeight, rotation, flipH, flipV, outputFormat, resultUrl]);

  const download = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = outputName;
    a.click();
  }, [resultUrl, outputName]);

  const buttonPrimary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';

  if (!image) {
    return (
      <div
        className={`rounded-2xl border-2 border-dashed bg-white p-16 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
        <button onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center gap-4">
          <Upload className="h-12 w-12 text-neutral-400" />
          <div>
            <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200">{t.resizeToolLong}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.convertDropOr}</p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 设置面板 */}
        <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
          {/* 缩放方式 */}
          <div className="flex gap-2 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              onClick={() => {
                setUsePercent(false);
                setScalePercent(Math.round((targetWidth / image.width) * 100));
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                !usePercent
                  ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {t.resizeByPixels}
            </button>
            <button
              onClick={() => {
                setUsePercent(true);
                setScalePercent(Math.round((targetWidth / image.width) * 100));
              }}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                usePercent
                  ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {t.resizeByPercent}
            </button>
          </div>

          {!usePercent && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t.resizeWidth}
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetWidth || ''}
                  onChange={(e) => updateWidth(Math.max(0, Number(e.target.value)))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {t.resizeHeight}
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetHeight || ''}
                  onChange={(e) => updateHeight(Math.max(0, Number(e.target.value)))}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {usePercent && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t.resizeScale}
                </label>
                <span className="text-sm font-semibold text-blue-600">{scalePercent}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="400"
                value={scalePercent}
                onChange={(e) => applyPercent(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={keepRatio}
              onChange={(e) => setKeepRatio(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            {t.adjKeepRatio}
          </label>

          {/* 旋转 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.adjRotate}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => rotate(-90)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <RotateCw className="h-4 w-4 -scale-x-100" /> -90°
              </button>
              <button
                onClick={() => rotate(180)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <RotateCw className="h-4 w-4" /> 180°
              </button>
              <button
                onClick={() => rotate(90)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                <RotateCw className="h-4 w-4" /> 90°
              </button>
            </div>
          </div>

          {/* 翻转 */}
          <div className="flex gap-2">
            <button
              onClick={() => setFlipH((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                flipH
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
              }`}
            >
              <FlipHorizontal2 className="h-4 w-4" /> {t.adjFlipH}
            </button>
            <button
              onClick={() => setFlipV((v) => !v)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                flipV
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200'
              }`}
            >
              <FlipVertical2 className="h-4 w-4" /> {t.adjFlipV}
            </button>
          </div>

          {/* 输出格式 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.adjOutputFormat}
            </label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className={inputClass}
            >
              <option value="png">PNG</option>
              <option value="jpeg">JPG</option>
              <option value="webp">WebP</option>
            </select>
          </div>

          <div className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
            <button onClick={applyResize} disabled={isProcessing} className={buttonPrimary}>
              {isProcessing ? t.convertConverting : t.adjApply}
            </button>
            {resultUrl && (
              <button onClick={download} className={buttonPrimary}>
                <Download className="h-4 w-4" />
                {t.download}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <Upload className="h-4 w-4" />
              {t.cutoutReplace}
            </button>
          </div>
        </div>

        {/* 预览区 */}
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <img src={image.url} alt={image.name} className="mx-auto max-h-[420px] max-w-full rounded-xl object-contain" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{t.cutoutOriginal}:</span>{' '}
                {image.width} × {image.height}
              </span>
              {targetWidth > 0 && targetHeight > 0 && (
                <span className="font-medium text-blue-600">
                  {t.adjOutputSize(targetWidth, targetHeight)}
                </span>
              )}
            </div>
          </div>

          {resultUrl && resultSize && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {t.adjResult} · {resultSize.width} × {resultSize.height}
              </p>
              <img src={resultUrl} alt={t.adjResult} className="mx-auto max-h-[420px] max-w-full rounded-xl shadow-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}