import { describe, expect, it } from 'vite-plus/test';

import { optimizeImageForUpload } from './image';

/**
 * Only the early-return guards are exercised here: the resize path needs `document`/canvas
 * APIs that the `node` test environment does not provide.
 */
describe('optimizeImageForUpload', () => {
  it('returns non-image files unchanged', async () => {
    const file = new File(['%PDF-1.4'], 'doc.pdf', { type: 'application/pdf' });

    await expect(optimizeImageForUpload(file)).resolves.toBe(file);
  });

  it('returns small image files unchanged', async () => {
    const file = new File(['tiny'], 'small.png', { type: 'image/png' });

    await expect(optimizeImageForUpload(file)).resolves.toBe(file);
  });
});
