import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section
      className="relative overflow-hidden border-t border-border/70 py-24"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-x-0 -top-44 flex justify-center">
          <div className="h-[300px] w-[76%] max-w-4xl rounded-full bg-primary/15 blur-[160px]" />
        </div>
        <div className="absolute -left-24 top-1/2 h-[240px] w-[240px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute -right-24 bottom-6 h-[260px] w-[260px] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center md:px-6">
        <div className="space-y-4">
          <h2
            id="cta-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Ready to be more productive?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cashly keeps your finances organized so you can focus on the work
            that matters. Launch your workspace and start planning with clarity
            in minutes.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/signup">Start for free</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/contact">Talk to sales</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
