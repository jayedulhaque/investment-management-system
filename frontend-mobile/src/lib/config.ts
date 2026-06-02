export const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';
export const hubUrl = process.env.EXPO_PUBLIC_HUB_URL ?? `${apiBaseUrl}/hubs/investment`;

export const isTestingMode = process.env.EXPO_PUBLIC_IS_TESTING === 'true';
