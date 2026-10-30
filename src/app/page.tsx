import { ChatExperience } from "@/components/chat/chat-experience";
import { Details } from "@/components/experience/details";
import { Faq } from "@/components/experience/faq";
import { Hero } from "@/components/experience/hero";
import { Packages } from "@/components/experience/packages";
import { Plan } from "@/components/experience/plan";
import { SiteFooter } from "@/components/experience/site-footer";
import { SiteHeader } from "@/components/experience/site-header";

export default function Home() {
  return (
    <ChatExperience>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Packages />
        <Plan />
        <Details />
        <Faq />
      </main>
      <SiteFooter />
    </ChatExperience>
  );
}
