
import { useEffect, useState } from "react";

export default function CinematicEffects() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const updateScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight -
          window.innerHeight;

        const current =
          window.scrollY;

        setProgress(
          scrollable > 0
            ? (current / scrollable) * 100
            : 0
        );

        setShowTop(current > 400);
        setScrolled(current > 40);

        ticking = false;
      });
    };

    window.addEventListener("scroll", updateScroll, {
      passive: true,
    });

    updateScroll();

    return () => {
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <>
      <div
        className="cinematic-progress"
        aria-hidden="true"
        style={{ width: `${progress}%` }}
      />

      <button
        type="button"
        className={`cinematic-top ${showTop ? "visible" : ""}`}
        aria-label="Back to top"
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: window.matchMedia(
              "(prefers-reduced-motion: reduce)"
            ).matches
              ? "auto"
              : "smooth",
          })
        }
      >
        ↑
      </button>

      <style>{`
        .navbar {
          transition:
            background 250ms ease,
            box-shadow 250ms ease,
            border-color 250ms ease;
        }

        .navbar.cinematic-scrolled {
          background: rgba(8, 8, 8, 0.94) !important;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(14px);
        }
      `}</style>

      <NavbarScrollEffect scrolled={scrolled} />
    </>
  );
}

function NavbarScrollEffect({ scrolled }) {
  useEffect(() => {
    const nav = document.querySelector(".navbar");

    if (!nav) return;

    nav.classList.toggle(
      "cinematic-scrolled",
      scrolled
    );

    return () => {
      nav.classList.remove("cinematic-scrolled");
    };
  }, [scrolled]);

  return null;
}
