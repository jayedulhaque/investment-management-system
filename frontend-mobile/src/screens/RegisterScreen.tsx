import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { registerInvestor, registerCompany } = useAuthStore();
  const [role, setRole] = useState<'Investor' | 'Company'>('Investor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [documentationUrl, setDocumentationUrl] = useState('https://example.com/docs.pdf');

  const onRegister = async () => {
    if (role === 'Investor') await registerInvestor(email, password);
    else await registerCompany(email, password, documentationUrl);
    navigation.replace(role === 'Investor' ? 'Investor' : 'Company');
  };

  return (
    <View className="flex-1 p-6 bg-slate-100">
      <Text className="text-2xl font-bold mb-4">Register</Text>
      <View className="flex-row gap-2 mb-4">
        {(['Investor', 'Company'] as const).map((r) => (
          <Pressable key={r} className={`flex-1 py-2 rounded ${role === r ? 'bg-indigo-600' : 'bg-slate-300'}`} onPress={() => setRole(r)}>
            <Text className={`text-center ${role === r ? 'text-white' : ''}`}>{r}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput className="bg-white border rounded p-3 mb-2" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput className="bg-white border rounded p-3 mb-2" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {role === 'Company' && (
        <TextInput className="bg-white border rounded p-3 mb-2" placeholder="Documentation URL" value={documentationUrl} onChangeText={setDocumentationUrl} />
      )}
      <Pressable className="bg-indigo-600 rounded py-3 mt-2" onPress={onRegister}>
        <Text className="text-white text-center">Register</Text>
      </Pressable>
    </View>
  );
}
