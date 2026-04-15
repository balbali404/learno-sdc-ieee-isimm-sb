'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const SettingsContent = dynamic(
  () => import('../SettingsContent').then((module) => module.SettingsContent),
  {
    loading: () => <LazyPageFallback title="Settings" />,
  },
);

export function LazySettingsContent() {
  return <SettingsContent />;
}
