import axios from 'axios';

import { getApiErrorMessage } from '#/lib/api-error';
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
    throw new Error(getApiErrorMessage(error, 'Failed to load statement shares. Please try again.'));
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
    throw new Error(getApiErrorMessage(error, 'Failed to preview statement. Please try again.'));
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
    throw new Error(getApiErrorMessage(error, 'Failed to create share link. Please try again.'));
  }
}

export async function revokeStatementShare(walletId: string, shareId: string): Promise<void> {
  try {
    await axios.delete(`/api/wallets/${walletId}/statement-shares/${shareId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to revoke share link. Please try again.'));
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

function extractFilename(contentDisposition: string | undefined): string {
  const match = contentDisposition?.match(/filename="([^"]+)"/);

  return match?.[1] ?? 'statement.csv';
}

export async function downloadStatementPreviewCsv(
  walletId: string,
  payload: CreateStatementSharePayload,
): Promise<StatementCsvDownload> {
  try {
    const response = await axios.post<Blob>(
      `/api/wallets/${walletId}/statement-shares?preview=true&format=csv`,
      payload,
      { responseType: 'blob' },
    );

    return { blob: response.data, filename: extractFilename(response.headers['content-disposition']) };
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Failed to download statement. Please try again.'));
  }
}
