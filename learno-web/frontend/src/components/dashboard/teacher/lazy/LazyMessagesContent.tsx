'use client';

import dynamic from 'next/dynamic';
import { LazyPageFallback } from './LazyPageFallback';

const MessagesContent = dynamic(
  () => import('../MessagesContent').then((module) => module.MessagesContent),
  {
    loading: () => <LazyPageFallback title="Messages" />,
  },
);

export function LazyMessagesContent() {
  return <MessagesContent />;
}
