import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onLogin = async () => {
    try {
      await login(email, password);
      const role = useAuthStore.getState().user?.role;
      if (role === 'Admin') navigation.replace('Admin');
      else if (role === 'Company') navigation.replace('Company');
      else navigation.replace('Investor');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-slate-100">
      <Text className="text-2xl font-bold mb-4">Login</Text>
      <TextInput className="bg-white border rounded p-3 mb-2" placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput className="bg-white border rounded p-3 mb-2" placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error && <Text className="text-red-600 mb-2">{error}</Text>}
      <Pressable className="bg-indigo-600 rounded py-3" onPress={onLogin}>
        <Text className="text-white text-center font-medium">Sign in</Text>
      </Pressable>
      <Pressable className="mt-4" onPress={() => navigation.navigate('Register')}>
        <Text className="text-indigo-600 text-center">Register</Text>
      </Pressable>
    </View>
  );
}
