import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Netflix - Changelog',
  description: 'Discover the latest Netflix Clone features, improvements, and fixes.',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
