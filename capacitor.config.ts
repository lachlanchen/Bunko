import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'art.lazying.bunko',
  appName: 'Bunko',
  webDir: 'dist',
  android: { backgroundColor: '#12111a' },
  ios: { backgroundColor: '#12111a', contentInset: 'always' },
}

export default config
