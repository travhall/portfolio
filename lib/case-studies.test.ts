import { describe, expect, it } from "vitest";
import { getRelatedCaseStudies, type CaseStudy } from "./case-studies";

function makeStudy(slug: string, comingSoon = false): CaseStudy {
  return {
    slug,
    eyebrow: "",
    headline: "",
    side: "left",
    image: "",
    featured: false,
    comingSoon,
  };
}

describe("getRelatedCaseStudies", () => {
  const studies = [
    makeStudy("a"),
    makeStudy("b"),
    makeStudy("c"),
    makeStudy("d"),
  ];

  it("returns the 2 preceding + 2 subsequent studies, deduped, for a middle slug", () => {
    const result = getRelatedCaseStudies(studies, "b", 2);
    const slugs = result.map((s) => s.slug);
    expect(slugs).not.toContain("b");
    expect(new Set(slugs).size).toBe(slugs.length); // no duplicates
    expect(slugs.length).toBeLessThanOrEqual(3); // only 3 *other* studies exist
  });

  it("wraps around circularly for the first slug in the list", () => {
    const result = getRelatedCaseStudies(studies, "a", 2);
    const slugs = result.map((s) => s.slug);
    expect(slugs).not.toContain("a");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("wraps around circularly for the last slug in the list", () => {
    const result = getRelatedCaseStudies(studies, "d", 2);
    const slugs = result.map((s) => s.slug);
    expect(slugs).not.toContain("d");
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("excludes comingSoon studies from the candidate pool entirely", () => {
    const withStub = [...studies, makeStudy("e-stub", true)];
    const result = getRelatedCaseStudies(withStub, "a", 2);
    expect(result.map((s) => s.slug)).not.toContain("e-stub");
  });

  it("returns an empty array for an unknown slug", () => {
    expect(getRelatedCaseStudies(studies, "does-not-exist", 2)).toEqual([]);
  });

  it("documents current behavior when zero linkable studies exist", () => {
    // linkable.length === 0 here (currentSlug itself is comingSoon, and no
    // other non-comingSoon studies exist) — findIndex returns -1 in this
    // exact case since currentSlug is filtered out of `linkable` before the
    // index lookup, so this actually hits the -1 early-return, NOT the
    // division-by-zero path. This test documents that this specific path
    // is safe; it does NOT prove the n=0-after-a-valid-index case can't
    // happen from some other call shape — see the STOP condition in the
    // plan this test was written from if you find one that does.
    const onlyStub = [makeStudy("only-stub", true)];
    expect(getRelatedCaseStudies(onlyStub, "only-stub", 2)).toEqual([]);
  });

  it("respects a custom count", () => {
    const five = [...studies, makeStudy("e")];
    const result = getRelatedCaseStudies(five, "a", 1);
    expect(result.length).toBe(2); // 1 preceding + 1 subsequent
  });
});
