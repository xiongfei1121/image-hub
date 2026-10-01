export interface ImageFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'queued' | 'processing' | 'complete' | 'error';
  error?: string;
  originalSize: number;
  compressedSize?: number;
  outputType?: string;
  blob?: Blob;
}

/** 压缩模式：质量优先 或 大小限制（目标体积） */
export type CompressionMode = 'quality' | 'size';

/** 缩放方式，与 image-hub 的 RESIZE_MODE 保持一致 */
export type ResizeMode =
  | 'none'
  | 'dimensions'
  | 'percentage'
  | 'short_edge'
  | 'long_edge'
  | 'fixed_width'
  | 'fixed_height';

export interface CompressionOptions {
  mode: CompressionMode;
  /** 质量 1-100；无损模式下忽略 */
  quality: number;
  /** 无损压缩 */
  lossless: boolean;
  /** 保留 EXIF 等元数据 */
  keepMetadata: boolean;
  /** 大小限制模式下目标最大字节数 */
  maxSize: number;
  resizeMode: ResizeMode;
  resizeWidth: number;
  resizeHeight: number;
  /** 百分比缩放，1-200 */
  resizePercentage: number;
  /** 短边/长边/固定宽/固定高共享的边长输入 */
  resizeEdge: number;
}

export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  mode: 'quality',
  quality: 80,
  lossless: false,
  keepMetadata: false,
  maxSize: 500 * 1000,
  resizeMode: 'none',
  resizeWidth: 0,
  resizeHeight: 0,
  resizePercentage: 100,
  resizeEdge: 0,
};