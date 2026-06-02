export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';
export const hubUrl = import.meta.env.VITE_HUB_URL ?? `${apiBaseUrl}/hubs/investment`;

export const isTestingMode =
  import.meta.env.VITE_IS_TESTING === 'true' ||
  import.meta.env.REACT_APP_IS_TESTING === 'true';
