/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_HUB_URL?: string;
  readonly VITE_IS_TESTING?: string;
  readonly REACT_APP_IS_TESTING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
