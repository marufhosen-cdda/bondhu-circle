import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

/**
 * Seed script — `npm run db:seed`.
 *
 * Idempotent: it truncates the public schema and rebuilds it from scratch.
 * Produces the demo described in the README:
 *   4 zones / 16 areas, 20 interests, 10 approved venues,
 *   1 admin, 3 hosts, 40 members, 12 activities, 2 active circles,
 *   a time poll with votes, circle chat, feedback and notifications.
 */

const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const areas = [
  { slug: "dhanmondi", nameEn: "Dhanmondi", nameBn: "ধানমন্ডি", zone: "dhanmondi", zoneLabelEn: "Dhanmondi · Mohammadpur · Lalmatia", zoneLabelBn: "ধানমন্ডি · মোহাম্মদপুর · লালমাতিয়া" },
  { slug: "mohammadpur", nameEn: "Mohammadpur", nameBn: "মোহাম্মদপুর", zone: "dhanmondi", zoneLabelEn: "Dhanmondi · Mohammadpur · Lalmatia", zoneLabelBn: "ধানমন্ডি · মোহাম্মদপুর · লালমাতিয়া" },
  { slug: "lalmatia", nameEn: "Lalmatia", nameBn: "লালমাতিয়া", zone: "dhanmondi", zoneLabelEn: "Dhanmondi · Mohammadpur · Lalmatia", zoneLabelBn: "ধানমন্ডি · মোহাম্মদপুর · লালমাতিয়া" },
  { slug: "kalabagan", nameEn: "Kalabagan", nameBn: "কলাবাগান", zone: "dhanmondi", zoneLabelEn: "Dhanmondi · Mohammadpur · Lalmatia", zoneLabelBn: "ধানমন্ডি · মোহাম্মদপুর · লালমাতিয়া" },

  { slug: "gulshan-1", nameEn: "Gulshan 1", nameBn: "গুলশান ১", zone: "gulshan", zoneLabelEn: "Gulshan · Banani · Bashundhara", zoneLabelBn: "গুলশান · বনানী · বসুন্ধরা" },
  { slug: "gulshan-2", nameEn: "Gulshan 2", nameBn: "গুলশান ২", zone: "gulshan", zoneLabelEn: "Gulshan · Banani · Bashundhara", zoneLabelBn: "গুলশান · বনানী · বসুন্ধরা" },
  { slug: "banani", nameEn: "Banani", nameBn: "বনানী", zone: "gulshan", zoneLabelEn: "Gulshan · Banani · Bashundhara", zoneLabelBn: "গুলশান · বনানী · বসুন্ধরা" },
  { slug: "bashundhara", nameEn: "Bashundhara R/A", nameBn: "বসুন্ধরা আর এ", zone: "gulshan", zoneLabelEn: "Gulshan · Banani · Bashundhara", zoneLabelBn: "গুলশান · বনানী · বসুন্ধরা" },

  { slug: "mirpur-10", nameEn: "Mirpur 10", nameBn: "মিরপুর ১০", zone: "mirpur", zoneLabelEn: "Mirpur", zoneLabelBn: "মিরপুর" },
  { slug: "mirpur-6", nameEn: "Mirpur 6", nameBn: "মিরপুর ৬", zone: "mirpur", zoneLabelEn: "Mirpur", zoneLabelBn: "মিরপুর" },
  { slug: "kazipara", nameEn: "Kazipara", nameBn: "কাজীপাড়া", zone: "mirpur", zoneLabelEn: "Mirpur", zoneLabelBn: "মিরপুর" },
  { slug: "rupnagar", nameEn: "Rupnagar", nameBn: "রূপনগর", zone: "mirpur", zoneLabelEn: "Mirpur", zoneLabelBn: "মিরপুর" },

  { slug: "uttara-3", nameEn: "Uttara Sector 3", nameBn: "উত্তরা সেক্টর ৩", zone: "uttara", zoneLabelEn: "Uttara", zoneLabelBn: "উত্তরা" },
  { slug: "uttara-7", nameEn: "Uttara Sector 7", nameBn: "উত্তরা সেক্টর ৭", zone: "uttara", zoneLabelEn: "Uttara", zoneLabelBn: "উত্তরা" },
  { slug: "uttara-11", nameEn: "Uttara Sector 11", nameBn: "উত্তরা সেক্টর ১১", zone: "uttara", zoneLabelEn: "Uttara", zoneLabelBn: "উত্তরা" },
  { slug: "ashkona", nameEn: "Ashkona", nameBn: "আশকোনা", zone: "uttara", zoneLabelEn: "Uttara", zoneLabelBn: "উত্তরা" },
] as const;

const interests = [
  ["coffee", "Coffee & cafés", "কফি ও ক্যাফে", "coffee"],
  ["books", "Book clubs", "বইপাঠ", "book-open"],
  ["walking", "Walking & hikes", "হাঁটা", "footprints"],
  ["badminton", "Badminton", "ব্যাডমিন্টন", "activity"],
  ["cricket", "Cricket", "ক্রিকেট", "trophy"],
  ["food", "Food & dining", "খাবার", "utensils"],
  ["music", "Music", "সংগীত", "music"],
  ["movies", "Movies & cinema", "সিনেমা", "film"],
  ["photography", "Photography", "ছবি তোলা", "camera"],
  ["art", "Art & craft", "শিল্পকলা", "palette"],
  ["yoga", "Yoga & wellness", "যোগ", "heart-pulse"],
  ["fitness", "Gym & fitness", "ফিটনেস", "dumbbell"],
  ["cycling", "Cycling", "সাইকেল", "bike"],
  ["volunteering", "Volunteering", "স্বেচ্ছাসেবা", "hand-heart"],
  ["tech", "Tech & startups", "টেক ও স্টার্টআপ", "laptop"],
  ["language", "Language exchange", "ভাষা বিনিময়", "languages"],
  ["cooking", "Cooking", "রান্না", "chef-hat"],
  ["parenting", "Parenting", "সন্তান প্রতিপালন", "baby"],
  ["boardgames", "Board games", "বোর্ড গেমস", "dice-5"],
  ["travel", "Travel", "ভ্রমণ", "plane"],
] as const;

const venues = [
  { name: "Café Congo", area: "dhanmondi", address: "House 12, Road 9/A, Dhanmondi", type: "cafe", mapUrl: "https://maps.google.com/?q=Cafe+Congo+Dhanmondi" },
  { name: "Dhanmondi Lake Path", area: "dhanmondi", address: "Dhanmondi Lake, Road 8, Dhanmondi", type: "park", mapUrl: "https://maps.google.com/?q=Dhanmondi+Lake" },
  { name: "Lalmatia Club Ground", area: "lalmatia", address: "Block C, Lalmatia, Mohammadpur", type: "park", mapUrl: "https://maps.google.com/?q=Lalmatia+Mohammadpur" },
  { name: "Gulshan Lake Park", area: "gulshan-2", address: "Gulshan Lake Park, Gulshan 2", type: "park", mapUrl: "https://maps.google.com/?q=Gulshan+Lake+Park" },
  { name: "North End Coffee, Banani", area: "banani", address: "Road 11, Banani", type: "cafe", mapUrl: "https://maps.google.com/?q=North+End+Coffee+Banani" },
  { name: "Deskhub Banani", area: "banani", address: "House 42, Road 11, Banani", type: "coworking", mapUrl: "https://maps.google.com/?q=Banani+Coworking" },
  { name: "Bashundhara Sports Complex", area: "bashundhara", address: "Block E, Bashundhara R/A", type: "sports", mapUrl: "https://maps.google.com/?q=Bashundhara+Sports" },
  { name: "Mirpur Indoor Stadium", area: "mirpur-10", address: "Mirpur 10, near Circle", type: "sports", mapUrl: "https://maps.google.com/?q=Mirpur+Stadium" },
  { name: "Uttara Sector 7 Park", area: "uttara-7", address: "Sector 7, Uttara", type: "park", mapUrl: "https://maps.google.com/?q=Uttara+Sector+7+Park" },
  { name: "Aarong Café, Uttara", area: "uttara-3", address: "Sector 3, Uttara", type: "cafe", mapUrl: "https://maps.google.com/?q=Uttara+Sector+3" },
] as const;

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const firstNames = [
  "Ayesha", "Rafi", "Sumaiya", "Imran", "Nusrat", "Farhan", "Tasnim", "Sakib",
  "Mehjabin", "Arif", "Rumana", "Shuvo", "Esha", "Zubair", "Maliha", "Hassan",
  "Prottya", "Nafis", "Sharmin", "Rakib", "Fariha", "Asif", "Nabila", "Tanvir",
  "Sadia", "Wahid", "Urmi", "Jubayer", "Raisa", "Shahriar", "Israt", "Mahin",
  "Keya", "Adnan", "Nipa", "Sabbir", "Mim", "Rasel", "Trisha", "Fahim",
];

const lastNames = [
  "Islam", "Ahmed", "Rahman", "Hossain", "Khan", "Chowdhury", "Akter", "Sarker",
  "Miah", "Uddin", "Hasan", "Begum", "Sikder", "Munshi", "Talukder",
];

interface SeedMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  birthYear: number;
  areaSlug: string;
  locale: "en" | "bn";
  womenOnly: boolean;
}

function buildMembers(): SeedMember[] {
  const zoneSlugs = areas.map((a) => a.slug);
  return firstNames.map((first, i) => {
    const last = lastNames[i % lastNames.length];
    const gender = i % 2 === 0 ? "female" : "male";
    return {
      id: `seed_user_${String(i + 1).padStart(2, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${i + 1}@example.com`,
      phone: `+88017${String(10000000 + i * 137911).slice(0, 8)}`,
      gender,
      birthYear: 1996 + (i % 8),
      areaSlug: zoneSlugs[(i * 3) % zoneSlugs.length],
      locale: i % 3 === 0 ? "bn" : "en",
      womenOnly: i % 9 === 0,
    };
  });
}

const admin: SeedMember = {
  id: "seed_admin_01",
  name: "Rafi Ahmed",
  email: "admin@bondhu.app",
  phone: "+8801711111111",
  gender: "male",
  birthYear: 1992,
  areaSlug: "dhanmondi",
  locale: "en",
  womenOnly: false,
};

const hostProfiles: SeedMember[] = [
  { id: "seed_host_01", name: "Nusrat Jahan", email: "nusrat@bondhu.app", phone: "+8801811111111", gender: "female", birthYear: 1994, areaSlug: "dhanmondi", locale: "bn", womenOnly: false },
  { id: "seed_host_02", name: "Tanvir Hossain", email: "tanvir@bondhu.app", phone: "+8801911111111", gender: "male", birthYear: 1991, areaSlug: "gulshan-2", locale: "en", womenOnly: false },
  { id: "seed_host_03", name: "Sadia Rahman", email: "sadia@bondhu.app", phone: "+8801611111111", gender: "female", birthYear: 1995, areaSlug: "mirpur-10", locale: "bn", womenOnly: false },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function pick<T>(arr: readonly T[], n: number, offset: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(offset + i) % arr.length]);
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding database…");

  await client.unsafe(`
    TRUNCATE
      accounts, sessions, verifications, rate_limits,
      notifications, feedback, blocks, reports, host_applications,
      rsvps, activities, venues,
      poll_votes, poll_options, polls,
      circle_messages, circle_requests, circle_members, circles,
      preferences, user_settings, availability, user_interests,
      interests, areas, users
    RESTART IDENTITY CASCADE;
  `);

  await db
    .insert(schema.areas)
    .values(areas.map((a) => ({ ...a, createdAt: new Date() })));

  const allAreas = await db.select().from(schema.areas);
  const areaId = new Map(allAreas.map((a) => [a.slug, a.id]));

  const interestRows = await db
    .insert(schema.interests)
    .values(interests.map(([slug, nameEn, nameBn, icon]) => ({ slug, nameEn, nameBn, icon })))
    .returning();
  const interestId = new Map(interestRows.map((i) => [i.slug, i.id]));
  const interestIds = interestRows.map((i) => i.id);

  const areaOf = (slug: string) => {
    const id = areaId.get(slug);
    if (!id) throw new Error(`Unknown area ${slug}`);
    return id;
  };

  const slugByAreaId = new Map(allAreas.map((a) => [a.id, a.slug]));

  const venueRows = await db
    .insert(schema.venues)
    .values(
      venues.map((v) => ({
        name: v.name,
        areaId: areaOf(v.area),
        address: v.address,
        mapUrl: v.mapUrl,
        type: v.type,
        isPublic: true,
        approved: true,
      })),
    )
    .returning();
  const venueById = new Map(venueRows.map((v) => [v.name, v]));

  // --- Users -------------------------------------------------------------
  const members = buildMembers();
  const people = [admin, ...hostProfiles, ...members];
  const now = new Date();

  await db.insert(schema.users).values(
    people.map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      emailVerified: true,
      phoneNumber: p.phone,
      phoneNumberVerified: true,
      gender: p.gender,
      birthYear: p.birthYear,
      areaId: areaOf(p.areaSlug),
      bio:
        p.id === admin.id
          ? "Keeping Bondhu Circle safe and useful."
          : "Hey! New in town, up for coffee, walks and long conversations.",
      role: p.id === admin.id ? "admin" : hostProfiles.some((h) => h.id === p.id) ? "host" : "member",
      locale: p.locale,
      status: "active",
      onboardedAt: now,
      guidelinesAcceptedAt: now,
      createdAt: daysFromNow(-60 + (people.indexOf(p) % 40), 10),
    })),
  );

  // --- Interests, availability, preferences, settings ---------------------
  await db.insert(schema.userInterests).values(
    people.flatMap((p, index) => {
      const count = 3 + (index % 5);
      return pick(interestIds, count, index * 3).map((interest) => ({
        userId: p.id,
        interestId: interest,
      }));
    }),
  );

  const slots = ["morning", "afternoon", "evening"] as const;
  await db.insert(schema.availability).values(
    people.flatMap((p, index) => {
      const chosen: { userId: string; weekday: number; slot: string }[] = [];
      const days = 2 + (index % 3);
      for (let d = 0; d < days; d++) {
        const weekday = (index + d * 2) % 7;
        const slot = slots[(index + d) % slots.length];
        if (!chosen.some((c) => c.weekday === weekday && c.slot === slot)) {
          chosen.push({ userId: p.id, weekday, slot });
        }
      }
      return chosen;
    }),
  );

  await db.insert(schema.preferences).values(
    people.map((p, index) => ({
      userId: p.id,
      groupSize: index % 4 === 0 ? "medium" : "small",
      womenOnly: p.womenOnly,
      mode: index % 7 === 0 ? "online" : "both",
      language: index % 3 === 0 ? "bn" : index % 3 === 1 ? "en" : "both",
    })),
  );

  await db.insert(schema.userSettings).values(people.map((p) => ({ userId: p.id })));

  // --- Host applications --------------------------------------------------
  await db.insert(schema.hostApplications).values(
    hostProfiles.map((h, i) => ({
      userId: h.id,
      motivation:
        "I love bringing people together around something small — a walk, a game, a good cup of coffee. I have organised informal meetups for friends for years and would love to do it properly.",
      experience: i === 0 ? "Ran a university book club for two years." : "",
      status: "approved",
      reviewedBy: admin.id,
      reviewedAt: daysFromNow(-30, 11),
      createdAt: daysFromNow(-35, 11),
    })),
  );

  // --- Activities ---------------------------------------------------------
  const hostByArea = (slug: string) => {
    const zone = areas.find((a) => a.slug === slug)?.zone;
    const candidates = hostProfiles.filter((h) => areas.find((a) => a.slug === h.areaSlug)?.zone === zone);
    return (candidates[0] ?? hostProfiles[0]).id;
  };

  interface ActivitySeed {
    title: string;
    description: string;
    category: string;
    venue: string;
    startsIn: number;
    hour: number;
    durationH: number;
    capacity: number;
    cost: number;
    status: "pending" | "approved" | "cancelled" | "completed";
    womenOnly?: boolean;
    attendees: number;
  }

  const activitySeeds: ActivitySeed[] = [
    { title: "Sunday morning walk at Dhanmondi Lake", description: "A gentle 45-minute loop around the lake, coffee afterwards at Café Congo. First-timers very welcome — we keep an easy pace and nobody gets left behind.", category: "walking", venue: "Dhanmondi Lake Path", startsIn: 3, hour: 8, durationH: 2, capacity: 12, cost: 0, status: "approved", attendees: 7 },
    { title: "Coffee & conversations in Dhanmondi", description: "Two hours of unhurried conversation over coffee. We start with a quick round of introductions and then just talk. Bring nothing but yourself.", category: "coffee", venue: "Café Congo", startsIn: 5, hour: 17, durationH: 2, capacity: 8, cost: 350, status: "approved", attendees: 8 },
    { title: "Badminton for beginners", description: "Indoor courts, rackets available on site. We rotate partners every few points so you meet everyone. All levels welcome, shoes with non-marking soles required.", category: "badminton", venue: "Mirpur Indoor Stadium", startsIn: 6, hour: 16, durationH: 2, capacity: 10, cost: 400, status: "approved", attendees: 6 },
    { title: "Book club: a short story evening", description: "We each bring one short story to read aloud and discuss. No preparation needed if you would rather just listen — but sharing something you love is the whole point.", category: "books", venue: "North End Coffee, Banani", startsIn: 8, hour: 18, durationH: 2, capacity: 8, cost: 300, status: "approved", attendees: 5 },
    { title: "Morning yoga in Gulshan Lake Park", description: "A slow, breath-led session suitable for complete beginners. Bring a mat and water. We finish with ten minutes of quiet sitting.", category: "yoga", venue: "Gulshan Lake Park", startsIn: 2, hour: 7, durationH: 1, capacity: 14, cost: 0, status: "approved", attendees: 9 },
    { title: "Photography walk through Old Dhaka", description: "Golden-hour walk focused on composition and light. Phones are absolutely fine — this is about seeing, not gear. We end with chai.", category: "photography", venue: "Lalmatia Club Ground", startsIn: 10, hour: 16, durationH: 3, capacity: 10, cost: 0, status: "approved", attendees: 4 },
    { title: "Startup founders' breakfast", description: "Small, candid breakfast for people building things. What you are working on, what is hard, what you have learned. Keep it kind and concrete.", category: "tech", venue: "Deskhub Banani", startsIn: 12, hour: 9, durationH: 2, capacity: 10, cost: 500, status: "approved", attendees: 3 },
    { title: "Cricket at Uttara Sector 7", description: "Tennis-ball cricket, six-a-side, friendly intensity. We split teams on the spot so nobody has to worry about knowing anyone.", category: "cricket", venue: "Uttara Sector 7 Park", startsIn: 14, hour: 16, durationH: 3, capacity: 18, cost: 200, status: "approved", attendees: 11 },
    { title: "Board game night", description: "Catan, Codenames, Azul and whatever you bring. Teaching happens at the table, so no experience needed. Snacks covered by the venue.", category: "boardgames", venue: "North End Coffee, Banani", startsIn: 7, hour: 19, durationH: 3, capacity: 12, cost: 450, status: "approved", attendees: 12 },
    { title: "Women-only coffee & craft afternoon", description: "A relaxed afternoon for women in the neighbourhood — coffee, a simple craft table, and conversation. Women-only circle, everyone welcome from the community.", category: "coffee", venue: "Aarong Café, Uttara", startsIn: 4, hour: 15, durationH: 3, capacity: 10, cost: 400, status: "approved", womenOnly: true, attendees: 6 },
    { title: "Community park clean-up", description: "We spend two hours picking litter in the park, then share juice. Simple, useful, and a good way to meet people who care about the same things.", category: "volunteering", venue: "Uttara Sector 7 Park", startsIn: 20, hour: 8, durationH: 3, capacity: 20, cost: 0, status: "pending", attendees: 0 },
    { title: "Language exchange: বাংলা ⇄ English", description: "Half an hour in Bangla, half an hour in English, lots of laughter in between. Perfect if you are learning either language.", category: "language", venue: "North End Coffee, Banani", startsIn: -9, hour: 17, durationH: 2, capacity: 10, cost: 250, status: "completed", attendees: 8 },
    { title: "Morning walk and breakfast", description: "A loop through the neighbourhood followed by breakfast at a nearby café. The simplest possible reason to meet, and the one people come back to.", category: "walking", venue: "Dhanmondi Lake Path", startsIn: -16, hour: 8, durationH: 2, capacity: 12, cost: 0, status: "completed", attendees: 9 },
    { title: "Badminton doubles evening", description: "Rotating doubles, all levels. Courts booked, rackets available. Water provided — bring non-marking shoes.", category: "badminton", venue: "Bashundhara Sports Complex", startsIn: -23, hour: 17, durationH: 2, capacity: 12, cost: 400, status: "completed", attendees: 7 },
    { title: "Cricket at Mirpur (cancelled)", description: "Called off due to rain. Everyone who RSVP'd has been notified and refunds are not applicable since nothing was collected.", category: "cricket", venue: "Mirpur Indoor Stadium", startsIn: -4, hour: 16, durationH: 3, capacity: 18, cost: 0, status: "cancelled", attendees: 0 },
  ];

  const eligibleForRsvp = members.filter((m) => m.id !== admin.id);
  const activityRows = [];

  for (const [index, seed] of activitySeeds.entries()) {
    const venue = venueById.get(seed.venue);
    if (!venue) throw new Error(`Unknown venue ${seed.venue}`);
    const startsAt = daysFromNow(seed.startsIn, seed.hour);
    const endsAt = new Date(startsAt.getTime() + seed.durationH * 3600_000);

    const [created] = await db
      .insert(schema.activities)
      .values({
        hostId: hostByArea(slugByAreaId.get(venue.areaId) ?? "dhanmondi"),
        title: seed.title,
        description: seed.description,
        categoryInterestId: interestId.get(seed.category) ?? null,
        venueId: venue.id,
        areaId: venue.areaId,
        startsAt,
        endsAt,
        capacity: seed.capacity,
        costBdt: seed.cost,
        womenOnly: seed.womenOnly ?? false,
        status: seed.status,
        createdAt: daysFromNow(-20, 10),
      })
      .returning();
    activityRows.push(created);

    if (seed.attendees === 0) continue;

    // Women-only activities are attended by women only.
    const pool = eligibleForRsvp.filter((m) =>
      seed.womenOnly ? m.gender === "female" : true,
    );
    const attendees = pick(pool, Math.min(seed.attendees, pool.length), index * 5);

    await db.insert(schema.rsvps).values(
      attendees.map((m, i) => ({
        activityId: created.id,
        userId: m.id,
        status: seed.capacity <= seed.attendees && i >= seed.capacity - 2 ? "waitlist" : "going",
        checkedIn: seed.status === "completed",
        createdAt: daysFromNow(-6, 12),
      })),
    );
  }

  // --- Feedback for completed activities ---------------------------------
  const completed = activityRows.filter((a) => a.status === "completed");
  const completedRsvps = await db
    .select()
    .from(schema.rsvps)
    .where(eq(schema.rsvps.status, "going"));

  await db.insert(schema.feedback).values(
    completedRsvps
      .filter((r) => completed.some((a) => a.id === r.activityId))
      .map((r, i) => ({
        userId: r.userId,
        activityId: r.activityId,
        comfortable: 4 + (i % 2),
        wantToMeetAgain: i % 4 !== 0,
        madeConnection: i % 3 !== 0,
        note: i % 5 === 0 ? "Would love a slightly shorter walk next time, otherwise perfect." : "",
        createdAt: daysFromNow(-7, 20),
      })),
  );

  // --- Circles ------------------------------------------------------------
  const dhanmondiMembers = members
    .filter((m) => areas.find((a) => a.slug === m.areaSlug)?.zone === "dhanmondi")
    .slice(0, 5);
  const gulshanMembers = members
    .filter((m) => areas.find((a) => a.slug === m.areaSlug)?.zone === "gulshan")
    .slice(0, 4);

  const [circle1] = await db
    .insert(schema.circles)
    .values([
      { name: "Dhanmondi Weekenders", zone: "dhanmondi", status: "active", matchedAt: daysFromNow(-18, 9), createdAt: daysFromNow(-18, 9) },
      { name: "Gulshan Lunch Club", zone: "gulshan", status: "active", matchedAt: daysFromNow(-12, 9), createdAt: daysFromNow(-12, 9) },
    ])
    .returning();

  const circle2 = (await db.select().from(schema.circles))[1];

  await db.insert(schema.circleMembers).values([
    ...dhanmondiMembers.map((m) => ({
      circleId: circle1.id,
      userId: m.id,
      role: "member" as const,
      status: "active" as const,
      joinedAt: daysFromNow(-17, 10),
    })),
    { circleId: circle1.id, userId: hostProfiles[0].id, role: "host" as const, status: "active" as const, joinedAt: daysFromNow(-17, 10) },
    ...gulshanMembers.map((m) => ({
      circleId: circle2.id,
      userId: m.id,
      role: "member" as const,
      status: "active" as const,
      joinedAt: daysFromNow(-11, 10),
    })),
    { circleId: circle2.id, userId: hostProfiles[1].id, role: "host" as const, status: "active" as const, joinedAt: daysFromNow(-11, 10) },
  ]);

  await db.insert(schema.circleMessages).values([
    { circleId: circle1.id, userId: dhanmondiMembers[0]?.id ?? "", body: "Salam everyone! Excited for our first meetup 🌱", createdAt: daysFromNow(-16, 21) },
    { circleId: circle1.id, userId: dhanmondiMembers[1]?.id ?? "", body: "Same here. Sunday morning works best for me.", createdAt: daysFromNow(-16, 21) },
    { circleId: circle1.id, userId: hostProfiles[0].id, body: "I have opened a time poll — please vote before Friday.", createdAt: daysFromNow(-2, 18) },
    { circleId: circle2.id, userId: gulshanMembers[0]?.id ?? "", body: "Anyone up for lunch near Banani this week?", createdAt: daysFromNow(-8, 13) },
  ]);

  // --- Poll ---------------------------------------------------------------
  const [poll] = await db
    .insert(schema.polls)
    .values({ circleId: circle1.id, title: "When should we meet for our first circle meetup?", status: "open", closesAt: daysFromNow(4, 21) })
    .returning();

  const options = await db
    .insert(schema.pollOptions)
    .values([
      { pollId: poll.id, label: "Saturday 10:00 AM", startsAt: daysFromNow(6, 10), endsAt: daysFromNow(6, 12) },
      { pollId: poll.id, label: "Saturday 5:00 PM", startsAt: daysFromNow(6, 17), endsAt: daysFromNow(6, 19) },
      { pollId: poll.id, label: "Sunday 9:00 AM", startsAt: daysFromNow(7, 9), endsAt: daysFromNow(7, 11) },
    ])
    .returning();

  await db.insert(schema.pollVotes).values([
    { pollId: poll.id, optionId: options[0].id, userId: dhanmondiMembers[0]?.id ?? "" },
    { pollId: poll.id, optionId: options[1].id, userId: dhanmondiMembers[1]?.id ?? "" },
    { pollId: poll.id, optionId: options[1].id, userId: dhanmondiMembers[2]?.id ?? "" },
    { pollId: poll.id, optionId: options[2].id, userId: hostProfiles[0].id },
  ]);

  // --- Notifications ------------------------------------------------------
  await db.insert(schema.notifications).values([
    ...dhanmondiMembers.map((m) => ({
      userId: m.id,
      type: "circle_invite",
      title: "You were invited to Dhanmondi Weekenders",
      body: "Four neighbours, one weekly meetup. Take a look.",
      href: "/circles",
      payload: { circleId: circle1.id },
      createdAt: daysFromNow(-18, 9),
    })),
    {
      userId: dhanmondiMembers[0]?.id ?? "",
      type: "feedback_request",
      title: "How was Language exchange?",
      body: "Three private questions — it takes a minute.",
      href: "/activities",
      payload: {},
      createdAt: daysFromNow(-8, 21),
    },
    {
      userId: gulshanMembers[0]?.id ?? "",
      type: "waitlist_promotion",
      title: "A spot opened up",
      body: "You are now going to Morning yoga in Gulshan Lake Park.",
      href: "/activities",
      payload: {},
      createdAt: daysFromNow(-1, 12),
    },
  ]);

  // --- A rematch request --------------------------------------------------
  await db.insert(schema.circleRequests).values({
    userId: members[30].id,
    reason: "The meetups always clashed with my office hours.",
    status: "open",
  });

  const counts = {
    areas: allAreas.length,
    interests: interestRows.length,
    venues: venueRows.length,
    users: people.length,
    activities: activityRows.length,
    circles: (await db.select().from(schema.circles)).length,
    rsvps: (await db.select().from(schema.rsvps)).length,
    feedback: (await db.select().from(schema.feedback)).length,
  };

  console.log("Seed complete:", counts);
  console.log("\nSign in with any seeded email, e.g. admin@bondhu.app");
  console.log("The 6-digit code is printed in the terminal running `npm run dev`.\n");
}

main()
  .then(() => client.end())
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
