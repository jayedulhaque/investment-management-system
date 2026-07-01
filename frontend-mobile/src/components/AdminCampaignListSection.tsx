import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  adminActiveCampaignsUrl,
  adminClosedCampaignsUrl,
  emptyCampaignListQuery,
  type CampaignListQuery,
  type CampaignSummary,
  type PagedCampaigns,
} from '../lib/adminCampaigns';
import { equityPerShare } from '../lib/investorCampaigns';

type Mode = 'active' | 'closed';

const config: Record<
  Mode,
  { title: string; description: string; emptyMessage: string; badge: string }
> = {
  active: {
    title: 'Active campaigns',
    description: 'Paid campaigns currently open for investment.',
    emptyMessage: 'No active campaigns.',
    badge: 'Active',
  },
  closed: {
    title: 'Closed campaigns',
    description: 'Paid campaigns where all shares have been booked.',
    emptyMessage: 'No closed campaigns.',
    badge: 'Closed',
  },
};

export function AdminCampaignListSection({
  mode,
  refreshKey,
  onSelectCampaign,
}: {
  mode: Mode;
  refreshKey: number;
  onSelectCampaign: (campaign: CampaignSummary) => void;
}) {
  const { title, description, emptyMessage, badge } = config[mode];
  const listUrl = mode === 'active' ? adminActiveCampaignsUrl : adminClosedCampaignsUrl;

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
    apiFetch<PagedCampaigns>(listUrl(query))
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
  }, [query, refreshKey, mode]);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-lg font-semibold">
        {title} ({totalCount})
      </Text>
      <Text className="mb-2 text-sm text-slate-600">{description}</Text>
      <TextInput
        className="mb-2 rounded border border-slate-300 bg-white p-2.5"
        placeholder="Search company, industry, city…"
        value={searchInput}
        onChangeText={setSearchInput}
      />
      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}
      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">{emptyMessage}</Text>
      ) : (
        items.map((campaign) => (
          <Pressable
            key={campaign.id}
            className="mb-2 rounded border border-slate-200 bg-slate-50 p-3"
            onPress={() => onSelectCampaign(campaign)}
          >
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 font-medium">{campaign.company?.companyName ?? campaign.companyName}</Text>
              <Text className="text-xs text-slate-600">{badge}</Text>
            </View>
            <Text className="text-sm text-slate-600">
              {campaign.totalShares} shares · {campaign.equityPercentageOffered}% equity ·{' '}
              {equityPerShare(campaign).toFixed(4)}% per share
            </Text>
            <Text className="text-sm text-slate-600">
              {campaign.pricePerShare} BDT/share ·{' '}
              {mode === 'closed' ? 'fully booked' : `${campaign.availableShares} available`}
            </Text>
          </Pressable>
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
