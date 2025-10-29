import {
  Gauge,
  Layers,
  Lock,
  PiggyBank,
  PlugZap,
  Workflow,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";

const featureHighlights = [
  {
    title: "All money in one place",
    description:
      "Connect bank accounts, credit cards, and wallets to monitor cash flow in real-time without switching tabs.",
    icon: PlugZap,
  },
  {
    title: "Budgets that adapt",
    description:
      "Create flexible envelopes, track actuals, and let Cashly nudge you before overspend happens.",
    icon: Gauge,
  },
  {
    title: "Forecast every goal",
    description:
      "Plan savings milestones and see exactly when you can fund travel, debt payoff, or that dream project.",
    icon: PiggyBank,
  },
  {
    title: "Collaboration built-in",
    description:
      "Invite partners or coaches, share tailored views, and keep everyone aligned on spending rules.",
    icon: Workflow,
  },
  {
    title: "Automated workflows",
    description:
      "Create rules that auto-categorize transactions, schedule bill reminders, and export reports instantly.",
    icon: Layers,
  },
  {
    title: "Enterprise-grade security",
    description:
      "Protected with bank-level encryption, role-based permissions, and SOC 2 compliant infrastructure.",
    icon: Lock,
  },
];

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="relative overflow-hidden border-t border-border/70 py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-x-0 -top-52 flex justify-center">
          <div className="h-[320px] w-[80%] max-w-4xl rounded-full bg-primary/15 blur-3xl" />
        </div>
        <div className="absolute -left-24 top-1/3 h-[260px] w-[260px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute -right-24 bottom-0 h-[280px] w-[280px] rounded-full bg-primary/5 blur-[160px]" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-4 md:px-6">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Badge
            variant="secondary"
            className="mx-auto border border-primary/20 bg-primary/10 text-primary"
          >
            Why teams choose Cashly
          </Badge>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Features built for effortless financial planning.
          </h2>
          <p className="text-lg text-muted-foreground">
            From freelancers to finance leads, Cashly replaces messy
            spreadsheets with automated workflows, delightful insights, and a
            single source of truth for decisions.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featureHighlights.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-background/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <span className="mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
