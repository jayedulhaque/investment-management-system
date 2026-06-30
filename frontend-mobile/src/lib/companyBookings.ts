export type CompanyBookingSummary = {
  id: string;
  campaignId: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
  investorEmail?: string;
  investorName?: string;
  investorPhone?: string;
  createdAt: string;
  updatedAt: string;
};

export type CompanyBookingDetail = {
  id: string;
  campaignId: string;
  reservedShares: number;
  totalPrice: number;
  pricePerShare: number;
  equityPercentageOffered: number;
  campaignTotalShares: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  investorId: string;
  investorEmail: string;
  investorFullName: string;
  investorPhone: string;
  investorNationalId: string;
  investorDateOfBirth?: string | null;
  investorOccupation?: string | null;
  investorAddress: string;
  investorCity: string;
  investorCountry: string;
  investorContactEmail?: string | null;
};

export type PagedCompanyBookings = {
  items: CompanyBookingSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CompanyBookingListQuery = {
  active: boolean;
  page: number;
  pageSize: number;
  search: string;
};

export const defaultCompanyBookingListQuery = (active: boolean): CompanyBookingListQuery => ({
  active,
  page: 1,
  pageSize: 5,
  search: '',
});

export function companyBookingsUrl(query: CompanyBookingListQuery) {
  const params = new URLSearchParams({
    active: String(query.active),
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  const search = query.search.trim();
  if (search) params.set('search', search);
  return `/api/bookings/company?${params.toString()}`;
}

export function investorHeading(booking: Pick<CompanyBookingSummary, 'investorName' | 'investorEmail'>) {
  return booking.investorName?.trim() || booking.investorEmail || 'Investor';
}

export function formatBookingDate(value: string) {
  return new Date(value).toLocaleString();
}

export function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}
