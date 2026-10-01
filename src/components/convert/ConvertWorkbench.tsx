import { useCallback, useRef, useState } from 'react';
import { Download, Trash2, Upload, X } from 'lucide-react';
import JSZip from 'jszip';
import { useTranslation } from '../../i18n';

type OutputFormat = 'jpeg' | 'png' | 'webp';

interface ConvertImage {
  id: string;
  name: string;
  file: File;
  originalUrl: string;
  originalSize: number;
  format: string;
  status: 'waiting' | 'converting' | 'done' | 'error';
  convertedUrl: string | null;
  convertedBlob: Blob | null;
  convertedSize: number;
}

const MIME: Record<OutputFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp'];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOutputName(name: string, format: OutputFormat): string {
  const base = name.replace(/\.[^.]+$/, '');
  const ext = format === 'jpeg' ? 'jpg' : format;
  return `${base}.${ext}`;
}

const inputClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

export function ConvertWorkbench() {
  const { t } = useTranslation();
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('jpeg');
  const [quality, setQuality] = useState(90);
  const [images, setImages] = useState<ConvertImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusErr, setStatusErr] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertedCount = images.filter((i) => i.convertedUrl).length;

  const addFiles = useCallback((files: File[]) => {
    const supported = files.filter((f) => SUPPORTED.includes(f.type));
    const next: ConvertImage[] = supported.map((file) => {
      const format = file.type.split('/')[1];
      return {
        id: crypto.randomUUID(),
        name: file.name,
        file,
        originalUrl: URL.createObjectURL(file),
        originalSize: file.size,
        format: format === 'jpeg' ? 'jpg' : format,
        status: 'waiting',
        convertedUrl: null,
        convertedBlob: null,
        convertedSize: 0,
      };
    });
    setImages((prev) => [...prev, ...next]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files || []));
      e.target.value = '';
    },
    [addFiles],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const img = prev[index];
      if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
      if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages((prev) => {
      prev.forEach((img) => {
        if (img.originalUrl) URL.revokeObjectURL(img.originalUrl);
        if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl);
      });
      return [];
    });
  }, []);

  const convertImage = useCallback(
    async (img: ConvertImage): Promise<void> => {
      if (img.status === 'converting') return;
      setImages((prev) =>
        prev.map((i) => (i.id === img.id ? { ...i, status: 'converting' } : i)),
      );

      try {
        const image = new Image();
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
          image.src = img.originalUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;

        // JPG 不支持透明，底色填白
        if (outputFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(image, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, MIME[outputFormat], outputFormat === 'png' ? undefined : quality / 100),
        );
        if (!blob) throw new Error('toBlob failed');

        setImages((prev) =>
          prev.map((i) =>
            i.id === img.id
              ? {
                  ...i,
                  status: 'done',
                  convertedBlob: blob,
                  convertedSize: blob.size,
                  convertedUrl: URL.createObjectURL(blob),
                }
              : i,
          ),
        );
      } catch (err) {
        console.error('转换失败:', err);
        setImages((prev) =>
          prev.map((i) => (i.id === img.id ? { ...i, status: 'error' } : i)),
        );
      }
    },
    [outputFormat, quality],
  );

  const convertAll = useCallback(async () => {
    setIsConverting(true);
    setStatusMsg('');
    setStatusErr(false);
    for (const img of images) {
      if (img.status === 'waiting' || img.status === 'error') {
        await convertImage(img);
      }
    }
    setIsConverting(false);
    setStatusMsg(t.convertDone(images.filter((i) => i.convertedUrl).length));
    setTimeout(() => setStatusMsg(''), 3000);
  }, [images, convertImage, t]);

  const saveBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadOne = (img: ConvertImage) => {
    if (img.convertedBlob) saveBlob(img.convertedBlob, getOutputName(img.name, outputFormat));
  };

  const downloadAll = useCallback(async () => {
    const done = images.filter((i) => i.convertedBlob);
    if (done.length === 0) return;

    if (done.length === 1 && done[0].convertedBlob) {
      saveBlob(done[0].convertedBlob, getOutputName(done[0].name, outputFormat));
      return;
    }

    const zip = new JSZip();
    done.forEach((img) => {
      if (img.convertedBlob) zip.file(getOutputName(img.name, outputFormat), img.convertedBlob);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const ts = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    saveBlob(content, `converted_${ts}.zip`);
  }, [images, outputFormat]);

  const buttonPrimary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';
  const buttonSecondary =
    'flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

  return (
    <div className="space-y-6">
      {/* 设置面板 */}
      <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {t.convertOutputFormat}
          </label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
            className={inputClass}
          >
            <option value="jpeg">JPG / JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>

        {outputFormat !== 'png' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t.convertQuality}
              </label>
              <span className="text-sm font-semibold text-blue-600">{quality}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {t.convertQualityHint}
            </p>
          </div>
        )}
        {outputFormat === 'png' && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.convertPngNote}</p>
        )}

        <div className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
          <button onClick={convertAll} disabled={images.length === 0 || isConverting} className={buttonPrimary}>
            {isConverting ? t.convertConverting : t.convertAll}
          </button>
          <button onClick={downloadAll} disabled={convertedCount === 0} className={buttonSecondary}>
            <Download className="h-4 w-4" />
            {typeof t.convertDownloadAll === 'function' ? t.convertDownloadAll(convertedCount) : t.convertDownloadAll}
          </button>
          <button onClick={clearAll} disabled={images.length === 0} className={buttonSecondary}>
            <Trash2 className="h-4 w-4" />
            {t.convertClear}
          </button>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t.convertLocalOnly}</p>
      </div>

      {/* 状态提示 */}
      {statusMsg && (
        <div
          className={`rounded-xl border p-4 ${
            statusErr
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-blue-200 bg-blue-50 text-blue-700'
          }`}
        >
          {statusMsg}
        </div>
      )}

      {/* 上传/列表 */}
      {images.length === 0 ? (
        <div
          className={`rounded-2xl border-2 border-dashed bg-white p-16 text-center transition-colors ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-neutral-300 hover:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900'
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
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-4"
          >
            <Upload className="h-12 w-12 text-neutral-400" />
            <div>
              <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                {t.convertDropTitle}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.convertDropOr}</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-sm">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {t.convertCount(images.length)}
              </span>
              <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                {t.convertConvertedCount(convertedCount)}
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className={buttonSecondary}
              style={{ width: 'auto', padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            >
              <Upload className="h-4 w-4" />
              {t.convertAddMore}
            </button>
          </div>

          {images.map((img, index) => (
            <div
              key={img.id}
              className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <img src={img.originalUrl} alt={img.name} className="h-20 w-20 flex-shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="mb-1 truncate font-medium text-neutral-900 dark:text-neutral-100">
                  {img.name}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {img.format.toUpperCase()} → {outputFormat.toUpperCase()}
                  {img.convertedSize > 0 && (
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {' '}
                      ({formatSize(img.originalSize)} → {formatSize(img.convertedSize)})
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-2">
                {img.status === 'converting' && (
                  <span className="text-sm font-medium text-blue-600">{t.convertConverting}</span>
                )}
                {img.status === 'waiting' && (
                  <button
                    onClick={() => convertImage(img)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t.convertSingle}
                  </button>
                )}
                {img.status === 'error' && (
                  <button
                    onClick={() => convertImage(img)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t.convertSingle}
                  </button>
                )}
                {img.convertedUrl && (
                  <button
                    onClick={() => downloadOne(img)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    {t.download}
                  </button>
                )}
                <button
                  onClick={() => removeImage(index)}
                  className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/30"
                  aria-label={`${t.remove} ${img.name}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}