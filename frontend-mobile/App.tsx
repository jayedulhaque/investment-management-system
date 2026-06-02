import './global.css';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { RootStackParamList } from './src/navigation/types';
import { AdminScreen } from './src/screens/AdminScreen';
import { CompanyScreen } from './src/screens/CompanyScreen';
import { InvestorScreen } from './src/screens/InvestorScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { useAuthStore } from './src/store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const { hydrate, hydrated, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const initialRoute =
    user?.role === 'Admin' ? 'Admin' : user?.role === 'Company' ? 'Company' : user?.role === 'Investor' ? 'Investor' : 'Login';

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute as keyof RootStackParamList}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="Investor" component={InvestorScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Company" component={CompanyScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
