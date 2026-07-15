import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@vhnam/ui/components/pagination';
import { cn } from '@vhnam/ui/lib/utils';

import type { PageItem } from './wallet-transactions.actions';

type WalletPaginationProps = {
  page: number;
  totalPages: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  pageItems: PageItem[];
  goToPage: (page: number) => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

function WalletPagination({
  page,
  totalPages,
  canGoPrevious,
  canGoNext,
  pageItems,
  goToPage,
  goToPreviousPage,
  goToNextPage,
}: WalletPaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={!canGoPrevious}
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

export { WalletPagination };
