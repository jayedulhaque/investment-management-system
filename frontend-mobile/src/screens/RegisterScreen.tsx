import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { emptyCompanyRegistration } from '../types/company';
import { emptyInvestorRegistration } from '../types/investor';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { registerInvestor, registerCompany } = useAuthStore();
  const [role, setRole] = useState<'Investor' | 'Company'>('Investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState(emptyCompanyRegistration);
  const [investor, setInvestor] = useState(emptyInvestorRegistration);
  const [error, setError] = useState<string | null>(null);

  const updateCompany = (field: keyof ReturnType<typeof emptyCompanyRegistration>, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
  };

  const updateInvestor = (field: keyof ReturnType<typeof emptyInvestorRegistration>, value: string) => {
    setInvestor((prev) => ({ ...prev, [field]: value }));
  };

  const onRegister = async () => {
    setError(null);
    try {
      if (role === 'Investor') {
        await registerInvestor(email, password, investor);
        navigation.replace('Investor');
        return;
      }
      const result = await registerCompany(email, password, company);
      navigation.replace('Login', { message: result.message });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-100 p-6" keyboardShouldPersistTaps="handled">
      <Text className="text-2xl font-bold mb-4">Register</Text>
      <View className="flex-row gap-2 mb-4">
        {(['Investor', 'Company'] as const).map((r) => (
          <Pressable key={r} className={`flex-1 py-2 rounded ${role === r ? 'bg-indigo-600' : 'bg-slate-300'}`} onPress={() => setRole(r)}>
            <Text className={`text-center ${role === r ? 'text-white' : ''}`}>{r}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-2 font-semibold text-slate-700">Account</Text>
      <TextInput
        className="bg-white border rounded p-3 mb-2"
        placeholder="Login email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        className="bg-white border rounded p-3 mb-4"
        placeholder="Password (min 8)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {role === 'Investor' && (
        <>
          <Text className="mb-2 font-semibold text-slate-700">Personal identity</Text>
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="Full name *"
            value={investor.fullName}
            onChangeText={(v) => updateInvestor('fullName', v)}
          />
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="National ID (NID) *"
            value={investor.nationalId}
            onChangeText={(v) => updateInvestor('nationalId', v)}
          />
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="Date of birth (YYYY-MM-DD, optional)"
            value={investor.dateOfBirth}
            onChangeText={(v) => updateInvestor('dateOfBirth', v)}
          />
          <TextInput
            className="mb-4 rounded border bg-white p-3"
            placeholder="Occupation (optional)"
            value={investor.occupation}
            onChangeText={(v) => updateInvestor('occupation', v)}
          />

          <Text className="mb-2 font-semibold text-slate-700">Contact & location</Text>
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="Phone *"
            value={investor.phone}
            onChangeText={(v) => updateInvestor('phone', v)}
            keyboardType="phone-pad"
          />
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="Contact email (optional)"
            value={investor.contactEmail}
            onChangeText={(v) => updateInvestor('contactEmail', v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="Address *"
            value={investor.address}
            onChangeText={(v) => updateInvestor('address', v)}
          />
          <TextInput
            className="mb-2 rounded border bg-white p-3"
            placeholder="City *"
            value={investor.city}
            onChangeText={(v) => updateInvestor('city', v)}
          />
          <TextInput
            className="mb-4 rounded border bg-white p-3"
            placeholder="Country *"
            value={investor.country}
            onChangeText={(v) => updateInvestor('country', v)}
          />
        </>
      )}

      {role === 'Company' && (
        <>
          <Text className="mb-2 font-semibold text-slate-700">Company identity</Text>
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Company name *"
            value={company.companyName}
            onChangeText={(v) => updateCompany('companyName', v)}
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Legal name (optional)"
            value={company.legalName}
            onChangeText={(v) => updateCompany('legalName', v)}
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Registration number (optional)"
            value={company.registrationNumber}
            onChangeText={(v) => updateCompany('registrationNumber', v)}
          />
          <TextInput
            className="bg-white border rounded p-3 mb-4"
            placeholder="Industry (optional)"
            value={company.industry}
            onChangeText={(v) => updateCompany('industry', v)}
          />

          <Text className="mb-2 font-semibold text-slate-700">Contact & location</Text>
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Phone (optional)"
            value={company.phone}
            onChangeText={(v) => updateCompany('phone', v)}
            keyboardType="phone-pad"
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Contact email (optional)"
            value={company.contactEmail}
            onChangeText={(v) => updateCompany('contactEmail', v)}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Website (optional)"
            value={company.website}
            onChangeText={(v) => updateCompany('website', v)}
            autoCapitalize="none"
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Address (optional)"
            value={company.address}
            onChangeText={(v) => updateCompany('address', v)}
          />
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="City (optional)"
            value={company.city}
            onChangeText={(v) => updateCompany('city', v)}
          />
          <TextInput
            className="bg-white border rounded p-3 mb-4"
            placeholder="Country (optional)"
            value={company.country}
            onChangeText={(v) => updateCompany('country', v)}
          />

          <Text className="mb-2 font-semibold text-slate-700">About & documents</Text>
          <TextInput
            className="bg-white border rounded p-3 mb-2"
            placeholder="Company description *"
            value={company.description}
            onChangeText={(v) => updateCompany('description', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <TextInput
            className="bg-white border rounded p-3 mb-4"
            placeholder="Documentation URL *"
            value={company.documentationUrl}
            onChangeText={(v) => updateCompany('documentationUrl', v)}
            autoCapitalize="none"
          />
        </>
      )}

      {error && <Text className="mb-2 text-sm text-red-600">{error}</Text>}
      <Pressable className="bg-indigo-600 rounded py-3 mt-2" onPress={onRegister}>
        <Text className="text-white text-center">Register</Text>
      </Pressable>
    </ScrollView>
  );
}
