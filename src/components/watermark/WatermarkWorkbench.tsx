import { useCallback, useRef, useState } from 'react';
import { Download, ImagePlus, Upload } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Translation } from '../../i18n/locales/en';

type OutputFormat = 'png' | 'jpeg' | 'webp';

interface WatermarkImage {
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

const POSITIONS: { value: string; label: keyof Translation }[] = [
  { value: 'tl', label: 'wmPosTopLeft' },
  { value: 'tc', label: 'wmPosTopCenter' },
  { value: 'tr', label: 'wmPosTopRight' },
  { value: 'cl', label: 'wmPosCenterLeft' },
  { value: 'cc', label: 'wmPosCenter' },
  { value: 'cr', label: 'wmPosCenterRight' },
  { value: 'bl', label: 'wmPosBottomLeft' },
  { value: 'bc', label: 'wmPosBottomCenter' },
  { value: 'br', label: 'wmPosBottomRight' },
];

export function WatermarkWorkbench() {
  const { t } = useTranslation();

  // 设置
  const [wmType, setWmType] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [opacity, setOpacity] = useState(50);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState('br');
  const [tiled, setTiled] = useState(false);
  const [wmScale, setWmScale] = useState(20);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('png');

  // 状态
  const [image, setImage] = useState<WatermarkImage | null>(null);
  const [wmImage, setWmImage] = useState<WatermarkImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wmFileInputRef = useRef<HTMLInputElement>(null);

  const outputName =
    image?.name
      ? `${image.name.replace(/\.[^.]+$/, '')}_watermarked.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`
      : `watermarked.${outputFormat === 'jpeg' ? 'jpg' : outputFormat}`;

  const loadImage = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      if (image?.url) URL.revokeObjectURL(image.url);
      setResultUrl(null);
      setResultBlob(null);
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      setImage({ file, name: file.name, url, width: img.width, height: img.height });
    },
    [image],
  );

  const loadWatermark = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      if (wmImage?.url) URL.revokeObjectURL(wmImage.url);
      setWmType('image');
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });
      setWmImage({ file, name: file.name, url, width: img.width, height: img.height });
    },
    [wmImage],
  );

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

  const applyWatermark = useCallback(async () => {
    if (!image) return;
    if (wmType === 'text' && !text) return;
    if (wmType === 'image' && !wmImage) return;
    setIsProcessing(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image.url;
      });

      const out = document.createElement('canvas');
      out.width = img.width;
      out.height = img.height;
      const ctx = out.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (wmType === 'text') {
        ctx.save();
        ctx.globalAlpha = opacity / 100;
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(text);
        const textW = metrics.width;
        const textH = fontSize;

        if (tiled) {
          const stepX = textW + 100;
          const stepY = textH + 80;
          for (let y = 40; y < out.height; y += stepY) {
            for (let x = 40; x < out.width; x += stepX) {
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.fillText(text, 0, 0);
              ctx.restore();
            }
          }
        } else {
          ctx.save();
          ctx.translate(out.width / 2, out.height / 2);
          ctx.rotate((rotation * Math.PI) / 180);
          const px = POSITIONS.find((p) => p.value === position);
          // 九宫格偏移（按画布相对位置换算）
          let dx = 0;
          let dy = 0;
          const margin = 40;
          if (px) {
            const col = px.value[1] === 'l' ? -1 : px.value[1] === 'r' ? 1 : 0;
            const row = px.value[0] === 't' ? -1 : px.value[0] === 'b' ? 1 : 0;
            dx = col * ((out.width - textW) / 2 - margin);
            dy = row * ((out.height - textH) / 2 - margin);
          }
          ctx.fillText(text, dx, dy);
          ctx.restore();
        }
        ctx.restore();
      } else if (wmImage) {
        const wmImg = new Image();
        await new Promise<void>((resolve, reject) => {
          wmImg.onload = () => resolve();
          wmImg.onerror = reject;
          wmImg.src = wmImage.url;
        });

        const scale = wmScale / 100;
        const ww = Math.min(out.width * 0.5, wmImg.width * scale);
        const wh = (ww / wmImg.width) * wmImg.height;
        ctx.globalAlpha = opacity / 100;
        ctx.imageSmoothingEnabled = true;
        ctx.save();
        ctx.translate(out.width / 2, out.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        if (tiled) {
          const stepX = ww + 80;
          const stepY = wh + 80;
          for (let y = 50; y < out.height; y += stepY) {
            for (let x = 50; x < out.width; x += stepX) {
              ctx.save();
              ctx.translate(x - out.width / 2, y - out.height / 2);
              ctx.rotate((rotation * Math.PI) / 180);
              ctx.drawImage(wmImg, -ww / 2, -wh / 2, ww, wh);
              ctx.restore();
            }
          }
        } else {
          let dx = 0;
          let dy = 0;
          const px = POSITIONS.find((p) => p.value === position);
          const margin = 40;
          if (px) {
            const col = px.value[1] === 'l' ? -1 : px.value[1] === 'r' ? 1 : 0;
            const row = px.value[0] === 't' ? -1 : px.value[0] === 'b' ? 1 : 0;
            dx = col * ((out.width - ww) / 2 - margin);
            dy = row * ((out.height - wh) / 2 - margin);
          }
          ctx.drawImage(wmImg, dx - ww / 2, dy - wh / 2, ww, wh);
        }
        ctx.restore();
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        out.toBlob(resolve, MIME[outputFormat], 0.92),
      );
      if (!blob) throw new Error('toBlob failed');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error('添加水印失败:', e);
    }
    setIsProcessing(false);
  }, [image, wmImage, wmType, text, fontSize, textColor, opacity, rotation, position, tiled, wmScale, outputFormat, resultUrl]);

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
  const buttonSecondary =
    'flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

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
            <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
              {t.convertDropTitle}
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
          {/* 类型切换 */}
          <div className="flex gap-2 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              onClick={() => setWmType('text')}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                wmType === 'text'
                  ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {t.wmTypeText}
            </button>
            <button
              onClick={() => setWmType('image')}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                wmType === 'image'
                  ? 'bg-white text-neutral-900 shadow dark:bg-neutral-700 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {t.wmTypeImage}
            </button>
          </div>

          {wmType === 'text' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {t.wmText}
                </label>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.watermarkTextPlaceholder}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t.wmFontSize}: {fontSize}px
                  </label>
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={fontSize}
                    onChange={(e) => setFontSize(Math.max(8, Number(e.target.value)))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {t.wmColor}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-200 dark:border-neutral-700"
                    />
                    <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {textColor}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {wmType === 'image' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t.wmTypeImage}
              </label>
              {wmImage ? (
                <div className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-700">
                  <img src={wmImage.url} alt={wmImage.name} className="h-14 w-14 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {wmImage.name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {wmImage.width} × {wmImage.height}
                    </p>
                  </div>
                  <button
                    onClick={() => wmFileInputRef.current?.click()}
                    className="rounded-lg border border-neutral-300 p-2 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => wmFileInputRef.current?.click()}
                  className="w-full cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 py-8 text-center transition hover:border-blue-500 dark:border-neutral-700"
                >
                  <ImagePlus className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t.wmChooseImage}
                  </p>
                </button>
              )}
              <input
                ref={wmFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) loadWatermark(f);
                  e.target.value = '';
                }}
              />
              <div className="mt-3">
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span>{t.wmScale}</span>
                  <span className="font-semibold text-blue-600">{wmScale}%</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={wmScale}
                  onChange={(e) => setWmScale(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}

          {wmType === 'text' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span>{t.wmOpacity}</span>
                  <span className="font-semibold text-blue-600">{opacity}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  <span>{t.wmRotation}</span>
                  <span className="font-semibold text-blue-600">{rotation}°</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* 位置九宫格 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.wmPosition}
            </label>
            <div id="wmgrid" className="grid grid-cols-3 gap-1.5">
              {POSITIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPosition(p.value)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
                    position === p.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  {t[p.label]}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={tiled}
              onChange={(e) => setTiled(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
            {t.wmTiled}
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.wmOutputFormat}
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
            <button onClick={applyWatermark} disabled={isProcessing} className={buttonPrimary}>
              {isProcessing ? t.convertConverting : t.wmApply}
            </button>
            {resultBlob && (
              <button onClick={download} className={buttonPrimary}>
                <Download className="h-4 w-4" />
                {t.download}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={buttonSecondary}
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
            <span className="text-neutral-600 dark:text-neutral-300">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{t.cutoutOriginal}:</span>{' '}
              {image.width} × {image.height}
            </span>
          </div>

          {resultUrl && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                {t.wmResult}
              </p>
              <img src={resultUrl} alt={t.wmResult} className="mx-auto max-h-[420px] max-w-full rounded-xl shadow-md" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}