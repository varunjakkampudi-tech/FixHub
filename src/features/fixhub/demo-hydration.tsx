import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "./locales";

export function DemoHydration({ locale }: { locale: Locale }) {
  const message =
    locale === "te-IN"
      ? "మీ సేవా ప్రివ్యూను సిద్ధం చేస్తున్నాం"
      : locale === "hi-IN"
        ? "आपकी सेवा का पूर्वावलोकन तैयार हो रहा है"
        : "Getting your service preview ready";
  const detail =
    locale === "te-IN"
      ? "మీరు ఎంచుకున్న భాష, నమూనా సెషన్‌ను లోడ్ చేస్తున్నాం."
      : locale === "hi-IN"
        ? "आपकी भाषा और डेमो सत्र लोड हो रहा है।"
        : "Loading your language and demo session.";

  return (
    <main
      className="min-h-screen bg-background px-4 py-8 sm:px-6"
      aria-busy="true"
    >
      <div className="sr-only" role="status" aria-live="polite">
        {message}. {detail}
      </div>
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between border-b border-border pb-5">
          <Skeleton className="h-8 w-28" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-16 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </div>
        <section className="mx-auto max-w-3xl py-10 sm:py-14" aria-hidden="true">
          <Skeleton className="h-8 w-3/4 max-w-sm" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-md" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-xl border border-border p-5">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-5 w-2/3" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl border border-border p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-4 h-11 w-full rounded-lg" />
          </div>
        </section>
        <div aria-hidden="true">
          <p className="text-center text-sm text-muted-foreground">{message}</p>
          <p className="mt-1 text-center text-xs text-muted-foreground">{detail}</p>
        </div>
      </div>
    </main>
  );
}
