/**
 * 图片处理工具函数。
 *
 * 注意：压缩内核已替换为 image-hub 的 libcaesium WASM 引擎（见 src/workers/compression-worker.js），
 * 原 @jsquash 的 decode/encode 流程已删除，这里只保留通用的文件大小格式化。
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}