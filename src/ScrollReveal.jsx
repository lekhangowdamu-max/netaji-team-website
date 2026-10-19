import { useEffect } from 'react';

/** Adds scroll-reveal animation to content across all React Router pages. */
export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const selector = [
      'main section',
      '.website > section',
      '.hero-section',
      '.about-section',
      '.members-section',
      '.member-card',
      '.member-item',
      '[class*="member-card"]',
      '[class*="gallery-card"]',
      '[class*="gallery-item"]',
      '[class*="photo-card"]',
    ].join(',');

    const seen = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });

    const scan = () => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        element.classList.add('scroll-reveal');
        observer.observe(element);
      });
    };

    scan();
    const mutationObserver = new MutationObserver(scan);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
