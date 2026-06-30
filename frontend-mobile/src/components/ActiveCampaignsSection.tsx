import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  activeCampaignsUrl,
  emptyCampaignListQuery,
  equityPerShare,
  type CampaignListQuery,
  type CampaignSummary,
  type PagedCampaigns,
} from '../lib/investorCampaigns';

export function ActiveCampaignsSection({
  refreshKey,
  onBookShares,
  onViewCompanyDetails,
}: {
  refreshKey?: number;
  onBookShares: (campaign: CampaignSummary) => void;
  onViewCompanyDetails: (campaign: CampaignSummary) => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [query, setQuery] = useState<CampaignListQuery>(emptyCampaignListQuery);
  const [items, setItems] = useState<CampaignSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery((prev) => ({
        ...prev,
        page: 1,
        search: searchInput,
        industry: industryInput,
        city: cityInput,
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, industryInput, cityInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedCampaigns>(activeCampaignsUrl(query))
      .then((data) => {
        setItems(data.items);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
        if (data.totalPages > 0 && query.page > data.totalPages) {
          setQuery((prev) => ({ ...prev, page: data.totalPages }));
        }
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
      <Text className="mb-2 font-semibold">Active campaigns ({totalCount})</Text>

      <TextInput
        className="mb-2 rounded border border-slate-300 bg-white p-2.5"
        placeholder="Search company, industry, city…"
        value={searchInput}
        onChangeText={setSearchInput}
      />
      <View className="mb-2 flex-row gap-2">
        <TextInput
          className="flex-1 rounded border border-slate-300 bg-white p-2.5"
          placeholder="Industry"
          value={industryInput}
          onChangeText={setIndustryInput}
        />
        <TextInput
          className="flex-1 rounded border border-slate-300 bg-white p-2.5"
          placeholder="City"
          value={cityInput}
          onChangeText={setCityInput}
        />
      </View>

      {loading && <Text className="mb-2 text-sm text-slate-500">Loading…</Text>}

      {!loading && items.length === 0 ? (
        <Text className="text-sm text-slate-600">No active campaigns match your filters.</Text>
      ) : (
        items.map((campaign) => (
          <View key={campaign.id} className="mb-2 rounded border bg-white p-3">
            <Text className="font-medium">{campaign.company?.companyName ?? campaign.companyName}</Text>
            {campaign.company?.industry ? (
              <Text className="text-xs text-slate-500">{campaign.company.industry}</Text>
            ) : null}
            <Text>
              {campaign.equityPercentageOffered}% of company · {campaign.availableShares}/{campaign.totalShares}{' '}
              units
            </Text>
            <Text className="text-sm text-slate-600">
              {campaign.pricePerShare} BDT/share · {equityPerShare(campaign).toFixed(4)}% company/share
            </Text>
            <View className="mt-2 flex-row gap-2">
              <Pressable
                className="rounded border border-slate-300 px-3 py-2"
                onPress={() => onViewCompanyDetails(campaign)}
              >
                <Text className="text-sm">View details</Text>
              </Pressable>
              <Pressable className="rounded bg-indigo-600 px-3 py-2" onPress={() => onBookShares(campaign)}>
                <Text className="text-sm text-white">Book shares</Text>
              </Pressable>
            </View>
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
