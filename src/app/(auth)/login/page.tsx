import React from "react";
import { AuthForm } from "@/components/AuthForm";

const LoginPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <AuthForm mode="login" />
    </main>
  );
};

export default LoginPage;
