import type { CampaignSummary, CampaignListQuery, PagedCampaigns } from './investorCampaigns';
import type { CompanyReview } from './adminCompanyList';

export type { CampaignSummary, CampaignListQuery, PagedCampaigns };
export { emptyCampaignListQuery, DEFAULT_CAMPAIGN_PAGE_SIZE } from './investorCampaigns';

export type AdminCampaignBooking = {
  bookingId: string;
  investorUserId: string;
  investorEmail: string;
  investorFullName: string;
  investorPhone: string;
  investorNationalId?: string | null;
  investorCity?: string | null;
  investorCountry?: string | null;
  investorContactEmail?: string | null;
  reservedShares: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCampaignDetail = {
  campaign: CampaignSummary;
  company: CompanyReview;
  bookings: AdminCampaignBooking[];
  totalBookedShares: number;
};

function buildCampaignListParams(query: CampaignListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.industry.trim()) params.set('industry', query.industry.trim());
  if (query.city.trim()) params.set('city', query.city.trim());
  return params;
}

export function adminActiveCampaignsUrl(query: CampaignListQuery) {
  return `/api/admin/campaigns/active?${buildCampaignListParams(query).toString()}`;
}

export function adminClosedCampaignsUrl(query: CampaignListQuery) {
  return `/api/admin/campaigns/closed?${buildCampaignListParams(query).toString()}`;
}

export function adminCampaignDetailUrl(campaignId: string) {
  return `/api/admin/campaigns/${campaignId}`;
}
