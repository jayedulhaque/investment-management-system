import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CompanyListSection } from '../components/CompanyListSection';
import { apiFetch } from '../lib/api';
import type { CompanyReview } from '../lib/adminCompanyList';
import { useAuthStore } from '../store/authStore';

type Investor = {
  userId: string;
  email: string;
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

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : 'Not provided';
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3 border-b border-slate-100 pb-3">
      <Text className="text-xs font-semibold uppercase text-slate-500">{label}</Text>
      <Text className="mt-1 text-sm text-slate-800">{value}</Text>
    </View>
  );
}

function CompanyDetailContent({ company }: { company: CompanyReview }) {
  return (
    <View>
      <Text className="mb-2 text-xs font-semibold uppercase text-slate-500">Account</Text>
      <DetailRow label="Login email" value={displayValue(company.email)} />
      {company.approvalStatus ? <DetailRow label="Status" value={company.approvalStatus} /> : null}

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Company identity</Text>
      <DetailRow label="Company name" value={displayValue(company.companyName)} />
      <DetailRow label="Legal name" value={displayValue(company.legalName)} />
      <DetailRow label="Registration number" value={displayValue(company.registrationNumber)} />
      <DetailRow label="Industry" value={displayValue(company.industry)} />
      <DetailRow label="Description" value={displayValue(company.description)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Contact & location</Text>
      <DetailRow label="Phone" value={displayValue(company.phone)} />
      <DetailRow label="Contact email" value={displayValue(company.contactEmail)} />
      <DetailRow label="Website" value={displayValue(company.website)} />
      <DetailRow label="Address" value={displayValue(company.address)} />
      <DetailRow label="City" value={displayValue(company.city)} />
      <DetailRow label="Country" value={displayValue(company.country)} />

      <Text className="mb-2 mt-2 text-xs font-semibold uppercase text-slate-500">Documents</Text>
      <View className="mb-3">
        <Text className="text-xs font-semibold uppercase text-slate-500">Documentation URL</Text>
        <Pressable onPress={() => Linking.openURL(company.documentationUrl)}>
          <Text className="mt-1 text-sm text-indigo-600">{company.documentationUrl}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CompanyModal({
  company,
  loading,
  mode,
  visible,
  onClose,
  onApprove,
  onReject,
  onDelete,
}: {
  company: CompanyReview | null;
  loading: boolean;
  mode: 'pending' | 'approved' | 'rejected';
  visible: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete?: () => void;
}) {
  if (!company) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[90%] rounded-t-2xl bg-white">
          <View className="flex-row items-start justify-between border-b border-slate-200 p-4">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold">{company.companyName || company.email}</Text>
              <Text className="text-sm text-slate-500">
                {mode === 'pending' ? 'Pending approval' : company.approvalStatus}
              </Text>
            </View>
            <Pressable onPress={onClose}>
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
          <ScrollView className="px-4 py-2" style={{ maxHeight: 480 }}>
            {loading ? (
              <Text className="py-8 text-center text-sm text-slate-600">Loading company details…</Text>
            ) : (
              <CompanyDetailContent company={company} />
            )}
          </ScrollView>
          {mode === 'pending' && !loading && (
            <View className="flex-row gap-3 border-t border-slate-200 p-4">
              <Pressable onPress={onApprove} className="flex-1 rounded bg-green-600 py-3">
                <Text className="text-center font-medium text-white">Approve</Text>
              </Pressable>
              <Pressable onPress={onReject} className="flex-1 rounded bg-red-600 py-3">
                <Text className="text-center font-medium text-white">Reject</Text>
              </Pressable>
            </View>
          )}
          {mode === 'approved' && !loading && (
            <View className="border-t border-slate-200 p-4">
              <Pressable onPress={onReject} className="rounded bg-red-600 py-3">
                <Text className="text-center font-medium text-white">Reject</Text>
              </Pressable>
            </View>
          )}
          {mode === 'rejected' && !loading && (
            <View className="border-t border-slate-200 p-4">
              <Pressable onPress={onDelete} className="rounded bg-red-600 py-3">
                <Text className="text-center font-medium text-white">Delete permanently</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function AdminScreen() {
  const logout = useAuthStore((s) => s.logout);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [modalCompany, setModalCompany] = useState<CompanyReview | null>(null);
  const [modalMode, setModalMode] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [loadingCompanyDetail, setLoadingCompanyDetail] = useState(false);

  const refreshCompanyLists = () => setListRefreshKey((key) => key + 1);

  const loadInvestors = useCallback(async () => {
    const investorList = await apiFetch<Investor[]>('/api/admin/investors');
    setInvestors(investorList);
  }, []);

  useEffect(() => {
    loadInvestors().catch(() => undefined);
  }, [loadInvestors]);

  const openCompanyModal = (company: CompanyReview, mode: 'pending' | 'approved' | 'rejected') => {
    setModalMode(mode);
    setModalCompany(company);
    setLoadingCompanyDetail(true);
    apiFetch<CompanyReview>(`/api/admin/companies/${company.companyProfileId}`)
      .then((detail) => setModalCompany(detail))
      .catch(() => undefined)
      .finally(() => setLoadingCompanyDetail(false));
  };

  const approve = async (id: string, ok: boolean) => {
    await apiFetch(`/api/admin/companies/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approve: ok }),
    });
    setModalCompany(null);
    refreshCompanyLists();
  };

  const confirmRejectApproved = (id: string, companyName: string) => {
    const label = companyName || 'this company';
    Alert.alert(
      'Reject company',
      `Reject ${label}? The company will lose access and move to the rejected list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            apiFetch(`/api/admin/companies/${id}/reject`, { method: 'POST' })
              .then(() => {
                setModalCompany(null);
                refreshCompanyLists();
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  const confirmDeleteRejected = (id: string, companyName: string) => {
    const label = companyName || 'this company';
    Alert.alert(
      'Delete company',
      `Delete ${label}? This permanently removes the company registration and account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            apiFetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
              .then(() => {
                setModalCompany(null);
                refreshCompanyLists();
              })
              .catch(() => undefined);
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-4">
      <View className="flex-row justify-between mb-4">
        <Text className="text-xl font-bold">Admin</Text>
        <Pressable onPress={logout}>
          <Text className="text-red-600">Logout</Text>
        </Pressable>
      </View>

      <CompanyListSection
        title="Pending companies"
        apiPath="/api/admin/companies/pending"
        mode="pending"
        emptyMessage="No companies awaiting approval."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'pending')}
      />

      <CompanyListSection
        title="Approved companies"
        apiPath="/api/admin/companies/approved"
        mode="approved"
        emptyMessage="No approved companies yet."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'approved')}
        renderActions={(c) => (
          <Pressable
            className="justify-center rounded border border-red-200 bg-white px-4"
            onPress={() => confirmRejectApproved(c.companyProfileId, c.companyName)}
          >
            <Text className="text-sm text-red-700">Reject</Text>
          </Pressable>
        )}
      />

      <CompanyListSection
        title="Rejected companies"
        apiPath="/api/admin/companies/rejected"
        mode="rejected"
        emptyMessage="No rejected companies."
        refreshKey={listRefreshKey}
        onOpenCompany={(c) => openCompanyModal(c, 'rejected')}
        renderActions={(c) => (
          <Pressable
            className="justify-center rounded border border-red-200 bg-white px-4"
            onPress={() => confirmDeleteRejected(c.companyProfileId, c.companyName)}
          >
            <Text className="text-sm text-red-700">Delete</Text>
          </Pressable>
        )}
      />

      <CompanyModal
        company={modalCompany}
        loading={loadingCompanyDetail}
        mode={modalMode}
        visible={modalCompany !== null}
        onClose={() => setModalCompany(null)}
        onApprove={() =>
          modalCompany && modalMode === 'pending'
            ? approve(modalCompany.companyProfileId, true).catch(() => undefined)
            : undefined
        }
        onReject={() =>
          modalCompany && modalMode === 'pending'
            ? approve(modalCompany.companyProfileId, false).catch(() => undefined)
            : modalCompany && modalMode === 'approved'
              ? confirmRejectApproved(modalCompany.companyProfileId, modalCompany.companyName)
              : undefined
        }
        onDelete={
          modalCompany && modalMode === 'rejected'
            ? () => confirmDeleteRejected(modalCompany.companyProfileId, modalCompany.companyName)
            : undefined
        }
      />

      <Text className="mb-2 mt-4 text-lg font-semibold">Investors ({investors.length})</Text>
      {investors.length === 0 ? (
        <Text className="text-sm text-slate-600">No investors registered yet.</Text>
      ) : (
        investors.map((i) => (
          <View key={i.userId} className="mb-2 rounded bg-white p-3">
            <Text className="font-medium">{i.fullName || i.email}</Text>
            <Text className="text-xs text-slate-600">{i.email}</Text>
            {i.phone ? <Text className="text-xs text-slate-500">Phone: {i.phone}</Text> : null}
            {i.city && i.country ? (
              <Text className="text-xs text-slate-500">
                {i.city}, {i.country}
              </Text>
            ) : null}
          </View>
        ))
      )}
    </ScrollView>
  );
}
