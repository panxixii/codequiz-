/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REDEEM_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
