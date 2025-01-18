import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Netflix - Playlists",
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default Layout;
