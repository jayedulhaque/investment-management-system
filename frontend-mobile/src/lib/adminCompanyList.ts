export type CompanyReview = {
  companyProfileId: string;
  email: string;
  companyName: string;
  legalName?: string | null;
  registrationNumber?: string | null;
  description: string;
  website?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  industry?: string | null;
  documentationUrl: string;
  approvalStatus?: string;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CompanyListQuery = {
  page: number;
  pageSize: number;
  search: string;
  industry: string;
};

export const DEFAULT_COMPANY_PAGE_SIZE = 10;

export function companyListUrl(path: string, query: CompanyListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.industry.trim()) params.set('industry', query.industry.trim());
  return `${path}?${params.toString()}`;
}

export const emptyCompanyListQuery = (): CompanyListQuery => ({
  page: 1,
  pageSize: DEFAULT_COMPANY_PAGE_SIZE,
  search: '',
  industry: '',
});
