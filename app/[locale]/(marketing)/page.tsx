import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  BadgeCheck,
  CalendarHeart,
  Coffee,
  HeartHandshake,
  MapPin,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { images } from "@/lib/images";
import { getInterests } from "@/lib/queries/reference";
import { BLUR_DATA_URL } from "@/lib/utils";
import { Disclosure } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";
import Image from "next/image";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return {
    title: t("hero.title"),
    description: t("hero.subtitle"),
    alternates: { languages: { en: "/en", bn: "/bn" } },
  };
}

const safetyIcons = [BadgeCheck, MapPin, ShieldCheck, HeartHandshake] as const;

export default async function LandingPage() {
  const t = await getTranslations("landing");
  const interests = await getInterests();

  const steps = [
    { icon: Sparkles, title: t("how.step1Title"), text: t("how.step1Text"), image: images.howItWorks.share },
    { icon: Users, title: t("how.step2Title"), text: t("how.step2Text"), image: images.howItWorks.match },
    { icon: CalendarHeart, title: t("how.step3Title"), text: t("how.step3Text"), image: images.howItWorks.meet },
  ] as const;

  const safetyPoints = [1, 2, 3, 4].map((n) => ({
    icon: safetyIcons[n - 1],
    title: t(`safety.point${n}Title` as const),
    text: t(`safety.point${n}Text` as const),
  }));

  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({
    question: t(`faq.q${n}` as const),
    answer: t(`faq.a${n}` as const),
  }));

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:pb-24 lg:pt-20">
          <FadeUp>
            <Badge variant="secondary" className="mb-5">
              {t("hero.badge")}
            </Badge>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
              {t("hero.title")}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link href="/sign-in">
                  {t("hero.ctaPrimary")} <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#how">{t("hero.ctaSecondary")}</Link>
              </Button>
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-primary" aria-hidden /> {t("hero.stat1")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <CalendarHeart className="size-4 text-primary" aria-hidden /> {t("hero.stat2")}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <MapPin className="size-4 text-primary" aria-hidden /> {t("hero.stat3")}
              </li>
            </ul>
          </FadeUp>

          <FadeUp delay={0.12} className="relative">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-border shadow-sm">
              <Image
                src={images.hero.src}
                alt={images.hero.alt}
                fill
                priority
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-sm sm:block">
              <p className="text-xs font-medium text-muted-foreground">{t("hero.badge")}</p>
              <p className="text-sm font-semibold">Dhanmondi · Gulshan · Mirpur · Uttara</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ------------------------------------------------------- How it works */}
      <section id="how" className="border-t border-border bg-card/60 py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <FadeUp className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("how.title")}</h2>
            <p className="mt-3 text-muted-foreground">{t("how.subtitle")}</p>
          </FadeUp>

          <Stagger className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <StaggerItem key={step.title} className="relative">
                <div className="relative mb-5 aspect-3/2 overflow-hidden rounded-2xl border border-border">
                  <Image
                    src={step.image.src}
                    alt={step.image.alt}
                    fill
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-background/90 text-sm font-semibold">
                    {i + 1}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <step.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.text}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* -------------------------------------------------------- Categories */}
      <section id="categories" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <FadeUp className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("categories.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("categories.subtitle")}</p>
          </FadeUp>

          {interests.length > 0 ? (
            <Stagger className="mt-10 flex flex-wrap justify-center gap-3">
              {interests.map((interest) => (
                <StaggerItem key={interest.id}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent">
                    <Coffee className="size-4 text-primary" aria-hidden />
                    {interest.nameEn}
                  </span>
                </StaggerItem>
              ))}
            </Stagger>
          ) : (
            <p className="mt-10 text-center text-sm text-muted-foreground">—</p>
          )}
        </div>
      </section>

      {/* ----------------------------------------------------------- Safety */}
      <section id="safety" className="border-t border-border bg-card/60 py-16 sm:py-20">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <FadeUp className="relative order-2 lg:order-1">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-border">
              <Image
                src={images.safety.src}
                alt={images.safety.alt}
                fill
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </FadeUp>

          <div className="order-1 lg:order-2">
            <FadeUp>
              <ShieldCheck className="size-8 text-primary" aria-hidden />
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t("safety.title")}</h2>
              <p className="mt-3 text-muted-foreground">{t("safety.text")}</p>
            </FadeUp>
            <Stagger className="mt-8 grid gap-5 sm:grid-cols-2">
              {safetyPoints.map((point) => (
                <StaggerItem key={point.title} className="rounded-2xl border border-border bg-background p-4">
                  <point.icon className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-3 text-sm font-semibold">{point.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{point.text}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------- FAQ */}
      <section id="faq" className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <FadeUp className="text-center">
            <MessagesSquare className="mx-auto size-7 text-primary" aria-hidden />
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">{t("faq.title")}</h2>
          </FadeUp>
          <FadeUp delay={0.08} className="mt-8">
            <div className="rounded-2xl border border-border bg-card px-5 sm:px-6">
              {faqs.map((faq) => (
                <Disclosure key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* --------------------------------------------------------------- CTA */}
      <section className="border-t border-border">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-border">
            <Image
              src={images.cta.src}
              alt={images.cta.alt}
              fill
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/40" />
            <div className="relative px-6 py-14 sm:px-12">
              <FadeUp className="max-w-lg">
                <h2 className="text-3xl font-semibold tracking-tight">{t("cta.title")}</h2>
                <p className="mt-3 text-muted-foreground">{t("cta.text")}</p>
                <Button size="lg" className="mt-7" asChild>
                  <Link href="/sign-in">
                    {t("cta.button")} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </FadeUp>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
