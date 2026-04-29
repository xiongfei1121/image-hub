import CaesiumWASM from '~/assets/wasm/libcaesium-wasm';
import { COMPRESSION_MODE, RESIZE_MODE } from '@/utils/utils';

let LibcaesiumWasm = null;
onmessage = (e) => {
  if (e.data === 'initLib') {
    initLib();
  } else {
    const file = e.data[0];
    const quality = e.data[1];
    const keepMetadata = e.data[2];
    const maxSize = e.data[3];
    const compressionMode = e.data[4];
    const uuid = e.data[5];
    const resizeMode = e.data[6];
    const resizeWidth = e.data[7];
    const resizeHeight = e.data[8];
    const resizePercentage = e.data[9];
    try {
      performCompress(file, quality, keepMetadata, maxSize, compressionMode, uuid, resizeMode, resizeWidth, resizeHeight, resizePercentage);
    } catch (err) {
      postMessage({
        success: false,
        size: file.size,
        data: null,
        errorCode: 100,
        errorString: err.toString(),
        uuid,
      });
    }
  }
};

function initLib() {
  CaesiumWASM()
    .then((lw) => {
      LibcaesiumWasm = lw;
      postMessage('initFinished');
    })
    .catch((e) => {
      const result = {
        success: false,
        size: 0,
        data: null,
        errorCode: 3,
        errorString: e.toString(),
        uuid: null,
      };
      postMessage(result);
    });
}

function performCompress(file, quality, keepMetadata, maxSize, compressionMode, uuid, resizeMode, resizeWidth, resizeHeight, resizePercentage) {
  if (!LibcaesiumWasm) {
    const result = {
      success: false,
      size: 0,
      data: null,
      errorCode: 1,
      errorString: 'WASM not initialized',
      uuid,
    };
    postMessage(result);
    return;
  }

  file
    .arrayBuffer()
    .then((ab) => {
      let inputArray = new Uint8Array(ab);

      // Apply resize if needed
      if (resizeMode && resizeMode !== RESIZE_MODE.NONE) {
        return applyResize(inputArray, resizeMode, resizeWidth, resizeHeight, resizePercentage).then((resizedArray) => {
          return doCompress(resizedArray, quality, keepMetadata, maxSize, compressionMode, uuid);
        });
      }

      return doCompress(inputArray, quality, keepMetadata, maxSize, compressionMode, uuid);
    })
    .catch((e) => {
      const result = {
        success: false,
        size: 0,
        data: null,
        errorCode: 2,
        errorString: e.toString(),
        uuid,
      };
      postMessage(result);
    });
}

// Do the actual compression
function doCompress(inputArray, quality, keepMetadata, maxSize, compressionMode, uuid) {
  let success = false;

  if (compressionMode === COMPRESSION_MODE.SIZE && inputArray.length < maxSize) {
    const result = {
      success: true,
      size: inputArray.length,
      data: inputArray,
      errorCode: 0,
      errorString: '',
      uuid,
    };
    postMessage(result);
    return Promise.resolve();
  }

  const inputPointer = LibcaesiumWasm._malloc(inputArray.length);
  LibcaesiumWasm.HEAP8.set(inputArray, inputPointer);

  let outputVector;
  if (compressionMode === COMPRESSION_MODE.QUALITY) {
    const js_wrapped_compress = LibcaesiumWasm.cwrap('w_compress', 'number', ['number', 'number', 'number', 'number']);
    outputVector = js_wrapped_compress(inputPointer, inputArray.length, quality, keepMetadata ? 1 : 0);
  } else {
    const js_wrapped_compress = LibcaesiumWasm.cwrap('w_compress_to_size', 'number', ['number', 'number', 'number', 'number']);
    outputVector = js_wrapped_compress(inputPointer, inputArray.length, maxSize, keepMetadata ? 1 : 0);
  }

  let outputLength = 0;
  let status = 0;
  let errorCode = 0;
  let outputArray = new Uint8Array();
  if (outputVector) {
    status = LibcaesiumWasm.getValue(outputVector, 'i32');
    errorCode = LibcaesiumWasm.getValue(outputVector + 4, 'i32');
    const outputPointer = LibcaesiumWasm.getValue(outputVector + 8, 'i32');
    outputLength = LibcaesiumWasm.getValue(outputVector + 12, 'i32');

    if (status === 1) {
      outputArray = new Uint8Array(LibcaesiumWasm.HEAPU8.buffer, outputPointer, outputLength);
      success = true;
    }
  }
  const result = {
    success: success,
    size: outputLength,
    data: outputArray,
    errorCode: errorCode,
    errorString: '',
    uuid,
  };

  postMessage(result);

  const drop_vector_struct = LibcaesiumWasm.cwrap('drop_vector_struct', null, ['number']);
  drop_vector_struct(outputVector);
  LibcaesiumWasm._free(inputPointer);
}

// Resize functions using Canvas API
function applyResize(inputArray, resizeMode, resizeWidth, resizeHeight, resizePercentage) {
  // Create blob from input array
  const blob = new Blob([inputArray]);
  const url = URL.createObjectURL(blob);

  return fetch(url)
    .then((resp) => resp.blob())
    .then((blob) => createImageBitmap(blob))
    .then((bitmap) => {
      URL.revokeObjectURL(url);

      let newWidth, newHeight;
      const origWidth = bitmap.width;
      const origHeight = bitmap.height;

      switch (resizeMode) {
        case RESIZE_MODE.DIMENSIONS:
          newWidth = resizeWidth || origWidth;
          newHeight = resizeHeight || origHeight;
          break;
        case RESIZE_MODE.PERCENTAGE:
          const percent = resizePercentage / 100;
          newWidth = Math.round(origWidth * percent);
          newHeight = Math.round(origHeight * percent);
          break;
        case RESIZE_MODE.SHORT_EDGE:
          const shortEdge = resizeWidth || Math.min(origWidth, origHeight);
          if (origWidth < origHeight) {
            newWidth = shortEdge;
            newHeight = Math.round(origHeight * (shortEdge / origWidth));
          } else {
            newHeight = shortEdge;
            newWidth = Math.round(origWidth * (shortEdge / origHeight));
          }
          break;
        case RESIZE_MODE.LONG_EDGE:
          const longEdge = resizeWidth || Math.max(origWidth, origHeight);
          if (origWidth > origHeight) {
            newWidth = longEdge;
            newHeight = Math.round(origHeight * (longEdge / origWidth));
          } else {
            newHeight = longEdge;
            newWidth = Math.round(origWidth * (longEdge / origHeight));
          }
          break;
        case RESIZE_MODE.FIXED_WIDTH:
          newWidth = resizeWidth || origWidth;
          newHeight = Math.round(origHeight * (newWidth / origWidth));
          break;
        case RESIZE_MODE.FIXED_HEIGHT:
          newHeight = resizeHeight || origHeight;
          newWidth = Math.round(origWidth * (newHeight / origHeight));
          break;
        default:
          newWidth = origWidth;
          newHeight = origHeight;
      }

      const canvas = new OffscreenCanvas(newWidth, newHeight);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, newWidth, newHeight);
      bitmap.close();

      return canvas.convertToBlob({ type: getImageType(inputArray), quality: 0.92 })
        .then((outputBlob) => outputBlob.arrayBuffer())
        .then((ab) => new Uint8Array(ab));
    })
    .catch(() => {
      URL.revokeObjectURL(url);
      return inputArray;
    });
}

// Helper to detect image type from magic bytes
function getImageType(inputArray) {
  if (inputArray.length >= 2) {
    if (inputArray[0] === 0xff && inputArray[1] === 0xd8) return 'image/jpeg';
    if (inputArray[0] === 0x89 && inputArray[1] === 0x50) return 'image/png';
    if (inputArray[0] === 0x47 && inputArray[1] === 0x49 && inputArray[2] === 0x46) return 'image/gif';
    if (inputArray.length >= 12 && inputArray[0] === 0x52 && inputArray[1] === 0x49 &&
        inputArray[8] === 0x57 && inputArray[9] === 0x45 && inputArray[10] === 0x42 && inputArray[11] === 0x50) {
      return 'image/webp';
    }
  }
  return 'image/jpeg';
}