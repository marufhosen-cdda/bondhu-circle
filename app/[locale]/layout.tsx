import type { Metadata, Viewport } from "next";
import { Inter, Hind_Siliguri } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { isLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind",
  display: "swap",
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: {
      default: `${t("appName")} — ${t("tagline")}`,
      template: `%s · ${t("appName")}`,
    },
    description:
      "Bondhu Circle matches you into a small weekly circle of people in Dhaka and gives you a reason to meet up in real life.",
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Bondhu", statusBarStyle: "default" },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1413" },
  ],
  width: "device-width",
  initialScale: 1,
};

/** Applies the saved theme before first paint so there is no flash. */
const themeScript = `(function(){try{var s=localStorage.getItem("bondhu-theme");var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={cn(
          "min-h-dvh bg-background font-sans text-foreground antialiased",
          inter.variable,
          hindSiliguri.variable,
          locale === "bn" && "bn-body",
        )}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Dhaka">
          <NuqsAdapter>{children}</NuqsAdapter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { borderRadius: "12px", border: "1px solid var(--border)" },
            }}
            closeButton
            richColors
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
