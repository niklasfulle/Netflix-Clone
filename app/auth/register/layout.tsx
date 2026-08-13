import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Netflix - Register",
  description: "Create your Netflix Clone account.",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
