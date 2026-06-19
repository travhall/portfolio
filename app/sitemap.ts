import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// Only list routes that actually resolve. The FeatureWipe work links
// (/work/wylie-dog, /work/el-camino, /work/moxie-beauty, /work/antibroadcasting)
// don't have pages yet — add them here once those routes exist.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
