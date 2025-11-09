"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const navigationLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const NavBar = () => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:h-20 md:px-6 lg:max-w-6xl">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-tight"
        >
          <span className="grid size-12 shrink-0 place-items-center text-primary">
            <Image
              src="/logo.png"
              alt="Cashly logo"
              width={48}
              height={48}
              className="size-10"
              priority
            />
          </span>
          <div className="flex flex-col leading-tight">
            <span>Cashly</span>
            <span className="text-xs font-normal text-muted-foreground">
              Smarter money, every day.
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-10 text-sm md:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-all hover:text-foreground hover:underline hover:underline-offset-8"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="shadow-sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation menu"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex h-full flex-col gap-8 pt-14">
                <Link
                  href="/"
                  className="flex items-center gap-3 text-lg font-semibold"
                >
                  <span className="grid size-[60px] place-items-center text-primary">
                    <Image
                      src="/logo.png"
                      alt="Cashly logo"
                      width={52}
                      height={52}
                      className="size-12"
                    />
                  </span>
                  Cashly
                </Link>

                <div className="flex flex-col gap-4 text-base">
                  {navigationLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-auto flex flex-col gap-3 pb-10">
                  <SheetClose asChild>
                    <Button asChild variant="ghost" className="w-full">
                      <Link href="/login">Sign in</Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild className="w-full shadow-sm">
                      <Link href="/signup">Get started</Link>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
