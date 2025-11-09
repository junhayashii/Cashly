import React from "react";
import { AuthForm } from "@/components/AuthForm";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

const LoginPage = ({ searchParams }: PageProps) => {
  const rawNext = searchParams?.next;
  const nextPath =
    typeof rawNext === "string"
      ? rawNext
      : Array.isArray(rawNext)
      ? rawNext[0]
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <AuthForm mode="login" nextPath={nextPath} />
    </main>
  );
};

export default LoginPage;
