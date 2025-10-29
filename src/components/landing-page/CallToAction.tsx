import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section
      className="relative overflow-hidden border-t border-border/70 py-24"
      aria-labelledby="cta-heading"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 text-center md:px-6">
        <Badge
          variant="secondary"
          className="border border-primary/20 bg-primary/10 text-primary"
        >
          Productivity unlocked
        </Badge>
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

        <p className="text-sm text-muted-foreground">
          No credit card required. Enjoy the full Pro feature set for 14 days.
        </p>
      </div>
    </section>
  );
};

export default CallToAction;
