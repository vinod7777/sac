import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { scrollToHashWhenReady } from "@/lib/smooth-scroll";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import {
  About,
  Clubs,
  WhatWeDo,
  Stats,
  Events,
  Testimonials,
  Mentors,
  Logos,
  Footer,
} from "@/components/site/Sections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AITAM Student Activity Center — Learn. Build. Innovate." },
      {
        name: "description",
        content:
          "AITAM's Student Activity Center: 8 student clubs, industry-led webinars, workshops, events and real client projects in Tekkali, Srikakulam.",
      },
      { property: "og:title", content: "AITAM Student Activity Center — Learn. Build. Innovate." },
      {
        property: "og:description",
        content:
          "Eight student clubs, mentors and real client projects preparing AITAM students for a changing world.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    if (hash) scrollToHashWhenReady(`#${hash}`);
  }, [hash]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Clubs />
        <WhatWeDo />
        <Stats />
        <Events />
        <Testimonials />
        <Mentors />
        <Logos />
        
      </main>
      <Footer />
    </div>
  );
}
