import { commonStrings } from './i18n/common';
import { breathingStrings } from './i18n/breathing';
import { coldStrings } from './i18n/cold';
import { settingsStrings } from './i18n/settings';
import { progressStrings } from './i18n/progress';
import { programStrings } from './i18n/program';
import { onboardingStrings } from './i18n/onboarding';

export const strings = {
  ...commonStrings,
  ...breathingStrings,
  ...coldStrings,
  ...settingsStrings,
  ...progressStrings,
  ...programStrings,
  ...onboardingStrings,
} as const;
