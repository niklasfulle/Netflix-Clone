import { RegisterForm } from "@/components/auth/register-form";
import React from "react";

const RegisterPage = () => {
  return (
    <>
      <header>
        <title>Netflix - Create an Account</title>
        <meta
          property="og:title"
          content="Netflix - Create an Account"
          key="title"
        />
        <meta name="description" content="Netflix"></meta>
      </header>
      <div>
        <RegisterForm />
      </div>
    </>
  );
};

export default RegisterPage;
