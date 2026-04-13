import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fyi.boomerang.app',
  appName: 'Boomerang',
  webDir: 'dist',
  server: {
    url: 'https://www.boomerang.fyi',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scrollEnabled: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
