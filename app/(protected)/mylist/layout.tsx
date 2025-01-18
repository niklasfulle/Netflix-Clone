import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Netflix - My List",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
