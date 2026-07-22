import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const R2_ENDPOINT = process.env.CLOUDFLARE_ACCOUNT_ID
  ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

type R2BucketConfig = {
  bucket: string;
  keyPrefix: string;
};

function getR2BucketConfig(): R2BucketConfig {
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME is not configured');
  }

  const slashIndex = bucketName.indexOf('/');

  if (slashIndex > 0) {
    return {
      bucket: bucketName.slice(0, slashIndex),
      keyPrefix: bucketName.slice(slashIndex + 1).replace(/\/$/, ''),
    };
  }

  return {
    bucket: bucketName,
    keyPrefix: '',
  };
}

function getR2Client(): S3Client {
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_TOKEN;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_TOKEN;

  if (!R2_ENDPOINT) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID is not configured');
  }

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Cloudflare R2 credentials are not configured');
  }

  return new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function joinKeySegments(...segments: string[]): string {
  return segments.filter((segment) => segment.length > 0).join('/');
}

function buildTransactionPrefix(tenantId: string, transactionId: string): string {
  const { keyPrefix } = getR2BucketConfig();

  return `${joinKeySegments(keyPrefix, 'tenants', tenantId, 'transactions', transactionId)}/`;
}

/** Pre-tenant path used before multi-tenant keys were introduced. */
function buildLegacyTransactionPrefix(transactionId: string): string {
  const { keyPrefix } = getR2BucketConfig();

  return `${joinKeySegments(keyPrefix, 'transactions', transactionId)}/`;
}

function parseAttachmentObjectKey(
  key: string,
  prefix: string,
): {
  id: string;
  fileName: string;
} | null {
  if (!key.startsWith(prefix)) {
    return null;
  }

  const remainder = key.slice(prefix.length);
  const slashIndex = remainder.indexOf('/');

  if (slashIndex <= 0) {
    return null;
  }

  const id = remainder.slice(0, slashIndex);
  const fileName = remainder.slice(slashIndex + 1);

  if (!id || !fileName) {
    return null;
  }

  return { id, fileName };
}

function inferContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

function buildObjectKey(tenantId: string, transactionId: string, attachmentId: string, fileName: string): string {
  const { keyPrefix } = getR2BucketConfig();

  return joinKeySegments(keyPrefix, 'tenants', tenantId, 'transactions', transactionId, attachmentId, fileName);
}

function buildPublicUrl(objectKey: string): string | undefined {
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, '');

  if (!publicBaseUrl) {
    return undefined;
  }

  return `${publicBaseUrl}/${objectKey}`;
}

type UploadTransactionAttachmentInput = {
  tenantId: string;
  transactionId: string;
  attachmentId: string;
  fileName: string;
  contentType: string;
  body: Uint8Array;
};

type UploadTransactionAttachmentResult = {
  id: string;
  key: string;
  url?: string;
  fileName: string;
  contentType: string;
  size: number;
};

async function uploadTransactionAttachment(
  input: UploadTransactionAttachmentInput,
): Promise<UploadTransactionAttachmentResult> {
  const client = getR2Client();
  const { bucket } = getR2BucketConfig();
  const key = buildObjectKey(input.tenantId, input.transactionId, input.attachmentId, input.fileName);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );

  return {
    id: input.attachmentId,
    key,
    url: buildPublicUrl(key),
    fileName: input.fileName,
    contentType: input.contentType,
    size: input.body.byteLength,
  };
}

async function listAttachmentsUnderPrefix(
  client: S3Client,
  bucket: string,
  prefix: string,
): Promise<UploadTransactionAttachmentResult[]> {
  const attachments: UploadTransactionAttachmentResult[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || object.Size === undefined) {
        continue;
      }

      const parsed = parseAttachmentObjectKey(object.Key, prefix);

      if (!parsed) {
        continue;
      }

      attachments.push({
        id: parsed.id,
        key: object.Key,
        url: buildPublicUrl(object.Key),
        fileName: parsed.fileName,
        contentType: inferContentType(parsed.fileName),
        size: object.Size,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return attachments;
}

async function listTransactionAttachments(
  tenantId: string,
  transactionId: string,
): Promise<UploadTransactionAttachmentResult[]> {
  const client = getR2Client();
  const { bucket } = getR2BucketConfig();
  const tenantPrefix = buildTransactionPrefix(tenantId, transactionId);
  const legacyPrefix = buildLegacyTransactionPrefix(transactionId);

  const [tenantAttachments, legacyAttachments] = await Promise.all([
    listAttachmentsUnderPrefix(client, bucket, tenantPrefix),
    listAttachmentsUnderPrefix(client, bucket, legacyPrefix),
  ]);

  const attachmentsById = new Map<string, UploadTransactionAttachmentResult>();

  for (const attachment of [...legacyAttachments, ...tenantAttachments]) {
    attachmentsById.set(attachment.id, attachment);
  }

  return [...attachmentsById.values()].sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function deleteAttachmentsUnderPrefix(client: S3Client, bucket: string, prefix: string): Promise<boolean> {
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
    }),
  );

  const keys = (response.Contents ?? []).flatMap((object) => (object.Key ? [object.Key] : []));

  if (keys.length === 0) {
    return false;
  }

  await Promise.all(
    keys.map((key) =>
      client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      ),
    ),
  );

  return true;
}

async function deleteTransactionAttachment(
  tenantId: string,
  transactionId: string,
  attachmentId: string,
): Promise<boolean> {
  const client = getR2Client();
  const { bucket } = getR2BucketConfig();
  const tenantPrefix = `${buildTransactionPrefix(tenantId, transactionId)}${attachmentId}/`;
  const legacyPrefix = `${buildLegacyTransactionPrefix(transactionId)}${attachmentId}/`;

  const [deletedTenant, deletedLegacy] = await Promise.all([
    deleteAttachmentsUnderPrefix(client, bucket, tenantPrefix),
    deleteAttachmentsUnderPrefix(client, bucket, legacyPrefix),
  ]);

  return deletedTenant || deletedLegacy;
}

export { deleteTransactionAttachment, listTransactionAttachments, uploadTransactionAttachment };
