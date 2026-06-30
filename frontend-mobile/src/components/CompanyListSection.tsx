import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { apiFetch } from '../lib/api';
import {
  type CompanyListQuery,
  type CompanyReview,
  type PagedResponse,
  companyListUrl,
  emptyCompanyListQuery,
} from '../lib/adminCompanyList';

type CompanyListMode = 'pending' | 'approved' | 'rejected';

function statusClass(mode: CompanyListMode) {
  if (mode === 'approved') return 'text-green-700';
  if (mode === 'rejected') return 'text-red-700';
  return 'text-slate-600';
}

export function CompanyListSection({
  title,
  apiPath,
  mode,
  emptyMessage,
  refreshKey,
  onOpenCompany,
  renderActions,
}: {
  title: string;
  apiPath: string;
  mode: CompanyListMode;
  emptyMessage: string;
  refreshKey: number;
  onOpenCompany: (company: CompanyReview) => void;
  renderActions?: (company: CompanyReview) => ReactNode;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [query, setQuery] = useState<CompanyListQuery>(emptyCompanyListQuery);
  const [items, setItems] = useState<CompanyReview[]>([]);
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
      }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, industryInput]);

  useEffect(() => {
    setLoading(true);
    apiFetch<PagedResponse<CompanyReview>>(companyListUrl(apiPath, query))
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
  }, [apiPath, query, refreshKey]);

  const rangeStart = totalCount === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const rangeEnd = Math.min(query.page * query.pageSize, totalCount);

  return (
    <View className="mb-4">
      <Text className="mb-2 text-lg font-semibold">
        {title} ({totalCount})
      </Text>

      <TextInput
        value={searchInput}
        onChangeText={setSearchInput}
        placeholder="Search name, email, city…"
        className="mb-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <TextInput
        value={industryInput}
        onChangeText={setIndustryInput}
        placeholder="Filter by industry"
        className="mb-2 rounded border border-slate-300 bg-white px-3 py-2 text-sm"
      />

      <View className="mb-2 flex-row gap-2">
        {[5, 10, 20].map((size) => (
          <Pressable
            key={size}
            onPress={() => setQuery((prev) => ({ ...prev, page: 1, pageSize: size }))}
            className={`rounded border px-3 py-1 ${query.pageSize === size ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-white'}`}
          >
            <Text className="text-xs">{size}/page</Text>
          </Pressable>
        ))}
      </View>

      {loading ? <Text className="mb-2 text-sm text-slate-500">Loading…</Text> : null}

      {!loading && items.length === 0 ? (
        <Text className="mb-2 text-sm text-slate-600">{emptyMessage}</Text>
      ) : (
        items.map((c) => (
          <View key={c.companyProfileId} className={`mb-2 ${renderActions ? 'flex-row items-stretch gap-2' : ''}`}>
            <Pressable
              className={`rounded border border-slate-200 bg-white p-3 ${renderActions ? 'flex-1' : ''}`}
              onPress={() => onOpenCompany(c)}
            >
              <Text className="font-medium">{c.companyName}</Text>
              {mode !== 'pending' && c.approvalStatus ? (
                <Text className={`text-xs ${statusClass(mode)}`}>{c.approvalStatus}</Text>
              ) : null}
              <Text className="mt-1 text-xs text-slate-600">{c.email}</Text>
              {c.industry ? <Text className="text-xs text-slate-500">{c.industry}</Text> : null}
              <Text className="mt-1 text-xs text-indigo-600">Tap to view full details</Text>
            </Pressable>
            {renderActions?.(c)}
          </View>
        ))
      )}

      {totalCount > 0 ? (
        <View className="mt-2">
          <Text className="mb-2 text-xs text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {totalCount}
          </Text>
          <View className="flex-row items-center gap-3">
            <Pressable
              disabled={query.page <= 1 || loading}
              onPress={() => setQuery((prev) => ({ ...prev, page: prev.page - 1 }))}
              className="rounded border border-slate-300 px-3 py-1"
            >
              <Text className="text-sm">Previous</Text>
            </Pressable>
            <Text className="text-sm text-slate-600">
              Page {query.page} of {totalPages || 1}
            </Text>
            <Pressable
              disabled={query.page >= totalPages || loading}
              onPress={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              className="rounded border border-slate-300 px-3 py-1"
            >
              <Text className="text-sm">Next</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
