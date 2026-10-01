import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Download, RotateCcw, Upload } from 'lucide-react';
import { useTranslation } from '../../i18n';

type OutputFormat = 'png' | 'jpeg' | 'webp';

interface CropImage {
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

const ASPECT_OPTIONS = [
  { value: 'free', label: '自由' },
  { value: '1:1', label: '1:1' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '2:3', label: '2:3' },
  { value: '3:2', label: '3:2' },
];

const PRESET_OPTIONS = [
  { value: '', label: '自定义' },
  { value: '800x600', label: '800 × 600' },
  { value: '1024x768', label: '1024 × 768' },
  { value: '1920x1080', label: '1920 × 1080' },
  { value: '1080x1920', label: '1080 × 1920' },
  { value: '500x500', label: '500 × 500' },
  { value: '300x300', label: '300 × 300' },
];

const inputClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

export function CropWorkbench() {
  const { t } = useTranslation();

  // 设置
  const [aspectRatio, setAspectRatio] = useState('free');
  const [presetSize, setPresetSize] = useState('');
  const [cropWidth, setCropWidth] = useState(0);
  const [cropHeight, setCropHeight] = useState(0);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');

  // 状态
  const [currentImage, setCurrentImage] = useState<CropImage | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);

  // Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(1);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const isCroppingRef = useRef(false);
  const cropStartRef = useRef({ x: 0, y: 0 });
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const outputName =
    currentImage && currentImage.name
    ? (() => {
        const base = currentImage.name.replace(/\.[^.]+$/, '');
        const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        return `${base}_cropped.${ext}`;
      })()
    : `cropped.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`;

  useEffect(() => {
    return () => {
      if (currentImage?.url) URL.revokeObjectURL(currentImage.url);
    };
  }, [currentImage]);

  const loadImage = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (currentImage?.url) URL.revokeObjectURL(currentImage.url);

    setResultUrl(null);
    setResultBlob(null);
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setPresetSize('');
    setCropWidth(0);
    setCropHeight(0);

    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    setCurrentImage({ file, name: file.name, url, width: img.width, height: img.height });
    setOriginalWidth(img.width);
    setOriginalHeight(img.height);
    originalImgRef.current = img;
  }, [currentImage]);

  // 画布在 currentImage 确定且 DOM 挂载后再初始化：内部尺寸＝实际显示尺寸，
  // 保证选区覆盖层（绝对定位）与 canvas 内部像素坐标一一对应
  useEffect(() => {
    if (!currentImage || !canvasRef.current || !containerRef.current) return;
    const cv = canvasRef.current;
    const container = containerRef.current;
    const availW = Math.max(200, container.clientWidth);
    const scale = availW / currentImage.width;
    scaleRef.current = scale;
    cv.width = availW;
    cv.height = Math.round(currentImage.height * scale);
    const ctx = cv.getContext('2d');
    ctx!.imageSmoothingEnabled = true;
    ctx!.drawImage(originalImgRef.current!, 0, 0, cv.width, cv.height);
  }, [currentImage]);

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

  // 裁框绘制：mouse 事件（本地坐标使用 canvas 内部像素坐标）
  const getCanvasPos = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvasRef.current!.width;
    const y = ((clientY - rect.top) / rect.height) * canvasRef.current!.height;
    return { x, y };
  };

  const startCrop = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const pos = getCanvasPos(e.clientX, e.clientY);
    isCroppingRef.current = true;
    cropStartRef.current = pos;
    setCropArea({ x: pos.x, y: pos.y, width: 0, height: 0 });
  }, []);

  const doCrop = useCallback(
    (e: React.MouseEvent) => {
      if (!isCroppingRef.current || !canvasRef.current) return;
      const pos = getCanvasPos(e.clientX, e.clientY);
      let width = pos.x - cropStartRef.current.x;
      let height = pos.y - cropStartRef.current.y;

      if (aspectRatio !== 'free') {
        const [w, h] = aspectRatio.split(':').map(Number);
        const ratio = w / h;
        if (Math.abs(width) > Math.abs(height * ratio)) height = width / ratio;
        else width = height * ratio;
      }

      let next = {
        x: width >= 0 ? cropStartRef.current.x : cropStartRef.current.x + width,
        y: height >= 0 ? cropStartRef.current.y : cropStartRef.current.y + height,
        width: Math.abs(width),
        height: Math.abs(height),
      };
      const cw = canvasRef.current.width;
      const ch = canvasRef.current.height;
      next.x = Math.max(0, Math.min(next.x, cw - next.width));
      next.y = Math.max(0, Math.min(next.y, ch - next.height));
      setCropArea(next);
    },
    [aspectRatio],
  );

  const endCrop = useCallback(() => {
    isCroppingRef.current = false;
  }, []);

  // 预设尺寸 → 画面上居中选区域
  const applyPreset = useCallback((preset: string) => {
    if (!preset || !canvasRef.current) return;
    const [w, h] = preset.split('x').map(Number);
    setCropWidth(w);
    setCropHeight(h);
    const scaledW = w * scaleRef.current;
    const scaledH = h * scaleRef.current;
    setCropArea({
      x: (canvasRef.current.width - scaledW) / 2,
      y: (canvasRef.current.height - scaledH) / 2,
      width: scaledW,
      height: scaledH,
    });
  }, []);

  // 手动尺寸输入 → 居中选区
  useEffect(() => {
    if (cropWidth > 0 && cropHeight > 0 && canvasRef.current) {
      const scaledW = cropWidth * scaleRef.current;
      const scaledH = cropHeight * scaleRef.current;
      setCropArea({
        x: (canvasRef.current.width - scaledW) / 2,
        y: (canvasRef.current.height - scaledH) / 2,
        width: Math.min(scaledW, canvasRef.current.width),
        height: Math.min(scaledH, canvasRef.current.height),
      });
    }
  }, [cropWidth, cropHeight]);

  const resetCrop = useCallback(() => {
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
    setPresetSize('');
    setCropWidth(0);
    setCropHeight(0);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!currentImage || cropArea.width === 0) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = currentImage.url;
      });

      const scale = scaleRef.current;
      const actualX = cropArea.x / scale;
      const actualY = cropArea.y / scale;
      const actualW = Math.max(1, Math.round(cropArea.width / scale));
      const actualH = Math.max(1, Math.round(cropArea.height / scale));

      const out = document.createElement('canvas');
      out.width = actualW;
      out.height = actualH;
      const ctx = out.getContext('2d')!;
      ctx.drawImage(img, actualX, actualY, actualW, actualH, 0, 0, actualW, actualH);

      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, MIME[outputFormat], 0.92),
      );
      if (!blob) throw new Error('toBlob failed');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error('裁剪失败:', e);
    }
    setIsProcessing(false);
  }, [currentImage, cropArea, outputFormat, resultUrl]);

  const download = useCallback(() => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [resultBlob, outputName]);

  const buttonPrimary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';

  if (!currentImage) {
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
          <Crop className="h-12 w-12 text-neutral-400" />
          <div>
            <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
              {t.cropToolLong}
            </p>
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
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.cropAspectRatio}
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className={inputClass}
            >
              {ASPECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.cropPreset}
            </label>
            <select
              value={presetSize}
              onChange={(e) => {
                const v = e.target.value;
                setPresetSize(v);
                if (v) applyPreset(v);
              }}
              className={inputClass}
            >
              {PRESET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.cropSettings}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                value={cropWidth || ''}
                placeholder="宽"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setCropWidth(v);
                }}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                value={cropHeight || ''}
                placeholder="高"
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isFinite(v)) setCropHeight(v);
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.cropOutputFormat}
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
            <button onClick={applyCrop} disabled={isProcessing} className={buttonPrimary}>
              {isProcessing ? t.convertConverting : t.cropApply}
            </button>
            <button
              onClick={resetCrop}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              <RotateCcw className="h-4 w-4" />
              {t.cropReset}
            </button>
            {resultBlob && (
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

        {/* 画布区域 */}
        <div className="space-y-4 lg:col-span-8">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
            >
              <canvas
                ref={canvasRef}
                className="block max-w-full cursor-crosshair"
                onMouseDown={startCrop}
                onMouseMove={doCrop}
                onMouseUp={endCrop}
                onMouseLeave={endCrop}
                style={{ width: '100%', height: 'auto' }}
              />
              {cropArea.width > 0 && (
                <div
                  className="pointer-events-none absolute border-2 border-white bg-black/30"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height,
                  }}
                >
                  <div className="absolute inset-0 border border-dashed border-white/50" />
                  {[
                    '-top-1 -left-1',
                    '-top-1 -right-1',
                    '-bottom-1 -left-1',
                    '-bottom-1 -right-1',
                  ].map((pos) => (
                    <div key={pos} className={`absolute ${pos} h-3 w-3 bg-white`} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{t.cutoutOriginal}:</span>{' '}
                {originalWidth} × {originalHeight}
              </span>
              {cropArea.width > 0 && (
                <span className="font-medium text-blue-600">
                  {t.cropSelection(
                    Math.round(cropArea.width / scaleRef.current),
                    Math.round(cropArea.height / scaleRef.current),
                  )}
                </span>
              )}
            </div>
          </div>

          {resultUrl && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {t.cropResult}
              </p>
              <img src={resultUrl} alt={t.cropResult} className="mx-auto max-w-full rounded-xl shadow-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}