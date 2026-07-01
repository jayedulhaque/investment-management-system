import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  closedCampaignsUrl,
  emptyCampaignListQuery,
  equityPerShare,
  type CampaignListQuery,
  type CampaignSummary,
  type PagedCampaigns,
} from '../lib/investorCampaigns';

export function ClosedCampaignsSection({
  refreshKey,
  onViewCompanyDetails,
}: {
  refreshKey?: number;
  onViewCompanyDetails: (campaign: CampaignSummary) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState<CampaignListQuery>(emptyCampaignListQuery);
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({ ...prev, page: 1, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedCampaigns>(closedCampaignsUrl(query))
      .then((data) => {
        setItems(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      })
      .catch(() => {
        setItems([]);
        setTotalCount(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [query, refreshKey]);

  return (
    <View className="mb-4">
      <Text className="mb-2 font-semibold">Closed campaigns ({totalCount})</Text>
      <Text className="mb-2 text-sm text-slate-600">Fully booked campaigns are no longer open for new bookings.</Text>
      <TextInput
        className="mb-2 rounded border border-slate-300 bg-white p-2.5"
        placeholder="Search company, industry, city…"
        value={searchInput}
        onChangeText={setSearchInput}
      />
      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}
      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">No closed campaigns.</Text>
      ) : (
        items.map((campaign) => (
          <View key={campaign.id} className="mb-2 rounded border border-slate-200 bg-slate-50 p-3">
            <View className="mb-1 flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-medium">{campaign.company?.companyName ?? campaign.companyName}</Text>
              <Text className="text-xs font-medium text-slate-600">Closed</Text>
            </View>
            <Text className="text-sm text-slate-600">
              {campaign.equityPercentageOffered}% · all {campaign.totalShares} units booked
            </Text>
            <Text className="text-sm text-slate-600">
              {campaign.pricePerShare} BDT/share · {equityPerShare(campaign).toFixed(4)}% company/share
            </Text>
            <Pressable
              className="mt-2 self-start rounded border border-slate-300 px-3 py-2"
              onPress={() => onViewCompanyDetails(campaign)}
            >
              <Text className="text-sm">View details</Text>
            </Pressable>
          </View>
        ))
      )}
      {totalCount > 0 && (
        <View className="mt-2 flex-row items-center justify-between">
          <Pressable
            disabled={query.page <= 1 || loading}
            className="rounded border border-slate-300 px-3 py-2"
            onPress={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            <Text className={query.page <= 1 || loading ? 'text-slate-400' : 'text-slate-700'}>Previous</Text>
          </Pressable>
          <Text className="text-sm text-slate-600">
            Page {query.page} of {totalPages || 1}
          </Text>
          <Pressable
            disabled={query.page >= totalPages || loading}
            className="rounded border border-slate-300 px-3 py-2"
            onPress={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            <Text className={query.page >= totalPages || loading ? 'text-slate-400' : 'text-slate-700'}>Next</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
