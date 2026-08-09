import { FormattedMessage, useIntl } from 'react-intl';

import { buttonVariants } from '@vhnam/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@vhnam/ui/components/dropdown-menu';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { getApiErrorMessage } from '#/lib/api-error/api-error';
import { formatErrorMessage } from '#/lib/locale/intl-message';

import { usePublicStatement } from '#/queries/statement-shares/statement-share.queries';

import { StatementSnapshotView } from '#/modules/statement/statement-snapshot-view';

type StatementPublicPageProps = {
  token: string;
};

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
          <DropdownMenu>
            <DropdownMenuTrigger className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <Icon name="DownloadIcon" />
              <FormattedMessage id="statement.public.download" defaultMessage="Download" />
              <Icon name="CaretDownIcon" className="size-3.5 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<a href={`/api/public/statements/${token}?format=csv`} download />}
                >
                  <FormattedMessage id="statement.public.downloadCsv" defaultMessage="Download CSV" />
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton={false}
                  render={<a href={`/api/public/statements/${token}?format=pdf`} download />}
                >
                  <FormattedMessage id="statement.public.downloadPdf" defaultMessage="Download PDF" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="size-12 text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          {formatErrorMessage(intl, getApiErrorMessage(error, 'errors.STATEMENT_UNAVAILABLE'))}
        </p>
      ) : data ? (
        <StatementSnapshotView snapshot={data.snapshot} />
      ) : null}
    </div>
  );
}

export { StatementPublicPage };
