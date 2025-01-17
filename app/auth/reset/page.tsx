import { ResetForm } from "@/components/auth/reset-form";
import Footer from "@/components/Footer";
import React from "react";

const ResetPage = () => {
  return (
    <>
      <header>
        <title>Netflix - Reset</title>
        <meta property="og:title" content="Netflix - Reset" key="title" />
        <meta name="description" content="Netflix"></meta>
      </header>
      <ResetForm />
      <Footer />
    </>
  );
};

export default ResetPage;
