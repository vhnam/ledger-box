import { describe, expect, it } from 'vite-plus/test';

import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('returns an empty array for zero or negative total pages', () => {
    expect(getPageItems(1, 0)).toEqual([]);
    expect(getPageItems(1, -1)).toEqual([]);
  });

  it('lists every page when there are 7 or fewer', () => {
    expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('adds a leading ellipsis once the current page moves past 3', () => {
    expect(getPageItems(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
  });

  it('omits the leading ellipsis near the start', () => {
    expect(getPageItems(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
  });

  it('omits the trailing ellipsis near the end', () => {
    expect(getPageItems(9, 10)).toEqual([1, 'ellipsis', 8, 9, 10]);
  });
});
