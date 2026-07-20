import { isImageFile } from '#/lib/file';

const MAX_IMAGE_DIMENSION = 2048;
const MIN_SIZE_TO_OPTIMIZE_BYTES = 150 * 1024;
const JPEG_QUALITY = 0.85;

function replaceFileExtension(fileName: string, extension: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '');

  return `${baseName}.${extension}`;
}

async function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });
}

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!isImageFile(file) || file.size < MIN_SIZE_TO_OPTIMIZE_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = largestSide > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / largestSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      bitmap.close();
      return file;
    }

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const keepPng = file.type === 'image/png';
    const mimeType = keepPng ? 'image/png' : 'image/jpeg';
    const blob = await canvasToBlob(canvas, mimeType, keepPng ? undefined : JPEG_QUALITY);

    if (!blob || blob.size >= file.size) {
      return file;
    }

    const fileName = keepPng ? file.name : replaceFileExtension(file.name, 'jpg');

    return new File([blob], fileName, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
