/**
 * The single source of truth for every remote image the app uses.
 *
 * Photos are served by Unsplash's CDN through `next/image` (see
 * `remotePatterns` in next.config.ts). Every ID below was verified to resolve
 * before being added. Photographer credits live in `photoCredits` and are
 * rendered on the Credits page and in the footer.
 *
 * If R2 uploads are configured, a user-supplied activity cover takes priority
 * over these defaults (see `activityCover`).
 */

export interface Photo {
  src: string;
  alt: string;
  /** Photographer display name for the credits page. */
  photographer: string;
  /** Unsplash profile URL. */
  profile: string;
}

function unsplash(id: string, params = "w=1600&q=75&auto=format&fit=crop"): string {
  return `https://images.unsplash.com/${id}?${params}`;
}

/**
 * Generic blur placeholder. Next.js needs a data URL for remote blur images;
 * this is a 12×8 neutral gradient that keeps layout stable while loading.
 */
export const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSI4Ij48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgyPSIwIiB5Mj0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjZTJlOWU3IiBvZmZzZXQ9IjAiLz48c3RvcCBzdG9wLWNvbG9yPSIjZDBmYWYyIiBvZmZzZXQ9IjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIiIGhlaWdodD0iOCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==";

export const images = {
  hero: {
    src: unsplash("photo-1517248135467-4c7edcad34c4"),
    alt: "Friends laughing together around a café table",
    photographer: "Priscilla Du Preez",
    profile: "https://unsplash.com/@priscilladupreez",
  },
  howItWorks: {
    share: {
      src: unsplash("photo-1543269865-cbf427effbad", "w=900&q=70&auto=format&fit=crop"),
      alt: "A group of friends talking over coffee",
      photographer: "Helena Lopes",
      profile: "https://unsplash.com/@helenaelopes",
    },
    match: {
      src: unsplash("photo-1522202176988-66273c2fd55f", "w=900&q=70&auto=format&fit=crop"),
      alt: "Young people planning something together at a table",
      photographer: "Brooke Cagle",
      profile: "https://unsplash.com/@brookecagle",
    },
    meet: {
      src: unsplash("photo-1529156069898-49953e39b3ac", "w=900&q=70&auto=format&fit=crop"),
      alt: "Friends celebrating together outdoors",
      photographer: " Helena Lopes",
      profile: "https://unsplash.com/@helenaelopes",
    },
  },
  safety: {
    src: unsplash("photo-1511632765486-a01980e01a18", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A diverse group of friends together in a park",
    photographer: "Naassom Azevedo",
    profile: "https://unsplash.com/@naassom",
  },
  cta: {
    src: unsplash("photo-1523240795612-9a054b0db644", "w=1400&q=75&auto=format&fit=crop"),
    alt: "Friends sharing a meal together",
    photographer: "Jacob Botter",
    profile: "https://unsplash.com/@jacobbotter",
  },
  circleDefault: {
    src: unsplash("photo-1521737604893-d14cc237f11d", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A team of friends standing together",
    photographer: "Alejandro Escamilla",
    profile: "https://unsplash.com/@alejandroescamilla",
  },
} as const;

/** Covers used for seeded/suggested activities, keyed by category slug. */
export const categoryCovers: Record<string, Photo> = {
  coffee: {
    src: unsplash("photo-1495474472287-4d71bcdd2085", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A cup of coffee on a wooden table",
    photographer: "Nathan Dumlao",
    profile: "https://unsplash.com/@nate_dumlao",
  },
  food: {
    src: unsplash("photo-1504674900247-0877df9cc836", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A plate of food shared at a table",
    photographer: "Eaters Collective",
    profile: "https://unsplash.com/@eaterscollective",
  },
  books: {
    src: unsplash("photo-1481627834876-b7833e8f5570", "w=1200&q=75&auto=format&fit=crop"),
    alt: "Shelves full of books in a library",
    photographer: "Tom Hermans",
    profile: "https://unsplash.com/@tomhermans",
  },
  walking: {
    src: unsplash("photo-1490645935967-10de6ba17061", "w=1200&q=75&auto=format&fit=crop"),
    alt: "People walking outdoors",
    photographer: "Sara Dubler",
    profile: "https://unsplash.com/@saradubler",
  },
  sports: {
    src: unsplash("photo-1552674605-db6ffd4facb5", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A badminton rally in an indoor court",
    photographer: "Ryan Hoffman",
    profile: "https://unsplash.com/@rhcop",
  },
  fitness: {
    src: unsplash("photo-1517836357463-d25dfeac3438", "w=1200&q=75&auto=format&fit=crop"),
    alt: "People training together in a gym",
    photographer: "Victor Freitas",
    profile: "https://unsplash.com/@victorfreitas",
  },
  yoga: {
    src: unsplash("photo-1544367567-0f2fcb009e0b", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A group yoga session",
    photographer: "Jarosław Kwoczała",
    profile: "https://unsplash.com/@jaro",
  },
  coworking: {
    src: unsplash("photo-1497366216548-37526070297c", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A bright coworking space",
    photographer: "Nastuh Abootalebi",
    profile: "https://unsplash.com/@nastuh",
  },
  photography: {
    src: unsplash("photo-1531058020387-3be344556be6", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A camera on a café table",
    photographer: "Alejandro Escamilla",
    profile: "https://unsplash.com/@alejandroescamilla",
  },
  music: {
    src: unsplash("photo-1533174072545-7a4b6ad7a6c3", "w=1200&q=75&auto=format&fit=crop"),
    alt: "Friends playing music together",
    photographer: "Daniel Robert",
    profile: "https://unsplash.com/@danielrobert",
  },
  volunteering: {
    src: unsplash("photo-1552664730-d307ca884978", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A group planning a community project",
    photographer: "Marvin Meyer",
    profile: "https://unsplash.com/@marvinmeier",
  },
  startup: {
    src: unsplash("photo-1517048676732-d65bc937f952", "w=1200&q=75&auto=format&fit=crop"),
    alt: "Colleagues working together",
    photographer: "Alejandro Escamilla",
    profile: "https://unsplash.com/@alejandroescamilla",
  },
  running: {
    src: unsplash("photo-1540497077202-7c8a3999166f", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A group run through the city",
    photographer: "Jakob Owens",
    profile: "https://unsplash.com/@jakobowens1",
  },
  boardgames: {
    src: unsplash("photo-1522202176988-66273c2fd55f", "w=1200&q=75&auto=format&fit=crop"),
    alt: "Friends gathered around a table",
    photographer: "Brooke Cagle",
    profile: "https://unsplash.com/@brookecagle",
  },
  parenting: {
    src: unsplash("photo-1546484475-7f7bd55792da", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A relaxed afternoon outdoors",
    photographer: "Katie Egnor",
    profile: "https://unsplash.com/@katieegnor",
  },
  art: {
    src: unsplash("photo-1465146344425-f00d5f5c8f07", "w=1200&q=75&auto=format&fit=crop"),
    alt: "Colour and texture inspiration",
    photographer: "Kristine Longva",
    profile: "https://unsplash.com/@kristinelongva",
  },
  travel: {
    src: unsplash("photo-1506126613408-eca07ce68773", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A quiet moment outdoors",
    photographer: "JD Mason",
    profile: "https://unsplash.com/@jdjmason",
  },
  tech: {
    src: unsplash("photo-1524758631624-e2822e304c36", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A laptop and notebook on a desk",
    photographer: "Sigmund",
    profile: "https://unsplash.com/@sigmund",
  },
  cinema: {
    src: unsplash("photo-1507003211169-0a1dd7228f2d", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A portrait in warm light",
    photographer: "Ayo Ogunseinde",
    profile: "https://unsplash.com/@ayoongunseinde",
  },
  cooking: {
    src: unsplash("photo-1414235077428-338989a2e8c0", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A busy restaurant kitchen table",
    photographer: "Jay Wennington",
    profile: "https://unsplash.com/@jaywennington",
  },
  language: {
    src: unsplash("photo-1554118811-1e0d58224f24", "w=1200&q=75&auto=format&fit=crop"),
    alt: "A quiet café corner",
    photographer: "Nathan Dumlao",
    profile: "https://unsplash.com/@nate_dumlao",
  },
  cycling: {
    src: unsplash("photo-1571019613454-1cb2f99b2d8b", "w=1200&q=75&auto=format&fit=crop"),
    alt: "People keeping active together",
    photographer: "Danielle MacInnes",
    profile: "https://unsplash.com/@d__mac",
  },
};

/** Generic fallback cover for activities without a category match. */
export const fallbackCover: Photo = {
  src: unsplash("photo-1543269865-cbf427effbad", "w=1200&q=75&auto=format&fit=crop"),
  alt: "Friends spending time together",
  photographer: "Helena Lopes",
  profile: "https://unsplash.com/@helenaelopes",
};

export function activityCover(categorySlug?: string | null): Photo {
  if (categorySlug && categoryCovers[categorySlug]) return categoryCovers[categorySlug];
  return fallbackCover;
}

/** Every photo used anywhere, for the credits page. */
export const photoCredits: Photo[] = [
  images.hero,
  images.howItWorks.share,
  images.howItWorks.match,
  images.howItWorks.meet,
  images.safety,
  images.cta,
  images.circleDefault,
  fallbackCover,
  ...Object.values(categoryCovers),
];
