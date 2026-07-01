export type InvestorSummary = {
  userId: string;
  email: string;
  isActive: boolean;
  fullName: string;
  phone: string;
  nationalId: string;
  dateOfBirth?: string | null;
  occupation?: string | null;
  address: string;
  city: string;
  country: string;
  contactEmail?: string | null;
};

export type InvestorDetail = InvestorSummary & {
  totalBookings: number;
  activeBookings: number;
};

export type PagedInvestors = {
  items: InvestorSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type InvestorListQuery = {
  page: number;
  pageSize: number;
  search: string;
  city: string;
  active: 'all' | 'active' | 'inactive';
};

export const DEFAULT_INVESTOR_PAGE_SIZE = 10;

export const emptyInvestorListQuery = (): InvestorListQuery => ({
  page: 1,
  pageSize: DEFAULT_INVESTOR_PAGE_SIZE,
  search: '',
  city: '',
  active: 'all',
});

export function investorListUrl(query: InvestorListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.city.trim()) params.set('city', query.city.trim());
  if (query.active === 'active') params.set('active', 'true');
  if (query.active === 'inactive') params.set('active', 'false');
  return `/api/admin/investors?${params.toString()}`;
}
