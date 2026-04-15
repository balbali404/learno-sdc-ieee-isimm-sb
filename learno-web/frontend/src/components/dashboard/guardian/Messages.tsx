'use client';

import { MessagesCenter } from '@/components/dashboard/shared/MessagesCenter';

export function Messages() {
  return (
    <MessagesCenter
      title="Messages"
      subtitle="Communicate with your children's teachers"
      expectedPeerRole="TEACHER"
    />
  );
}
