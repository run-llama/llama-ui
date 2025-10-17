declare interface ImportMetaEnv {
  readonly STORYBOOK_LLAMA_CLOUD_API_KEY?: string;
  readonly MODE: string;
  readonly DEV: boolean;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
