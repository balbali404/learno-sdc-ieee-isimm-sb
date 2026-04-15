'use client';

import { MessagesCenter } from '@/components/dashboard/shared/MessagesCenter';

export function MessagesContent() {
  return (
    <MessagesCenter
      title="Messages"
      subtitle="Communicate with guardians linked to your classes"
      expectedPeerRole="GUARDIAN"
    />
  );
}
