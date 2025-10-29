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
            Own your cash flow with clarity.
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Cashly unifies your accounts, budgets, and recurring bills into one
            smart workspace so you can plan every dollar with confidence and hit
            your financial goals faster.
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
              Bank-grade encryption & 2FA
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden="true" />
              14-day free trial. Cancel anytime.
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

        <div className="relative mt-20 w-full max-w-6xl">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 flex justify-center"
          >
            <div className="h-72 w-[85%] max-w-5xl rounded-full bg-primary/20 blur-[140px]" />
          </div>

          <div className="relative overflow-hidden rounded-[42px] border border-border/80 bg-gradient-to-br from-background/95 via-background/80 to-primary/10 shadow-2xl backdrop-blur">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.32),_transparent_60%)]"
            />
            <div className="relative flex flex-col items-center gap-10 px-6 py-12 sm:px-10 md:px-16">
              <div className="relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-black/90 shadow-2xl ring-1 ring-white/10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/20"
                />
                <Image
                  src="/"
                  alt="Cashly dashboard preview"
                  width={1920}
                  height={1080}
                  priority
                  className="h-auto w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
