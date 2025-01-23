import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Netflix - Login",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
