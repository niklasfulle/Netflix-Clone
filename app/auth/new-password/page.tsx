import { NewPasswordForm } from "@/components/auth/new-password-form";
import React from "react";

const NewPasswordPage = () => {
  return (
    <>
      <header>
        <title>Netflix - New password</title>
        <meta
          property="og:title"
          content="Netflix - New password"
          key="title"
        />
        <meta name="description" content="Netflix"></meta>
      </header>
      <NewPasswordForm />
    </>
  );
};

export default NewPasswordPage;
