import { useEffect, useState } from 'react';

/**
 * Highlights whichever in-page section is currently in view via
 * IntersectionObserver. Returns the active section id and a programmatic
 * scroll handler that scrolls the closest scrollable ancestor (not the
 * document) — works around scrollIntoView's unreliable behaviour in
 * nested overflow:auto containers.
 */
export function useSettingsScrollSpy(
  sectionIds: readonly string[],
  enabled: boolean,
): { activeSection: string; scrollToSection: (id: string) => void } {
  const [activeSection, setActiveSection] = useState<string>(
    sectionIds[0] ?? '',
  );

  useEffect(() => {
    if (!enabled) return;
    const targets = sectionIds
      .map((id) => document.getElementById(`sec-${id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          )[0];
        if (visible) {
          setActiveSection(visible.target.id.replace(/^sec-/, ''));
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [enabled, sectionIds]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    let scroller: HTMLElement | null = el.parentElement;
    while (scroller && scroller !== document.body) {
      const o = getComputedStyle(scroller).overflowY;
      if (o === 'auto' || o === 'scroll') break;
      scroller = scroller.parentElement;
    }
    if (scroller && scroller !== document.body) {
      const elTop = el.getBoundingClientRect().top;
      const scTop = scroller.getBoundingClientRect().top;
      const offset = elTop - scTop + scroller.scrollTop - 16;
      scroller.scrollTo({ top: offset, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSection(id);
  };

  return { activeSection, scrollToSection };
}
