import React from "react";
import { AuthForm } from "@/components/AuthForm";

const SignUpPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <AuthForm mode="signup" />
    </main>
  );
};

export default SignUpPage;
