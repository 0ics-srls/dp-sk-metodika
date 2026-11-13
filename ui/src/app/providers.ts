import { provideZonelessChangeDetection, type EnvironmentProviders, type Provider } from '@angular/core';
import { providePackagePrimeNG } from '@olx/package-ui-sdk';
import { provideMetodikaI18n } from './i18n/provide-metodika-i18n';

/**
 * Application-level providers of the package. No router (Screens render from `subPath`); `MetodikaTools` is provided by
 * each root because it needs the context that root connects.
 */
export const metodikaProviders: readonly (Provider | EnvironmentProviders)[] = [
  providePackagePrimeNG({ packageName: 'sk-metodika' }),
  provideMetodikaI18n(),
  provideZonelessChangeDetection(),
];
