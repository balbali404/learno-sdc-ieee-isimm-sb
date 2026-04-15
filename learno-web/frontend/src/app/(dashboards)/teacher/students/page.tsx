import { LazyStudentsContent } from '@/components/dashboard/teacher/lazy/LazyStudentsContent';

export const metadata = {
  title: 'Students – Learno Teacher',
};

export default function StudentsPage() {
  return <LazyStudentsContent />;
}
