import React from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageTemplate } from "@/components/AuthPageTemplate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const SignUpPage = async ({ searchParams }: PageProps) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const rawNext = params?.next;
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
