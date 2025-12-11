import React from "react";
import { AuthForm } from "@/components/AuthForm";
import { AuthPageTemplate } from "@/components/AuthPageTemplate";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const LoginPage = async ({ searchParams }: PageProps) => {
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
      eyebrow="Log In"
      title="Welcome back"
      description="Log in to your Cashly account and continue managing your finances with ease."
    >
      <AuthForm mode="login" nextPath={nextPath} />
    </AuthPageTemplate>
  );
};

export default LoginPage;
