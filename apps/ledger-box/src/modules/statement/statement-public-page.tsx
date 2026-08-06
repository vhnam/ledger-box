import axios from 'axios';
import { FormattedMessage, useIntl, type IntlShape } from 'react-intl';

import { buttonVariants } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { formatErrorMessage } from '#/lib/intl-message';
import { StatementSnapshotView } from '#/modules/statement/statement-snapshot-view';
import { usePublicStatement } from '#/queries/statement-shares/statement-share.queries';

type StatementPublicPageProps = {
  token: string;
};

const STATEMENT_API_MESSAGE_IDS: Record<string, string> = {
  'This link is not valid.': 'statement.public.error.invalid',
  'This link has been revoked.': 'statement.public.error.revoked',
  'This link has expired.': 'statement.public.error.expired',
  'Too many requests. Please try again shortly.': 'statement.public.error.rateLimited',
};

function getStatementErrorMessage(intl: IntlShape, error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      const messageId = STATEMENT_API_MESSAGE_IDS[data];
      if (messageId) {
        return formatErrorMessage(intl, messageId);
      }

      return formatErrorMessage(intl, data);
    }

    if (error.response?.status === 404) {
      return formatErrorMessage(intl, 'statement.public.error.invalid');
    }

    if (error.response?.status === 429) {
      return formatErrorMessage(intl, 'statement.public.error.rateLimited');
    }
  }

  return formatErrorMessage(intl, 'statement.public.error.unavailable');
}

function StatementPublicPage({ token }: StatementPublicPageProps) {
  const intl = useIntl();
  const { data, isPending, isError, error } = usePublicStatement(token);
  const fallbackTitle = intl.formatMessage({
    id: 'statement.public.title',
    defaultMessage: 'Account statement',
  });

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-4 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">{data?.displayTitle ?? fallbackTitle}</h1>
        {data ? (
          <a
            href={`/api/public/statements/${token}?format=csv`}
            download
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Icon name="DownloadIcon" />
            <FormattedMessage id="statement.public.downloadCsv" defaultMessage="Download CSV" />
          </a>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="size-12 text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{getStatementErrorMessage(intl, error)}</p>
      ) : data ? (
        <StatementSnapshotView snapshot={data.snapshot} />
      ) : null}
    </div>
  );
}

export { StatementPublicPage };
