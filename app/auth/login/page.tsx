import { LoginForm } from "@/components/auth/login-form";
import React from "react";

const LoginPage = () => {
  return (
    <>
      <header>
        <title>Netflix - Login</title>
        <meta property="og:title" content="Netflix - Login" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <div>
        <LoginForm />
      </div>
    </>
  );
};

export default LoginPage;
