import axios from 'axios';

import { buttonVariants } from '@vhnam/ui/components/button';
import { Icon } from '@vhnam/ui/components/icon';
import { Spinner } from '@vhnam/ui/components/spinner';

import { StatementSnapshotView } from '#/modules/statement/statement-snapshot-view';
import { usePublicStatement } from '#/queries/statement-shares/statement-share.queries';

type StatementPublicPageProps = {
  token: string;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === 'string' && data.length > 0) {
      return data;
    }

    if (error.response?.status === 404) {
      return 'This link is not valid.';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please try again shortly.';
    }
  }

  return 'This statement is no longer available.';
}

function StatementPublicPage({ token }: StatementPublicPageProps) {
  const { data, isPending, isError, error } = usePublicStatement(token);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-6 p-4 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-heading text-lg font-medium">{data?.displayTitle ?? 'Account statement'}</h1>
        {data ? (
          <a
            href={`/api/public/statements/${token}?format=csv`}
            download
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <Icon name="DownloadIcon" />
            Download CSV
          </a>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-1 items-center justify-center py-16">
          <Spinner className="size-12 text-muted-foreground" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{getErrorMessage(error)}</p>
      ) : data ? (
        <StatementSnapshotView snapshot={data.snapshot} />
      ) : null}
    </div>
  );
}

export { StatementPublicPage };
