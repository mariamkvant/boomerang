import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'fyi.boomerang.app',
  appName: 'Boomerang',
  webDir: 'dist',
  backgroundColor: '#f8f7f5',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#f8f7f5',
    allowsLinkPreview: false,
    scrollEnabled: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
