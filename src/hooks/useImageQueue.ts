import { useState, useCallback, useEffect, useRef } from 'react';
import type { ImageFile, CompressionOptions } from '../types';
import { COMPRESSION_MODE, RESIZE_MODE } from '../lib/caesium/constants';

interface CompressResult {
  success: boolean;
  size: number;
  data: Uint8Array | null;
  errorCode?: number;
  errorString?: string;
  uuid?: string;
}

/** 根据源文件推断输出扩展名（libcaesium 保持原格式输出） */
function getExtension(file: File): string {
  const name = file.name.toLowerCase();
  const lastDot = name.lastIndexOf('.');
  if (lastDot >= 0 && lastDot < name.length - 1) {
    const ext = name.slice(lastDot + 1);
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'jxl'].includes(ext)) return ext;
  }
  const mime = file.type.split('/')[1];
  return mime === 'jpeg' ? 'jpg' : mime || 'jpg';
}

export function useImageQueue(
  options: CompressionOptions,
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>
) {
  const MAX_PARALLEL_PROCESSING = 3;
  const [queue, setQueue] = useState<string[]>([]);
  const processingCount = useRef(0);
  const processingImages = useRef(new Set<string>());

  // ── libcaesium worker 生命周期 ───────────────────────────
  const workerRef = useRef<Worker | null>(null);
  const workerReadyRef = useRef(false);
  const callbacksRef = useRef(new Map<string, (result: CompressResult) => void>());
  const initPromiseRef = useRef<Promise<void> | null>(null);

  const initWorker = useCallback((): Promise<void> => {
    if (initPromiseRef.current) return initPromiseRef.current;

    initPromiseRef.current = new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL('../workers/compression-worker.js', import.meta.url),
          { type: 'module' }
        );
        workerRef.current = worker;

        worker.onmessage = (e) => {
          if (e.data === 'initFinished') {
            workerReadyRef.current = true;
            resolve();
            return;
          }
          if (e.data && e.data.uuid) {
            const cb = callbacksRef.current.get(e.data.uuid);
            if (cb) {
              callbacksRef.current.delete(e.data.uuid);
              cb(e.data);
            }
          }
        };

        worker.onerror = (err) => {
          console.error('Compression worker error:', err);
          reject(err);
        };

        worker.postMessage('initLib');
      } catch (err) {
        reject(err);
      }
    });
    return initPromiseRef.current;
  }, []);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
      initPromiseRef.current = null;
    };
  }, []);

  // ── 单图压缩（worker 调用） ──────────────────────────────
  const compressWithWorker = useCallback(
    (image: ImageFile) =>
      new Promise<CompressResult>((resolve) => {
        const worker = workerRef.current;
        if (!worker || !workerReadyRef.current) {
          resolve({
            success: false,
            size: image.originalSize,
            data: null,
            errorString: 'Compression engine not ready',
          });
          return;
        }

        callbacksRef.current.set(image.id, resolve);

        const {
          mode,
          quality,
          lossless,
          keepMetadata,
          maxSize,
          resizeMode,
          resizeWidth,
          resizeHeight,
          resizePercentage,
          resizeEdge,
        } = options;

        let rw = 0;
        let rh = 0;
        let rp = resizePercentage;
        if (resizeMode === RESIZE_MODE.DIMENSIONS) {
          rw = resizeWidth || 0;
          rh = resizeHeight || 0;
        } else if (
          [
            RESIZE_MODE.SHORT_EDGE,
            RESIZE_MODE.LONG_EDGE,
            RESIZE_MODE.FIXED_WIDTH,
            RESIZE_MODE.FIXED_HEIGHT,
          ].includes(resizeMode)
        ) {
          rw = resizeEdge || 0;
        }

        const targetSize = mode === 'size' ? maxSize : 0;
        const q = lossless ? 0 : quality;
        const cm = mode === 'quality' ? COMPRESSION_MODE.QUALITY : COMPRESSION_MODE.SIZE;

        worker.postMessage([
          image.file,
          q,
          keepMetadata ? 1 : 0,
          targetSize,
          cm,
          image.id,
          resizeMode,
          rw,
          rh,
          rp,
        ]);
      }),
    [options]
  );

  const processImage = useCallback(
    async (image: ImageFile) => {
      if (processingImages.current.has(image.id)) return;
      processingImages.current.add(image.id);
      processingCount.current++;

      try {
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id ? { ...img, status: 'processing' as const } : img
          )
        );

        await initWorker();
        const result = await compressWithWorker(image);

        if (!result.success || !result.data) {
          throw new Error(result.errorString || 'Compression failed');
        }

        // libcaesium 保持原格式，输出 MIME 沿用源文件
        const blob = new Blob([result.data], { type: image.file.type || 'image/jpeg' });
        const preview = URL.createObjectURL(blob);
        const outputType = getExtension(image.file);

        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'complete' as const,
                  preview,
                  blob,
                  compressedSize: result.size,
                  outputType,
                }
              : img
          )
        );
      } catch (error) {
        console.error('Error processing image:', error);
        setImages((prev) =>
          prev.map((img) =>
            img.id === image.id
              ? {
                  ...img,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Failed to process image',
                }
              : img
          )
        );
      } finally {
        processingImages.current.delete(image.id);
        processingCount.current--;
        setTimeout(processNextInQueue, 0);
      }
    },
    [compressWithWorker, initWorker, setImages]
  );

  const processNextInQueue = useCallback(() => {
    if (queue.length === 0) return;

    setImages((prev) => {
      const imagesToProcess = prev.filter(
        (img) =>
          queue.includes(img.id) &&
          !processingImages.current.has(img.id) &&
          processingCount.current < MAX_PARALLEL_PROCESSING
      );

      if (imagesToProcess.length === 0) return prev;

      imagesToProcess.forEach((image, index) => {
        setTimeout(() => {
          processImage(image);
        }, index * 100);
      });

      setQueue((current) =>
        current.filter((id) => !imagesToProcess.some((img) => img.id === id))
      );

      return prev.map((img) =>
        imagesToProcess.some((processImg) => processImg.id === img.id)
          ? { ...img, status: 'queued' as const }
          : img
      );
    });
  }, [queue, processImage, setImages]);

  useEffect(() => {
    if (queue.length > 0) {
      processNextInQueue();
    }
  }, [queue, processNextInQueue]);

  const addToQueue = useCallback((imageId: string) => {
    setQueue((prev) => [...prev, imageId]);
  }, []);

  return { addToQueue };
}