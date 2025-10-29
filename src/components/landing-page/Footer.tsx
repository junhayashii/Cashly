import Link from "next/link";
import { Sparkles } from "lucide-react";

const footerLinks = [
  {
    title: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Reviews", href: "#reviews" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Resources",
    items: [
      { label: "Guides", href: "/resources" },
      { label: "Blog", href: "/blog" },
      { label: "Community", href: "/community" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-border/70 bg-background py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 md:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="max-w-sm space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col leading-tight text-left">
                <span className="text-lg font-semibold text-foreground">
                  Cashly
                </span>
                <span className="text-xs text-muted-foreground">
                  Smart cashflow for every team.
                </span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Track every dollar, collaborate with ease, and turn financial data
              into confident decisions.
            </p>
          </div>

          <div className="grid flex-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {footerLinks.map(({ title, items }) => (
              <div key={title} className="space-y-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="transition hover:text-primary"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/60 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Cashly. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/security" className="hover:text-primary">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
