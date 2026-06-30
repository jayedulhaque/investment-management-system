export type BookingSummary = {
  id: string;
  campaignId: string;
  companyName: string;
  reservedShares: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type BookingDetail = {
  id: string;
  campaignId: string;
  companyId: string;
  companyName: string;
  companyIndustry?: string | null;
  companyCity?: string | null;
  companyCountry?: string | null;
  reservedShares: number;
  totalPrice: number;
  pricePerShare: number;
  equityPercentageOffered: number;
  campaignTotalShares: number;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PagedBookings = {
  items: BookingSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type BookingListQuery = {
  active: boolean;
  page: number;
  pageSize: number;
};

export const defaultBookingListQuery = (active: boolean): BookingListQuery => ({
  active,
  page: 1,
  pageSize: 5,
});

export function investorBookingsUrl(query: BookingListQuery) {
  const params = new URLSearchParams({
    active: String(query.active),
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  return `/api/bookings/mine?${params.toString()}`;
}

export function formatBookingDate(value: string) {
  return new Date(value).toLocaleString();
}

export function equityPerShare(detail: Pick<BookingDetail, 'equityPercentageOffered' | 'campaignTotalShares'>) {
  return detail.campaignTotalShares > 0
    ? detail.equityPercentageOffered / detail.campaignTotalShares
    : 0;
}
