/** 与 image-hub 的 COMPRESSION_MODE / RESIZE_MODE 保持一致 */
export const COMPRESSION_MODE = {
  QUALITY: 0,
  SIZE: 1,
} as const;

export const RESIZE_MODE = {
  NONE: 'none',
  DIMENSIONS: 'dimensions',
  PERCENTAGE: 'percentage',
  SHORT_EDGE: 'short_edge',
  LONG_EDGE: 'long_edge',
  FIXED_WIDTH: 'fixed_width',
  FIXED_HEIGHT: 'fixed_height',
} as const;

export const MAX_SIZE_UNIT = {
  BYTE: 1,
  KILOBYTE: 1000,
  MEGABYTE: 1000000,
} as const;