import { cn } from 'cn';
import { FormattedMessage, useIntl } from 'react-intl';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@vhnam/ui/components/ui/pagination';

import type { PageItem } from '#/utils/pagination';

type AppPaginationProps = {
  page: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  pageItems: PageItem[];
  goToPage: (page: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

function AppPagination({
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  pageItems,
  goToPage,
  goToPreviousPage,
  goToNextPage,
}: AppPaginationProps) {
  const intl = useIntl();

  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        <FormattedMessage
          id="transaction.list.pageOf"
          defaultMessage="Page {page} of {totalPages}"
          values={{ page, totalPages }}
        />
      </div>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canGoPrevious}
              aria-label={intl.formatMessage({
                id: 'pagination.previous.ariaLabel',
                defaultMessage: 'Go to previous page',
              })}
              text={intl.formatMessage({ id: 'pagination.previous.text', defaultMessage: 'Previous' })}
              className={cn(!canGoPrevious && 'pointer-events-none opacity-50')}
              onClick={(event) => {
                event.preventDefault();
                goToPreviousPage();
              }}
            />
          </PaginationItem>

          {pageItems.map((item, index) => (
            <PaginationItem key={item === 'ellipsis' ? `ellipsis-${index}` : item}>
              {item === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  size="sm"
                  href="#"
                  isActive={item === page}
                  onClick={(event) => {
                    event.preventDefault();
                    goToPage(item);
                  }}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={!canGoNext}
              aria-label={intl.formatMessage({ id: 'pagination.next.ariaLabel', defaultMessage: 'Go to next page' })}
              text={intl.formatMessage({ id: 'pagination.next.text', defaultMessage: 'Next' })}
              className={cn(!canGoNext && 'pointer-events-none opacity-50')}
              onClick={(event) => {
                event.preventDefault();
                goToNextPage();
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

export { AppPagination };
