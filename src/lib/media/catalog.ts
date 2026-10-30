export type MediaKind = "pdf" | "video";

export type MediaItem = {
  id: string;
  kind: MediaKind;
  title: string;
  description: string;
  /** Playable/downloadable file URL. */
  url: string;
  posterUrl?: string;
  /** "website" = public file from greedyadventures.com, "demo" = sample made for this prototype. */
  origin: "website" | "demo";
  /** Page the file belongs to, shown as the citation. */
  sourceUrl: string;
  /** Package this item is specific to, if any. */
  package?: "eco" | "deluxe" | "vip";
  fileSizeLabel?: string;
};

const PAGE_URL = "https://www.greedyadventures.com/experiences/sea-view-skydiving";
const SITE = "https://www.greedyadventures.com/greedy";

export const MEDIA_CATALOG: MediaItem[] = [
  {
    id: "brochure-sea-view",
    kind: "pdf",
    title: "Sea View Skydiving brochure",
    description: "Packages, prices, the plan for the day and location. Demo material generated from the public page.",
    url: "/media/sea-view-skydiving-brochure-demo.pdf",
    origin: "demo",
    sourceUrl: PAGE_URL,
    fileSizeLabel: "PDF · 2 pages",
  },
  {
    id: "video-sea-view-film",
    kind: "video",
    title: "Sea View Skydiving film",
    description: "The experience film from the Sea View Skydiving page.",
    url: `${SITE}/films/sea-view-studio-hero.mp4`,
    posterUrl: `${SITE}/films/sea-view-studio-hero-poster.jpg`,
    origin: "website",
    sourceUrl: PAGE_URL,
  },
  {
    id: "video-deluxe-preview",
    kind: "video",
    title: "Deluxe package preview",
    description: "Preview of the handy cam video and photos included with Deluxe.",
    url: `${SITE}/package-previews/deluxe-landscape.mp4`,
    posterUrl: `${SITE}/package-previews/deluxe-landscape-poster.png`,
    origin: "website",
    sourceUrl: PAGE_URL,
    package: "deluxe",
  },
  {
    id: "video-vip-preview",
    kind: "video",
    title: "VIP package preview",
    description: "Preview of the personal cameraman's edited film included with VIP.",
    url: `${SITE}/package-previews/vip-landscape.mp4`,
    posterUrl: `${SITE}/package-previews/vip-landscape-poster.png`,
    origin: "website",
    sourceUrl: PAGE_URL,
    package: "vip",
  },
];

export function getMediaById(id: string): MediaItem | undefined {
  return MEDIA_CATALOG.find((m) => m.id === id);
}
