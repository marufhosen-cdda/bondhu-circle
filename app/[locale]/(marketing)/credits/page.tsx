import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Camera, ExternalLink } from "lucide-react";

import { BLUR_PLACEHOLDER, photoCredits } from "@/lib/images";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FadeUp, Stagger, StaggerItem } from "@/components/motion";

export async function generateMetadata() {
  const t = await getTranslations("landing.footer");
  return { title: t("credits") };
}

/**
 * Attribution for every photograph the app uses.
 *
 * All photos come from Unsplash (free to use, attribution appreciated) and are
 * served through `next/image` from `images.unsplash.com`. Empty-state
 * illustrations are hand-drawn inline SVG in `components/features/shared`, so
 * they need no licence.
 */
export default async function CreditsPage() {
  const [t, tn] = await Promise.all([
    getTranslations("landing.footer"),
    getTranslations("nav"),
  ]);

  const seen = new Set<string>();
  const photos = photoCredits.filter((photo) => {
    if (seen.has(photo.src)) return false;
    seen.add(photo.src);
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-14 sm:px-6">
      <FadeUp className="space-y-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Camera className="size-3.5 text-primary" aria-hidden />
          {photos.length} photos
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("credits")}</h1>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t("note")}
        </p>
      </FadeUp>

      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <StaggerItem key={photo.src}>
            <Card className="h-full overflow-hidden">
              <div className="relative aspect-[4/3] w-full bg-muted">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                  className="object-cover"
                />
              </div>
              <CardContent className="space-y-2 pt-4">
                <p className="text-sm font-medium">{photo.photographer}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{photo.alt}</p>
                <a
                  href={photo.profile}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 text-xs text-primary underline-offset-4 hover:underline"
                >
                  Unsplash <ExternalLink className="size-3" aria-hidden />
                </a>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeUp className="flex justify-center">
        <Button asChild variant="outline">
          <Link href="/">{tn("home")}</Link>
        </Button>
      </FadeUp>
    </div>
  );
}
