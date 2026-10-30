/**
 * Structured content for the redesigned Sea View Skydiving page, taken from
 * the public page (captured 2026-10-30). The chatbot does not read this file;
 * it answers from the captured text in src/lib/knowledge/snapshot.ts.
 */

const SITE = "https://www.greedyadventures.com/greedy";
const R2 = "https://pub-89f493a2b50b4e43b99552a737bef138.r2.dev/offerings";

export const EXPERIENCE = {
  eyebrow: "Pattaya Dropzone",
  title: "Sea View Skydiving",
  subtitle: "Tandem jump over Pattaya",
  summary:
    "A tandem skydive over Pattaya with ocean views. Brief with your instructor, climb to 13,000 ft and fall towards the Gulf of Thailand. No experience needed.",
  sourceUrl: "https://www.greedyadventures.com/experiences/sea-view-skydiving",
  heroVideo: `${SITE}/films/sea-view-studio-hero.mp4`,
  heroPoster: `${SITE}/films/sea-view-studio-hero-poster.jpg`,
  stats: [
    { value: "13,000", unit: "ft", label: "Exit altitude" },
    { value: "60", unit: "sec", label: "Of freefall" },
    { value: "5–7", unit: "min", label: "Under canopy" },
    { value: "3", unit: "h", label: "At the dropzone" },
  ],
  inclusions: [
    "Tandem skydive experience in Pattaya, Thailand",
    "Safety briefing and tandem instructor support",
    "Aircraft ascent and ocean-view jump experience",
    "Certificate of completion",
  ],
  packages: [
    {
      id: "eco",
      name: "ECO",
      tagline: "The jump, nothing else",
      priceThb: 9500,
      media: "No media coverage",
      mediaDetail: "Just you, your instructor and the view.",
      preview: { type: "image" as const, src: `${SITE}/package-previews/eco-landscape.jpg` },
    },
    {
      id: "deluxe",
      name: "Deluxe",
      tagline: "Video and photos included",
      priceThb: 12500,
      media: "Handy cam video + photos",
      mediaDetail: "Handy cam video and photos of your jump.",
      preview: {
        type: "video" as const,
        src: `${SITE}/package-previews/deluxe-landscape.mp4`,
        poster: `${R2}/apex-gallery/jump-post-exit.webp`,
      },
    },
    {
      id: "vip",
      name: "VIP",
      tagline: "Personal cameraman and edited film",
      priceThb: 14000,
      media: "Personal cameraman + edited film",
      mediaDetail: "Full media coverage: your own cameraman and an edited film.",
      preview: {
        type: "video" as const,
        src: `${SITE}/package-previews/vip-landscape.mp4`,
        poster: `${R2}/apex-gallery/tandem-with-sea-view.webp`,
      },
    },
  ],
  plan: [
    { title: "Arrival and check-in", detail: "Sign in at the dropzone and bring your photo ID.", image: `${SITE}/trips/dropzone-thailand-check-in.jpg` },
    { title: "Safety briefing and gear fitting", detail: "Meet your instructor for the safety briefing and harness fitting.", image: `${R2}/sea-view-tandem-skydive-pattaya/108d38.jpg` },
    { title: "Boarding and the climb", detail: "Board the aircraft and climb to jump altitude.", image: `${R2}/apex-gallery/plane.webp` },
    { title: "Exit and freefall", detail: "Exit with your instructor for freefall over the Gulf of Thailand.", image: `${R2}/apex-gallery/jump-after-exit.webp` },
    { title: "Canopy flight and landing", detail: "Fly under the parachute with your instructor and land back at the dropzone.", image: `${SITE}/trips/tandem-canopy-landing-g0250281.jpg` },
  ],
  highlights: [
    "Exit at 13,000 ft with the Gulf of Thailand on the horizon",
    "Around sixty seconds of freefall, then five to seven minutes under canopy along the coast",
    "No experience needed: your USPA-certified instructor flies the jump",
    "Same aircraft, altitude and instructors in every package",
  ],
  location: {
    name: "Pattaya Sea View, Pattaya, Thailand",
    address: "95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand",
    operator: "Dropzone Thailand",
  },
  faq: [
    { q: "Where does the activity take place?", a: "The tandem skydive is listed for Pattaya, Thailand." },
    {
      q: "Which package should I choose?",
      a: "Choose ECO for the standard jump, Deluxe if you want handy cam video, and VIP if you want full media coverage.",
    },
    { q: "Is Bangkok pickup available?", a: "Yes. Bangkok pickup is available as a fixed-price add-on." },
  ],
  gallery: [
    {
      src: `${R2}/sea-view-tandem-skydive-pattaya/verified-2026/a22f4aa4-5fab-41b9-8e07-19843e031f14-5-canopy-landing.webp`,
      alt: "Tandem instructor gathering the parachute after landing at the Pattaya dropzone",
    },
    { src: `${R2}/apex-gallery/gearing-up.webp`, alt: "Instructor helping a tandem customer with her harness at the Pattaya dropzone" },
    { src: `${R2}/apex-gallery/instrcutor-with-customer.webp`, alt: "Tandem customer with instructor at the Pattaya dropzone" },
  ],
};

export type ExperiencePackage = (typeof EXPERIENCE.packages)[number];

export function formatThb(amount: number): string {
  return `฿${amount.toLocaleString("en-US")}`;
}
