import React from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageTemplate } from "@/components/AuthPageTemplate";

type PageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

const SignUpPage = ({ searchParams }: PageProps) => {
  const rawNext = searchParams?.next;
  const nextPath =
    typeof rawNext === "string"
      ? rawNext
      : Array.isArray(rawNext)
      ? rawNext[0]
      : undefined;

  return (
    <AuthPageTemplate
      eyebrow="Sign Up"
      title="Create your account"
      description="Join Cashly and take control of your cash flow with our all-in-one financial management platform designed for modern teams."
    >
      <AuthForm mode="signup" nextPath={nextPath} />
    </AuthPageTemplate>
  );
};

export default SignUpPage;
