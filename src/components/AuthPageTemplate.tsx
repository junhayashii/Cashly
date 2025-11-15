import { ReactNode } from "react";

type AuthPageTemplateProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
};

export function AuthPageTemplate({
  children,
  eyebrow,
  title,
  description,
}: AuthPageTemplateProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 -top-44 h-[420px] bg-gradient-to-b from-sky-200/70 via-transparent to-transparent blur-3xl" />
        <div className="absolute inset-x-16 top-16 h-[360px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(147,197,253,0.55),_transparent_65%)] blur-[140px]" />
        <div className="absolute -left-24 bottom-12 h-72 w-72 rounded-full bg-sky-200/50 blur-[160px]" />
        <div className="absolute -right-16 top-12 h-80 w-80 rounded-full bg-cyan-200/50 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12 sm:px-8 lg:px-12">
        <div className="relative w-full rounded-[42px] border border-sky-100 bg-white/95 shadow-[0_40px_140px_rgba(15,23,42,0.18)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-6 top-0 h-36 rounded-b-[55%] bg-gradient-to-b from-sky-100/80 via-transparent to-transparent blur-2xl" />
          <div className="pointer-events-none absolute inset-y-10 left-6 w-32 rounded-3xl bg-gradient-to-br from-sky-100 via-transparent to-transparent blur-2xl" />
          <div className="pointer-events-none absolute inset-y-16 right-6 w-32 rounded-3xl bg-gradient-to-tl from-cyan-100 via-transparent to-transparent blur-2xl" />

          <div className="relative grid w-full gap-10 px-6 sm:px-10 lg:grid-cols-[1fr_1fr] lg:py-12">
            <div className="space-y-8 text-slate-800 lg:text-left">
              <div className="flex flex-col items-center gap-4 lg:items-start">
                <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.4em] text-sky-600 shadow-sm shadow-sky-100">
                  {eyebrow}
                </span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                  {title}
                </h1>
                <p className="text-base text-slate-500 sm:text-lg">
                  {description}
                </p>
              </div>
            </div>

            <div className="relative rounded-[32px] px-2 py-6 sm:px-6">
              <div className="absolute inset-0 -z-10 rounded-[36px] bg-gradient-to-br from-white via-sky-50 to-transparent blur-[120px]" />
              <div className="relative">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
