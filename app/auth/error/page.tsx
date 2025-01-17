import { ErrorCard } from "@/components/auth/error-card";

const AuthErrorPage = () => {
  return (
    <>
      <header>
        <title>Netflix - Error</title>
        <meta property="og:title" content="Netflix - Error" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <ErrorCard />
    </>
  );
};

export default AuthErrorPage;
