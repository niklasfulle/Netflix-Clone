import { redirect } from 'next/navigation';

import { currentUser } from '@/lib/auth';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  if (!(await currentUser())) redirect('/auth/login');
  return <div>{children}</div>;
};

export default ProtectedLayout;
