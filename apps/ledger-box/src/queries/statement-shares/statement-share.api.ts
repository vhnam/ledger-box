import axios from 'axios';

import { getApiErrorMessage } from '#/lib/api-error/api-error';

import type {
  CreateStatementSharePayload,
  CreateStatementShareResponse,
  PreviewStatementShareResponse,
  PublicStatementResponse,
  StatementShareListDto,
} from '#/queries/statement-shares/statement-share.dto';

export async function fetchStatementShares(walletId: string, page = 1, pageSize = 10): Promise<StatementShareListDto> {
  try {
    const { data } = await axios.get<StatementShareListDto>(`/api/wallets/${walletId}/statement-shares`, {
      params: { page, pageSize },
    });

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'wallet.settings.shares.loadErrorFallback'));
  }
}

export async function previewStatementShare(
  walletId: string,
  payload: CreateStatementSharePayload,
): Promise<PreviewStatementShareResponse> {
  try {
    const { data } = await axios.post<PreviewStatementShareResponse>(
      `/api/wallets/${walletId}/statement-shares?preview=true`,
      payload,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'wallet.settings.shares.previewErrorFallback'));
  }
}

export async function createStatementShare(
  walletId: string,
  payload: CreateStatementSharePayload,
): Promise<CreateStatementShareResponse> {
  try {
    const { data } = await axios.post<CreateStatementShareResponse>(
      `/api/wallets/${walletId}/statement-shares`,
      payload,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'toast.shares.createErrorFallback'));
  }
}

export async function revokeStatementShare(walletId: string, shareId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/statement-shares/${shareId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'toast.shares.revokeErrorFallback'));
  }
}

export async function regenerateStatementShareLink(
  walletId: string,
  shareId: string,
): Promise<CreateStatementShareResponse> {
  try {
    const { data } = await axios.patch<CreateStatementShareResponse>(
      `/api/wallets/${walletId}/statement-shares/${shareId}`,
    );

    return data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'toast.shares.regenerateErrorFallback'));
  }
}

export async function fetchPublicStatement(token: string): Promise<PublicStatementResponse> {
  const { data } = await axios.get<PublicStatementResponse>(`/api/public/statements/${token}`);

  return data;
}

export type StatementCsvDownload = {
  blob: Blob;
  filename: string;
};

export type StatementExportFormat = 'csv' | 'pdf';

function extractFilename(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename="([^"]+)"/);

  return match?.[1] ?? fallback;
}

export async function downloadStatementPreviewExport(
  walletId: string,
  payload: CreateStatementSharePayload,
  format: StatementExportFormat,
): Promise<StatementCsvDownload> {
  try {
    const response = await axios.post<Blob>(
      `/api/wallets/${walletId}/statement-shares?preview=true&format=${format}`,
      payload,
      { responseType: 'blob' },
    );

    return {
      blob: response.data,
      filename: extractFilename(response.headers['content-disposition'], `statement.${format}`),
    };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'wallet.settings.shares.downloadErrorFallback'));
  }
}

export async function downloadStatementPreviewCsv(
  walletId: string,
  payload: CreateStatementSharePayload,
): Promise<StatementCsvDownload> {
  return downloadStatementPreviewExport(walletId, payload, 'csv');
}
