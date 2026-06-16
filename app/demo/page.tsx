import { HeroSection } from "@/components/hero/HeroSection";
import { ScrollCue } from "@/components/hero/ScrollCue";
import { FeatureWipe } from "@/components/features/FeatureWipe";

export default function DemoPage() {
  return (
    <div>
      {/* ── Intro ── statement text scrolls away before the hero pins ── */}
      <section className="intro-section">
        <div className="intro-section__inner">
          <p className="type-statement text-ink intro-section__statement">
            Creating thoughtful digital experiences through design &amp; code
          </p>
          <ScrollCue />
        </div>
      </section>
      <HeroSection intensity={1.5} />
      <FeatureWipe
        features={[
          {
            eyebrow: "Featured Project",
            headline: "Wylie Dog Design System",
            side: "right",
            imageSrc: "/images/hero-light.jpg",
            buttonText: "View Case Study",
            buttonUrl: "/work/wylie-dog",
          },
          {
            eyebrow: "New Site",
            headline: "El Camino Skate Shop",
            side: "left",
            imageSrc: "/images/hero-dark.jpg",
            buttonText: "Visit Skate Shop",
            buttonUrl: "/work/el-camino",
          },
          {
            eyebrow: "New Site",
            headline: "Moxie Beauty",
            side: "right",
            imageSrc: "/images/about-img.jpg",
            buttonText: "View Case Study",
            buttonUrl: "/work/moxie-beauty",
          },
          {
            eyebrow: "Redesign",
            headline: "Anti-broadcasting",
            side: "left",
            imageSrc: "/images/hero-dark-alt.jpg",
            buttonText: "View Redesign",
            buttonUrl: "/work/nike-run",
          },
        ]}
      />
    </div>
  );
}
