import Link from "next/link";
import { Check, Sparkles, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$0",
    cadence: "forever",
    description: "Perfect for trying Cashly solo with basic budgeting tools.",
    features: [
      "Connect 2 bank accounts",
      "Unlimited budgets & categories",
      "Automated bill reminders",
      "Export to CSV & PDF",
    ],
    cta: "Create free account",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "/mo",
    description:
      "Advanced forecasting, accountability, and collaboration for growing teams.",
    features: [
      "Unlimited account connections",
      "Shared workspaces & permissions",
      "Goal forecasting with scenarios",
      "Automated workflows & rules engine",
      "Priority chat & email support",
    ],
    cta: "Start 14-day trial",
    href: "/signup",
    highlight: "Most popular",
  },
  {
    name: "Scale",
    price: "Let’s chat",
    cadence: "",
    description:
      "Custom security, multi-entity reporting, and guided onboarding for finance leaders.",
    features: [
      "Dedicated success manager",
      "Custom data retention & exports",
      "Enterprise-grade controls (SSO, SCIM)",
      "Quarterly planning workshops",
      "Early access to beta features",
    ],
    cta: "Book a demo",
    href: "/contact",
  },
];

const PricingSection = () => {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-t border-border/70 py-24"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-4 md:px-6">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl space-y-4">
            <Badge
              variant="secondary"
              className="border border-primary/20 bg-primary/10 text-primary"
            >
              Pricing made simple
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Every plan includes live syncing, smart budgets, and secure
              automations.
            </h2>
            <p className="text-lg text-muted-foreground">
              Upgrade or downgrade at any time. We’ll send a reminder three days
              before your trial ends, no surprises.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="size-4" aria-hidden="true" />
            Eligible nonprofits save 30%
          </span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {plans.map(
            ({
              name,
              price,
              cadence,
              description,
              features,
              cta,
              href,
              highlight,
            }) => {
              const isHighlighted = Boolean(highlight);
              return (
                <div
                  key={name}
                  className={`relative flex h-full flex-col overflow-visible rounded-3xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${
                    isHighlighted
                      ? "border-primary/50 bg-gradient-to-br from-primary/15 via-background/95 to-background/90"
                      : "border-border/70 bg-background/95 hover:border-primary/30"
                  }`}
                >
                  {isHighlighted ? (
                    <span className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-lg">
                      <Star className="size-3.5" aria-hidden="true" />
                      {highlight}
                    </span>
                  ) : null}

                  <div className="space-y-4 pt-2">
                    <h3 className="text-2xl font-semibold text-foreground">
                      {name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-semibold text-foreground">
                        {price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {cadence}
                      </span>
                    </div>
                  </div>

                  <ul className="mt-8 space-y-3 text-sm">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    asChild
                    className={`mt-auto w-full sm:w-auto ${
                      isHighlighted ? "shadow-lg" : ""
                    }`}
                    variant={isHighlighted ? "default" : "outline"}
                  >
                    <Link href={href}>{cta}</Link>
                  </Button>
                </div>
              );
            }
          )}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
