import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pb-24 pt-16 sm:pb-32 sm:pt-24"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 -top-40 -z-10 flex justify-center"
      >
        <div className="h-[320px] w-[80%] max-w-4xl rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 md:px-6">
        <div className="max-w-3xl space-y-8 text-center">
          <Badge
            variant="secondary"
            className="border border-primary/20 bg-primary/10 text-primary"
          >
            Cashly Beta
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Feel connected to your money and grow with intention.
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Cashly brings your accounts, budgets, and recurring bills together
            in one mindful workspace. Helps you spend with intention and grow
            toward your goals.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/signup">
                Start for free
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Link href="/login">View live demo</Link>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:justify-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              Bank-grade encryption.
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              Privacy-first design.
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className="size-4 text-primary"
                aria-hidden="true"
              />
              Trusted by financial coaches worldwide
            </div>
          </div>
        </div>

        <div className="relative mt-20 w-full max-w-5xl">
          <Image
            src="/dashboard.png"
            alt="Cashly dashboard preview"
            width={1920}
            height={1080}
            priority
            className="h-auto w-full rounded-[32px] border border-white/10 object-cover shadow-[0_45px_120px_rgba(15,23,42,0.45)]"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
