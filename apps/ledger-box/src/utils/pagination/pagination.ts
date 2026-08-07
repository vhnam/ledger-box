type PageItem = number | 'ellipsis';

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];

  if (currentPage > 3) {
    items.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page++) {
    items.push(page);
  }

  if (currentPage < totalPages - 2) {
    items.push('ellipsis');
  }

  items.push(totalPages);

  return items;
}

export { getPageItems };
export type { PageItem };
