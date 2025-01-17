import { NewVerificationForm } from "@/components/auth/new-verification-form";

const NewVerificationPage = () => {
  return (
    <>
      <header>
        <title>Netflix - New Verification</title>
        <meta
          property="og:title"
          content="Netflix - New Verification"
          key="title"
        />
        <meta name="description" content="Netflix"></meta>
      </header>
      <NewVerificationForm />
    </>
  );
};

export default NewVerificationPage;
