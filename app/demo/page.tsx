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
          },
          {
            eyebrow: "New Site",
            headline: "El Camino Skate Shop",
            side: "left",
          },
          {
            eyebrow: "New Site",
            headline: "Moxie Beauty",
            side: "right",
          },
          {
            eyebrow: "Mobile App",
            headline: "Nike Run Club Redesign",
            side: "left",
          },
        ]}
      />
    </div>
  );
}
