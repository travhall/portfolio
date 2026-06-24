/**
 * Desktop/mobile column-layout threshold, shared by the FeatureWipe scroll
 * logic and the CSS breakpoints it must stay in sync with. CSS media and
 * container queries cannot read a CSS custom property inside their feature
 * test, so this value is duplicated by necessity — every sibling location
 * is listed below. If you change this number, change all of them.
 *
 * Siblings (all must match this value, expressed as max-width = value - 1):
 *   - app/layout.css   .header-spacer  @media (max-width: 899px)
 *   - app/layout.css   .intro-section  @media (max-width: 899px)
 *   - app/layout.css   .fw-section     @container fw-section (max-width: 899px)
 *   - app/layout.css   .about-body / .about-cta  @media (max-width: 899px)
 */
export const DESKTOP_BP = 900;
