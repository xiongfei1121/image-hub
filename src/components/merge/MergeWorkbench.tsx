import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Upload, X } from 'lucide-react';
import { useTranslation } from '../../i18n';
import type { Translation } from '../../i18n/locales/en';

interface MergeItem {
  id: string;
  url: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
}

type Layout = 'free' | 'horizontal' | 'vertical' | 'grid2x2' | 'grid3x3';

const inputClass =
  'rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100';

const LAYOUT_OPTIONS: { value: Layout; label: keyof Translation }[] = [
  { value: 'free', label: 'mergeLayoutFree' },
  { value: 'horizontal', label: 'mergeLayoutHorizontal' },
  { value: 'vertical', label: 'mergeLayoutVertical' },
  { value: 'grid2x2', label: 'mergeLayout2x2' },
  { value: 'grid3x3', label: 'mergeLayout3x3' },
];

export function MergeWorkbench() {
  const { t } = useTranslation();

  // 画布设置
  const [canvasWidth, setCanvasWidth] = useState(1920);
  const [canvasHeight, setCanvasHeight] = useState(1080);
  const [autoSize, setAutoSize] = useState(true);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [layout, setLayout] = useState<Layout>('free');
  const [gap, setGap] = useState(0);
  const [globalScale, setGlobalScale] = useState(100);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [snapThreshold, setSnapThreshold] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(50);

  const [items, setItems] = useState<MergeItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragStateRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const hasRenderedRef = useRef(false);
  const pendingUrlRef = useRef<MergeItem['url'][]>([]);

  const addFiles = useCallback((files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    images.forEach((file) => {
      const url = URL.createObjectURL(file);
      pendingUrlRef.current.push(url);
      const img = new Image();
      img.onload = () => {
        // 等待图片加载完成后加入
        setItems((prev) => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          if (w === 0) return prev;
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              url,
              img,
              x: (prev.length * 80) % 300,
              y: (prev.length * 60) % 200,
              width: w,
              height: h,
            },
          ];
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
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

  // 画布渲染（在依赖变化时自动重绘）
  const renderCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;

    // 内容裁剪区域（不含 padding）
    const PAD = 32;
    const contentW = canvasWidth;
    const contentH = canvasHeight;

    // 按比例适配视口
    const container = cv.parentElement;
    const availW = container ? container.clientWidth - PAD * 2 : 800;
    const availH = 560 - PAD * 2;
    const scale = Math.min(1, availW / contentW, availH / contentH);
    cv.width = contentW * scale;
    cv.height = contentH * scale;

    ctx.imageSmoothingEnabled = true;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cv.width, cv.height);

    // 网格
    if (showGrid) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      const gapPx = gridSize * scale;
      for (let x = gapPx; x < cv.width; x += gapPx) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cv.height);
        ctx.stroke();
      }
      for (let y = gapPx; y < cv.height; y += gapPx) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cv.width, y);
        ctx.stroke();
      }
    }

    // 绘制图片
    items.forEach((item) => {
      ctx.save();
      if (item.id === selectedId) {
        ctx.strokeStyle = 'rgba(59,130,246,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x * scale, item.y * scale, item.width * scale, item.height * scale);
      }
      ctx.drawImage(
        item.img,
        item.x * scale,
        item.y * scale,
        item.width * scale,
        item.height * scale,
      );
      ctx.restore();
    });
  }, [canvasWidth, canvasHeight, bgColor, showGrid, gridSize, items, selectedId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // 选择与拖拽
  const getCanvasLocal = (clientX: number, clientY: number) => {
    const cv = canvasRef.current!;
    const rect = cv.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    return {
      x: ((clientX - rect.left) / cw) * canvasWidth,
      y: ((clientY - rect.top) / ch) * canvasHeight,
      scale: canvasWidth / cw,
    };
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (items.length === 0) return;
      const pos = getCanvasLocal(e.clientX, e.clientY);
      // 从上层开始找
      for (let idx = items.length - 1; idx >= 0; idx--) {
        const item = items[idx];
        if (pos.x >= item.x && pos.x <= item.x + item.width && pos.y >= item.y && pos.y <= item.y + item.height) {
          setSelectedId(item.id);
          dragStateRef.current = { id: item.id, offsetX: pos.x - item.x, offsetY: pos.y - item.y };
          // 移到最上层
          setItems((prev) => {
            const others = prev.filter((i) => i.id !== item.id);
            return [...others, item];
          });
          return;
        }
      }
      setSelectedId(null);
    },
    [items, canvasWidth],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const pos = getCanvasLocal(e.clientX, e.clientY);
      let nx = pos.x - drag.offsetX;
      let ny = pos.y - drag.offsetY;
      nx = Math.max(0, Math.min(nx, canvasWidth - 10));
      ny = Math.max(0, Math.min(ny, canvasHeight - 10));

      if (snapEnabled) {
        const item = items.find((i) => i.id === drag.id);
        if (item) {
          const cand = [0, canvasWidth - item.width];
          const nearest = cand.reduce((best, c) =>
            Math.abs(nx - c) < Math.abs(nx - best) ? c : best,
            cand[0],
          );
          if (Math.abs(nx - nearest) <= snapThreshold) nx = nearest;
          const candY = [0, canvasHeight - item.height];
          const nearestY = candY.reduce((best, c) =>
            Math.abs(ny - c) < Math.abs(ny - best) ? c : best,
            candY[0],
          );
          if (Math.abs(ny - nearestY) <= snapThreshold) ny = nearestY;
        }
      }

      setItems((prev) => prev.map((i) => (i.id === drag.id ? { ...i, x: nx, y: ny } : i)));
    },
    [items, canvasWidth, canvasHeight, snapEnabled, snapThreshold],
  );

  const handleMouseUp = useCallback(() => {
    dragStateRef.current = null;
  }, []);

  // 滚轮缩放选中图片
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!selectedId || items.length === 0) return;
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.9 : 1.1; // 简单倍率
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedId
            ? { ...i, width: Math.max(10, i.width * delta), height: Math.max(10, i.height * delta) }
            : i,
        ),
      );
    },
    [selectedId, items.length],
  );

  // 键盘微调
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!selectedId || items.length === 0) return;
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setItems((prev) => {
          const target = prev.find((i) => i.id === selectedId);
          if (target) {
            URL.revokeObjectURL(target.url);
          }
          const next = prev.filter((i) => i.id !== selectedId);
          if (next.length === 0) setSelectedId(null);
          return next;
        });
        return;
      }
      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setItems((prev) =>
          prev.map((i) =>
            i.id === selectedId ? { ...i, x: Math.max(0, i.x + dx), y: Math.max(0, i.y + dy) } : i,
          ),
        );
      }
    },
    [selectedId, items.length],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleLayoutChange = (l: Layout, g: number = gap) => {
    setLayout(l);
    if (l === 'free') return;
    if (items.length === 0) return;

    setItems((prev) => {
      const s = globalScale / 100;
      const sized = prev.map((i) => ({
        ...i,
        width: Math.max(10, i.img.naturalWidth * s),
        height: Math.max(10, i.img.naturalHeight * s),
      }));

      if (l === 'horizontal') {
        let x = 0;
        const maxH = Math.max(...sized.map((i) => i.height));
        return sized.map((i) => {
          const item = { ...i, y: (maxH - i.height) / 2 };
          item.x = x;
          x += i.width + g;
          return item;
        });
      }

      if (l === 'vertical') {
        let y = 0;
        const maxW = Math.max(...sized.map((i) => i.width));
        return sized.map((i) => {
          const item = { ...i, x: (maxW - i.width) / 2 };
          item.y = y;
          y += i.height + g;
          return item;
        });
      }

      if (l === 'grid2x2' || l === 'grid3x3') {
        const cols = l === 'grid2x2' ? 2 : 3;
        return sized.map((i, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          return {
            ...i,
            x: col * (i.width + g),
            y: row * (i.height + g),
          };
        });
      }

      return prev;
    });
  };

  const autoFit = useCallback(() => {
    if (items.length === 0) return;
    setItems((prev) => {
      const s = globalScale / 100;
      const sized = prev.map((i) => ({
        ...i,
        width: Math.max(10, i.img.naturalWidth * s),
        height: Math.max(10, i.img.naturalHeight * s),
      }));
      const maxW = Math.max(...sized.map((i) => i.x + i.width), canvasWidth);
      const maxH = Math.max(...sized.map((i) => i.y + i.height), canvasHeight);
      setCanvasWidth(Math.ceil(maxW));
      setCanvasHeight(Math.ceil(maxH));
      return sized;
    });
  }, [items.length, globalScale, canvasWidth, canvasHeight]);

  const clearAll = useCallback(() => {
    items.forEach((i) => URL.revokeObjectURL(i.url));
    setItems([]);
    setSelectedId(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [items, resultUrl]);

  const removeSelected = useCallback(() => {
    if (!selectedId) return;
    const target = items.find((i) => i.id === selectedId);
    if (target) URL.revokeObjectURL(target.url);
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
  }, [selectedId, items, resultUrl]);

  // 导出
  const exportPng = useCallback(async () => {
    const cv = canvasRef.current;
    if (!cv || items.length === 0) return;
    setIsRendering(true);
    try {
      const out = document.createElement('canvas');
      out.width = canvasWidth;
      out.height = canvasHeight;
      const ctx = out.getContext('2d')!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, out.width, out.height);
      // 等图片全部加载完成
      for (const item of items) {
        if (item.img.complete) {
          ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
        } else {
          await new Promise<void>((resolve, reject) => {
            item.img.onload = () => resolve();
            item.img.onerror = reject;
          });
          ctx.drawImage(item.img, item.x, item.y, item.width, item.height);
        }
      }
      const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('toBlob failed');
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setResultUrl(URL.createObjectURL(blob));

      if (autoSize) {
        const maxX = Math.max(...items.map((i) => i.x + i.width));
        const maxY = Math.max(...items.map((i) => i.y + i.height));
        setCanvasWidth(Math.ceil(maxX));
        setCanvasHeight(Math.ceil(maxY));
      }
    } catch (err) {
      console.error('导出失败:', err);
    }
    setIsRendering(false);
  }, [items, canvasWidth, canvasHeight, bgColor, autoSize, resultUrl]);

  const download = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `merged_${Date.now()}.png`;
    a.click();
  }, [resultUrl]);

  const buttonPrimary =
    'flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50';
  const buttonSecondary =
    'flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800';

  void hasRenderedRef;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 设置面板 */}
        <div className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 lg:col-span-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.mergeSettings}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={100}
                value={canvasWidth}
                onChange={(e) => setCanvasWidth(Math.max(100, Number(e.target.value)))}
                className={inputClass}
              />
              <input
                type="number"
                min={100}
                value={canvasHeight}
                onChange={(e) => setCanvasHeight(Math.max(100, Number(e.target.value)))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={autoSize}
                onChange={(e) => setAutoSize(e.target.checked)}
                className="h-4 w-4 accent-blue-600"
              />
              {t.mergeAutoSize}
            </label>
            <button onClick={autoFit} className="text-sm font-medium text-blue-600 hover:underline">
              {t.mergeAutoFit}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.mergeBackground}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-lg border border-neutral-200 dark:border-neutral-700"
              />
              <input
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.mergeLayout}
            </label>
            <select
              value={layout}
              onChange={(e) => handleLayoutChange(e.target.value as Layout)}
              className={inputClass}
            >
              {LAYOUT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {t[o.label]}
                </option>
              ))}
            </select>
          </div>

          {layout !== 'free' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t.mergeGap}: {gap}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={gap}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setGap(v);
                  if (layout !== 'free') handleLayoutChange(layout, v);
                }}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <div>
            <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <span>{t.mergeGlobalScale}</span>
              <span className="font-semibold text-blue-600">{globalScale}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="300"
              value={globalScale}
              onChange={(e) => setGlobalScale(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.mergeSnap}
            </label>
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </div>

          {snapEnabled && (
            <div>
              <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <span>{t.mergeSnapThreshold}</span>
                <span className="font-semibold text-blue-600">{snapThreshold}px</span>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={snapThreshold}
                onChange={(e) => setSnapThreshold(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-neutral-100 px-3 py-2.5 dark:bg-neutral-800">
            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {t.mergeShowGrid}
            </label>
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="h-4 w-4 accent-blue-600"
            />
          </div>

          {showGrid && (
            <div>
              <label className="mb-2 flex items-center justify-between text-sm font-medium text-neutral-700 dark:text-neutral-300">
                <span>{t.mergeGridSize}</span>
                <span className="font-semibold text-blue-600">{gridSize}px</span>
              </label>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={gridSize}
                onChange={(e) => setGridSize(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          )}

          <div className="space-y-3 border-t border-neutral-200 pt-5 dark:border-neutral-700">
            <button onClick={exportPng} disabled={items.length === 0 || isRendering} className={buttonPrimary}>
              <Download className="h-4 w-4" />
              {isRendering ? t.convertConverting : t.mergeExport}
            </button>
            {resultUrl && (
              <button onClick={download} className={buttonSecondary}>
                <Download className="h-4 w-4" />
                {t.download}
              </button>
            )}
            {selectedId && (
              <button onClick={removeSelected} className={buttonSecondary}>
                <X className="h-4 w-4" />
                {t.mergeRemoveSelected}
              </button>
            )}
            <button onClick={clearAll} disabled={items.length === 0} className={buttonSecondary}>
              {t.convertClear}
            </button>
          </div>

          <div className="space-y-2 rounded-xl bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            <p>🔹 {t.mergeHint1}</p>
            <p>🔹 {t.mergeHint2}</p>
            <p>🔹 {t.mergeHint3}</p>
          </div>
        </div>

        {/* 画布区域 */}
        <div className="lg:col-span-8">
          {items.length === 0 ? (
            <div
              className={`flex h-full min-h-[480px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
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
                multiple
                className="hidden"
                onChange={handleFileInput}
              />
              <button onClick={() => fileInputRef.current?.click()} className="flex cursor-pointer flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-neutral-400" />
                <div>
                  <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200">
                    {t.mergeDropTitle}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{t.convertDropOr}</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
                <canvas
                  ref={canvasRef}
                  className="mx-auto block max-w-full cursor-move touch-none rounded-lg"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
                >
                  <Upload className="mr-1 inline h-3.5 w-3.5" />
                  {t.convertAddMore}
                </button>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {t.mergeCount(items.length)} · {canvasWidth} × {canvasHeight}
                </span>
              </div>

              {resultUrl && (
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <img src={resultUrl} alt={t.mergeExport} className="mx-auto max-h-[420px] max-w-full rounded-xl shadow-md" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}