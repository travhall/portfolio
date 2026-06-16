import { FeatureWipe } from "@/components/features/FeatureWipe";

export default function DemoPage() {
  return (
    <div>
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
            eyebrow: "Mobile App",
            headline: "Nike Run Club Redesign",
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
