import type { IconName } from '@vhnam/ui/components/icon';

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

export function isPdfFile(file: File) {
  return file.type === 'application/pdf';
}

export function isPreviewableFile(file: File) {
  return isImageFile(file) || isPdfFile(file);
}

export function getFileTypeLabel(file: File) {
  if (isPdfFile(file)) {
    return 'PDF';
  }

  const extension = file.name.split('.').pop()?.toUpperCase();

  if (extension) {
    return extension === 'JPG' ? 'JPEG' : extension;
  }

  return 'FILE';
}

export function getAttachmentIconName(file: File): IconName {
  if (isPdfFile(file)) {
    return 'FilePdfIcon';
  }

  if (isImageFile(file)) {
    return 'FileImageIcon';
  }

  return 'FileIcon';
}
