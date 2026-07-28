import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kebab.app',
  appName: 'Kebab Order',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
