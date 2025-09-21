export abstract class BaseService {
  protected buildPaginationAndSort<T>(options: {
    pageNum?: number;
    pageSize?: number;
    sortBy?: keyof T;
    sortOrder?: 'asc' | 'desc';
    defaultSortBy?: keyof T;
  }) {
    const { pageNum = 1, pageSize = 10, sortBy, sortOrder = 'desc', defaultSortBy } = options;

    const finalSortBy = sortBy || defaultSortBy;

    return {
      skip: (pageNum - 1) * pageSize,
      take: Number(pageSize),
      orderBy: finalSortBy ? { [finalSortBy as string]: sortOrder } : undefined,
    };
  }
}
