import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';

export type CompanyPublic = {
  companyProfileId: string;
  companyName: string;
  legalName?: string | null;
  description: string;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  city?: string | null;
  country?: string | null;
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

export function CompanyDetailsModal({
  company,
  visible,
  onClose,
}: {
  company: CompanyPublic | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!company) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[90%] rounded-t-2xl bg-white">
          <View className="flex-row items-start justify-between border-b border-slate-200 p-4">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-semibold">{company.companyName}</Text>
              {company.industry ? <Text className="text-sm text-slate-500">{company.industry}</Text> : null}
            </View>
            <Pressable onPress={onClose}>
              <Text className="text-slate-600">Close</Text>
            </Pressable>
          </View>
          <ScrollView className="px-4 py-2" style={{ maxHeight: 480 }}>
            <DetailRow label="Legal name" value={displayValue(company.legalName)} />
            <DetailRow label="Description" value={displayValue(company.description)} />
            <DetailRow label="Industry" value={displayValue(company.industry)} />
            <DetailRow label="Phone" value={displayValue(company.phone)} />
            <DetailRow label="Contact email" value={displayValue(company.contactEmail)} />
            <DetailRow label="Website" value={displayValue(company.website)} />
            {company.website?.trim() ? (
              <Pressable onPress={() => Linking.openURL(company.website!)} className="mb-3">
                <Text className="text-sm text-indigo-600">Open website</Text>
              </Pressable>
            ) : null}
            <DetailRow label="City" value={displayValue(company.city)} />
            <DetailRow label="Country" value={displayValue(company.country)} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
