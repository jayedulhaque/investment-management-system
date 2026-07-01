import type { CompanyPublic } from '../components/CompanyDetailsModal';

export type CampaignSummary = {
  id: string;
  companyId: string;
  companyName: string;
  company?: CompanyPublic | null;
  availableShares: number;
  pricePerShare: number;
  minInvestmentThreshold: number;
  totalShares: number;
  equityPercentageOffered: number;
  paymentStatus?: string;
  isActive?: boolean;
  isClosed?: boolean;
};

export type PagedCampaigns = {
  items: CampaignSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type CampaignListQuery = {
  page: number;
  pageSize: number;
  search: string;
  industry: string;
  city: string;
};

export const DEFAULT_CAMPAIGN_PAGE_SIZE = 10;

export const emptyCampaignListQuery = (): CampaignListQuery => ({
  page: 1,
  pageSize: DEFAULT_CAMPAIGN_PAGE_SIZE,
  search: '',
  industry: '',
  city: '',
});

export function activeCampaignsUrl(query: CampaignListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.industry.trim()) params.set('industry', query.industry.trim());
  if (query.city.trim()) params.set('city', query.city.trim());
  return `/api/campaigns?${params.toString()}`;
}

export function closedCampaignsUrl(query: CampaignListQuery) {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.industry.trim()) params.set('industry', query.industry.trim());
  if (query.city.trim()) params.set('city', query.city.trim());
  return `/api/campaigns/closed?${params.toString()}`;
}

export function isCampaignClosed(campaign: Pick<CampaignSummary, 'paymentStatus' | 'isActive' | 'isClosed'>) {
  if (campaign.isClosed) return true;
  return campaign.paymentStatus === 'Paid' && campaign.isActive === false;
}

export function equityPerShare(campaign: Pick<CampaignSummary, 'equityPercentageOffered' | 'totalShares'>) {
  return campaign.totalShares > 0 ? campaign.equityPercentageOffered / campaign.totalShares : 0;
}
