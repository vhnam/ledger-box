import { describe, expect, it } from 'vite-plus/test';

import {
  formatFileSize,
  getAttachmentIconName,
  getAttachmentIconNameFromContentType,
  getFileTypeLabel,
  getFileTypeLabelFromName,
  isImageContentType,
  isImageFile,
  isPdfContentType,
  isPdfFile,
  isPreviewableContentType,
  isPreviewableFile,
} from './file';

function makeFile(name: string, type: string) {
  return new File(['content'], name, { type });
}

describe('formatFileSize', () => {
  it('formats bytes, kilobytes, and megabytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('file/content-type predicates', () => {
  it('detects image files and content types', () => {
    expect(isImageFile(makeFile('a.png', 'image/png'))).toBe(true);
    expect(isImageFile(makeFile('a.pdf', 'application/pdf'))).toBe(false);
    expect(isImageContentType('image/webp')).toBe(true);
    expect(isImageContentType('application/pdf')).toBe(false);
  });

  it('detects PDF files and content types', () => {
    expect(isPdfFile(makeFile('a.pdf', 'application/pdf'))).toBe(true);
    expect(isPdfContentType('application/pdf')).toBe(true);
    expect(isPdfContentType('image/png')).toBe(false);
  });

  it('treats images and PDFs as previewable, everything else as not', () => {
    expect(isPreviewableFile(makeFile('a.png', 'image/png'))).toBe(true);
    expect(isPreviewableFile(makeFile('a.pdf', 'application/pdf'))).toBe(true);
    expect(isPreviewableFile(makeFile('a.docx', 'application/msword'))).toBe(false);
    expect(isPreviewableContentType('application/octet-stream')).toBe(false);
  });
});

describe('getFileTypeLabelFromName / getFileTypeLabel', () => {
  it('prefers "PDF" from a pdf content type', () => {
    expect(getFileTypeLabelFromName('report', 'application/pdf')).toBe('PDF');
  });

  it('normalizes JPG to JPEG and uppercases other extensions', () => {
    expect(getFileTypeLabelFromName('photo.jpg')).toBe('JPEG');
    expect(getFileTypeLabelFromName('photo.png')).toBe('PNG');
  });

  it('falls back to FILE for an empty name', () => {
    expect(getFileTypeLabelFromName('')).toBe('FILE');
  });

  it('derives the label from a File object', () => {
    expect(getFileTypeLabel(makeFile('photo.jpg', 'image/jpeg'))).toBe('JPEG');
  });
});

describe('attachment icon name', () => {
  it('maps content types to icon names', () => {
    expect(getAttachmentIconNameFromContentType('application/pdf')).toBe('FilePdfIcon');
    expect(getAttachmentIconNameFromContentType('image/png')).toBe('FileImageIcon');
    expect(getAttachmentIconNameFromContentType('application/octet-stream')).toBe('FileIcon');
  });

  it('derives the icon name from a File object', () => {
    expect(getAttachmentIconName(makeFile('a.png', 'image/png'))).toBe('FileImageIcon');
  });
});
