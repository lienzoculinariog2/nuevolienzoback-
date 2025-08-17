export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}
