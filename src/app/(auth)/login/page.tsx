import React from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageTemplate } from "@/components/AuthPageTemplate";

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
    <AuthPageTemplate
      eyebrow="Log In"
      title="Welcome back"
      description="Log in to your Cashly account and continue managing your finances with ease."
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthPageTemplate>
  );
};

export default LoginPage;
