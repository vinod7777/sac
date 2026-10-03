import { useEffect, useState } from "react";
import heroArt from "@/assets/topnav.svg";
import heroBg from "@/assets/hero.png";
import { Reveal } from "./Reveal";
import { fetchCmsContent, defaultCmsContent, type CmsHero } from "@/lib/api";

export function Hero() {
  const [hero, setHero] = useState<CmsHero>(defaultCmsContent.hero);

  useEffect(() => {
    fetchCmsContent().then((data) => {
      if (data?.hero) setHero(data.hero);
    });
  }, []);

  return (
    <section id="top" className="relative">
      <div className="relative overflow-hidden bg-background pb-14 pt-20 sm:pb-70 sm:pt-28">
        <img
          src={heroBg}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top lg:object-top lg:[object-position:center_top] transform-gpu"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 lg:grid-cols-2">
          <Reveal>
            <div>
              <h1 className="max-w-lg font-display text-2xl font-semibold leading-snug text-white sm:text-[2rem]">
                {hero.headline}
              </h1>
              <p className="mt-5 text-sm text-white/80">
                {hero.tagline.includes(".") ? (
                  hero.tagline.split(".").map((part, i, arr) => (
                    <span key={i}>
                      {part.trim()}
                      {i < arr.length - 1 && <span className="text-accent"> . </span>}
                    </span>
                  ))
                ) : (
                  hero.tagline
                )}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="relative">
              <img
                src={heroArt}
                alt="Students learning, building and innovating at the Student Activity Center"
                width={1280}
                height={1024}
                className="mx-auto w-full max-w-xl"
              />
            </div>
          </Reveal>
        </div>

        <svg
          className="absolute inset-x-0 bottom-0 h-24 w-full text-background sm:h-32"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0,120 C400,10 1040,10 1440,120 Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  );
}
