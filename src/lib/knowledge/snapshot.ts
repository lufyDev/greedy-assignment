import type { WebsiteSource } from "./types";

/**
 * Text captured by hand from the public Sea View Skydiving page on 2026-10-30.
 * Each section is one retrievable chunk. Wording is kept close to the page so
 * the chatbot can only repeat what the website actually says.
 */
export const SEA_VIEW_SOURCE: WebsiteSource = {
  id: "sea-view-skydiving",
  title: "Sea View Skydiving — Tandem Jump over Pattaya | Greedy Adventures",
  url: "https://www.greedyadventures.com/experiences/sea-view-skydiving",
  capturedAt: "2026-10-30",
  sections: [
    {
      id: "overview",
      heading: "Overview",
      text:
        "Sea View Tandem Skydive - Pattaya. A tandem skydiving experience over Pattaya with ocean views. " +
        "Guests receive a safety briefing, fly to jump altitude, complete the tandem jump with a certified instructor, " +
        "and choose from ECO, Deluxe, or VIP package options depending on the media coverage they want.",
    },
    {
      id: "package-eco",
      heading: "ECO package",
      text:
        "ECO — The jump, nothing else. ฿9,500 per person. Included: tandem skydive experience in Pattaya, Thailand; " +
        "safety briefing and tandem instructor support; aircraft ascent and ocean-view jump experience; certificate of completion.",
    },
    {
      id: "package-deluxe",
      heading: "Deluxe package",
      text:
        "Deluxe — Video and photos included. ฿12,500 per person. Included: tandem skydive experience in Pattaya, Thailand; " +
        "safety briefing and tandem instructor support; aircraft ascent and ocean-view jump experience; certificate of completion. " +
        "Choose Deluxe if you want handy cam video.",
    },
    {
      id: "package-vip",
      heading: "VIP package",
      text:
        "VIP — Personal cameraman and edited film. ฿14,000 per person. Included: tandem skydive experience in Pattaya, Thailand; " +
        "safety briefing and tandem instructor support; aircraft ascent and ocean-view jump experience; certificate of completion. " +
        "Choose VIP if you want full media coverage.",
    },
    {
      id: "whats-included",
      heading: "What's included in every package",
      text:
        "What's included in every package: tandem skydive experience in Pattaya, Thailand; safety briefing and tandem instructor support; " +
        "aircraft ascent and ocean-view jump experience; certificate of completion. " +
        "Same aircraft, altitude and instructors in every package. The packages differ only in media coverage.",
    },
    {
      id: "the-plan",
      heading: "The plan",
      text:
        "Step 1, arrival and check-in: sign in at the dropzone and bring your photo ID. " +
        "Step 2, safety briefing and gear fitting: meet your instructor for the safety briefing and harness fitting. " +
        "Step 3, boarding and the climb: board the aircraft and climb to jump altitude. " +
        "Step 4, exit and freefall: exit with your instructor for freefall over the Gulf of Thailand. " +
        "Step 5, canopy flight and landing: fly under the parachute with your instructor and land back at the dropzone. " +
        "At the dropzone: 3 hours. Exit altitude: 13,000 ft. 60 seconds of freefall.",
    },
    {
      id: "highlights",
      heading: "Highlights",
      text:
        "Exit at 13,000 ft with the Gulf of Thailand on the horizon. " +
        "Around sixty seconds of freefall, then five to seven minutes under canopy along the coast. " +
        "No experience needed: your USPA-certified instructor flies the jump. " +
        "Same aircraft, altitude and instructors in every package.",
    },
    {
      id: "location",
      heading: "Where you jump",
      text:
        "Where you jump: Pattaya Sea View, Pattaya, Thailand. Address: 95 M.4, Chakphong, Klaeng District, Rayong 21190, Thailand. " +
        "Operated by Dropzone Thailand.",
    },
    {
      id: "booking-contact",
      heading: "How to book and contact us",
      text:
        "To book, choose your package and use the Check availability button for that package. " +
        "For anything else, use Contact us on the website. Greedy Adventures is on Instagram at greedy_adventures.",
    },
    {
      id: "faq-where",
      heading: "FAQ: Where does the activity take place?",
      text: "Where does the activity take place? The tandem skydive is listed for Pattaya, Thailand.",
    },
    {
      id: "faq-which-package",
      heading: "FAQ: Which package should I choose?",
      text:
        "Which package should I choose? Choose ECO for the standard jump, Deluxe if you want handy cam video, " +
        "and VIP if you want full media coverage.",
    },
    {
      id: "faq-bangkok-pickup",
      heading: "FAQ: Is Bangkok pickup available?",
      text: "Is Bangkok pickup available? Yes. Bangkok pickup is available as a fixed-price add-on.",
    },
  ],
};

export const WEBSITE_SOURCES: WebsiteSource[] = [SEA_VIEW_SOURCE];
