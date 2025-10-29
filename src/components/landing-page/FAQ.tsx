import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "Can I really connect all of my bank and credit accounts?",
    answer:
      "Yes. Cashly connects to thousands of financial institutions with secure aggregators. Most users link their core accounts in under five minutes using read-only access.",
  },
  {
    question: "What happens after the 14-day trial?",
    answer:
      "You’ll pick a plan that fits your workflow. If you do nothing you’ll stay on the Starter tier, which keeps basic budgeting and manual imports free forever.",
  },
  {
    question: "How do automations work?",
    answer:
      "Set simple rules based on merchant, amount, or account. We’ll categorize transactions, trigger alerts, or schedule transfers without you lifting a finger.",
  },
  {
    question: "Will my data stay private?",
    answer:
      "Absolutely. Cashly uses bank-grade encryption, SOC 2 compliant infrastructure, and we never store your credentials. You can revoke access anytime.",
  },
  {
    question: "Can my partner or accountant join the workspace?",
    answer:
      "Invite as many collaborators as your plan allows. Share tailored views, assign tasks, and audit who changed what with a full activity log.",
  },
  {
    question: "Do you offer onboarding help?",
    answer:
      "Pro and Scale plans include guided onboarding sessions. Starter users get step-by-step templates plus access to our community office hours.",
  },
];

const FAQSection = () => {
  return (
    <section
      id="faq"
      className="relative overflow-hidden border-t border-border/70 py-24"
      aria-labelledby="faq-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-x-0 -top-48 flex justify-center">
          <div className="h-[320px] w-[80%] max-w-4xl rounded-full bg-primary/12 blur-[170px]" />
        </div>
        <div className="absolute -left-28 top-1/2 h-[250px] w-[250px] rounded-full bg-primary/8 blur-[140px]" />
        <div className="absolute -right-20 bottom-4 h-[240px] w-[240px] rounded-full bg-primary/6 blur-[150px]" />
      </div>

      <div className="mx-auto flex max-w-5xl flex-col gap-12 px-4 md:px-6">
        <div className="space-y-4 text-center">
          <Badge
            variant="secondary"
            className="border border-primary/20 bg-primary/10 text-primary"
          >
            FAQ
          </Badge>
          <h2
            id="faq-heading"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Answers to common questions.
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about getting started, staying secure,
            and collaborating inside Cashly.
          </p>
        </div>

        <div className="grid gap-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-border/80 bg-background/95 px-6 py-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-left text-base font-medium text-foreground">
                <span>{faq.question}</span>
                <span className="ml-auto inline-flex size-6 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm text-primary transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
