import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Netflix - Verify email",
  description: "Verify the email address for your Netflix Clone account.",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
