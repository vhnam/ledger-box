import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const ENV_KEYS = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_R2_BUCKET_NAME',
  'CLOUDFLARE_R2_ACCESS_TOKEN',
  'CLOUDFLARE_R2_SECRET_ACCESS_TOKEN',
] as const;

const originalEnv: Record<string, string | undefined> = {};

/** `r2.ts` reads its endpoint from `process.env` once, at module load, so each test needs a fresh module instance. */
async function loadR2(env: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const key of ENV_KEYS) {
    if (env[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = env[key];
    }
  }

  vi.resetModules();
  return import('./r2');
}

describe('r2 configuration guards', () => {
  beforeEach(() => {
    for (const key of ENV_KEYS) {
      originalEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
    vi.resetModules();
  });

  it('rejects when CLOUDFLARE_R2_BUCKET_NAME is not configured', async () => {
    const { uploadTransactionAttachment } = await loadR2({
      CLOUDFLARE_ACCOUNT_ID: 'account-id',
      CLOUDFLARE_R2_ACCESS_TOKEN: 'access-token',
      CLOUDFLARE_R2_SECRET_ACCESS_TOKEN: 'secret-token',
    });

    await expect(
      uploadTransactionAttachment({
        tenantId: 't1',
        transactionId: 'tx1',
        attachmentId: 'a1',
        fileName: 'a.png',
        contentType: 'image/png',
        body: new Uint8Array(),
      }),
    ).rejects.toThrow('CLOUDFLARE_R2_BUCKET_NAME is not configured');
  });

  it('rejects when CLOUDFLARE_ACCOUNT_ID is not configured', async () => {
    const { listTransactionAttachments } = await loadR2({ CLOUDFLARE_R2_BUCKET_NAME: 'my-bucket' });

    await expect(listTransactionAttachments('t1', 'tx1')).rejects.toThrow('CLOUDFLARE_ACCOUNT_ID is not configured');
  });

  it('rejects when R2 credentials are not configured', async () => {
    const { deleteTransactionAttachment } = await loadR2({
      CLOUDFLARE_ACCOUNT_ID: 'account-id',
      CLOUDFLARE_R2_BUCKET_NAME: 'my-bucket',
    });

    await expect(deleteTransactionAttachment('t1', 'tx1', 'a1')).rejects.toThrow(
      'Cloudflare R2 credentials are not configured',
    );
  });
});
