import { WEBSITE_SOURCES } from "@/lib/knowledge/snapshot";

/**
 * Last check before a reply reaches the customer: every number in it must be on
 * the page. A warm model will still sometimes state a figure it "knows" (it
 * invented "around 120 mph" for freefall speed), and a made-up number is the
 * worst kind of wrong answer here. Unlike a prompt rule, this can't be ignored.
 */

export const NUMBER_NOT_ON_PAGE_REPLY =
  "I don't have that detail on this page, so I won't guess. The Greedy Adventures team can confirm it for you: use Contact us on our website.";

const NUMBER = /\d[\d,.]*\d|\d/g;

const numbersIn = (text: string) => (text.match(NUMBER) ?? []).map((n) => Number(n.replace(/,/g, "")));

const PAGE_TEXT = WEBSITE_SOURCES.flatMap((source) => source.sections.map((section) => section.text)).join(" ");

// The page writes "five to seven minutes" in words.
const ON_PAGE = new Set([...numbersIn(PAGE_TEXT), 5, 7]);

const PRICES = [...new Set((PAGE_TEXT.match(/฿[\d,]+/g) ?? []).map((price) => Number(price.slice(1).replace(/,/g, ""))))];

/** Simple maths on real prices is fine: the cost for a group, or the gap between two packages. */
function isPriceMaths(n: number): boolean {
  const isGroupTotal = PRICES.some((price) => n % price === 0 && n / price <= 20);
  const isPriceGap = PRICES.some((a) => PRICES.some((b) => a - b === n));
  return isGroupTotal || isPriceGap;
}

/** True when the reply states a number that isn't on the page or in the customer's own message. */
export function statesUnknownNumber(reply: string, customerMessage: string): boolean {
  const fromCustomer = new Set(numbersIn(customerMessage));
  return numbersIn(reply).some((n) => !ON_PAGE.has(n) && !fromCustomer.has(n) && !isPriceMaths(n));
}
