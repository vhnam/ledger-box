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

function buildTransactionPrefix(transactionId: string): string {
  const { keyPrefix } = getR2BucketConfig();
  const segments = [keyPrefix, 'transactions', transactionId].filter((segment) => segment.length > 0);

  return `${segments.join('/')}/`;
}

function parseAttachmentObjectKey(
  key: string,
  transactionId: string,
): {
  id: string;
  fileName: string;
} | null {
  const prefix = buildTransactionPrefix(transactionId);

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

function buildObjectKey(transactionId: string, attachmentId: string, fileName: string): string {
  const { keyPrefix } = getR2BucketConfig();
  const segments = [keyPrefix, 'transactions', transactionId, attachmentId, fileName].filter(
    (segment) => segment.length > 0,
  );

  return segments.join('/');
}

function buildPublicUrl(objectKey: string): string | undefined {
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, '');

  if (!publicBaseUrl) {
    return undefined;
  }

  return `${publicBaseUrl}/${objectKey}`;
}

type UploadTransactionAttachmentInput = {
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
  const key = buildObjectKey(input.transactionId, input.attachmentId, input.fileName);

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

async function listTransactionAttachments(transactionId: string): Promise<UploadTransactionAttachmentResult[]> {
  const client = getR2Client();
  const { bucket } = getR2BucketConfig();
  const prefix = buildTransactionPrefix(transactionId);
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

      const parsed = parseAttachmentObjectKey(object.Key, transactionId);

      if (!parsed) {
        continue;
      }

      const contentType = inferContentType(parsed.fileName);

      attachments.push({
        id: parsed.id,
        key: object.Key,
        url: buildPublicUrl(object.Key),
        fileName: parsed.fileName,
        contentType,
        size: object.Size,
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return attachments.sort((left, right) => left.fileName.localeCompare(right.fileName));
}

async function deleteTransactionAttachment(transactionId: string, attachmentId: string): Promise<boolean> {
  const client = getR2Client();
  const { bucket } = getR2BucketConfig();
  const prefix = `${buildTransactionPrefix(transactionId)}${attachmentId}/`;
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

export { deleteTransactionAttachment, listTransactionAttachments, uploadTransactionAttachment };
