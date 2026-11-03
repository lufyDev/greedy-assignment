import { describe, expect, it } from "vitest";
import { statesUnknownNumber } from "@/lib/chat/number-guard";

describe("statesUnknownNumber", () => {
  it.each([
    "The VIP package is ฿14,000 per person.",
    "You exit at 13,000 ft and fall for 60 seconds.",
    "Then 5 to 7 minutes under canopy.",
    "You'll be at the dropzone for about 3 hours.",
    "Two people on VIP comes to ฿28,000.",
    "VIP costs ฿1,500 more than Deluxe.",
    "1. Check in\n2. Briefing\n3. Climb",
    "No numbers here, just a huge thrill!",
  ])("allows %j", (reply) => {
    expect(statesUnknownNumber(reply, "")).toBe(false);
  });

  it.each([
    "You fall at around 120 mph.",
    "The maximum weight is 100 kg.",
    "You must be 18 to jump.",
    "Your film arrives within 48 hours.",
    "It's 100% safe.",
    "Bangkok is 150 km away.",
  ])("catches %j", (reply) => {
    expect(statesUnknownNumber(reply, "")).toBe(true);
  });

  it("allows a number the customer said themselves", () => {
    expect(statesUnknownNumber("Great, a group of 8 sounds fun!", "We are a group of 8")).toBe(false);
  });
});
