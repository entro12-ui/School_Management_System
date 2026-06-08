export type HeroIllustrationId =
  | "attendance"
  | "parents"
  | "classroom"
  | "grades"
  | "finance";

export type LandingContentLanguage = "en" | "am";

export const LANDING_CONTENT_LANGUAGES: LandingContentLanguage[] = ["en", "am"];

export const LANDING_CONTENT_LANGUAGE_LABELS: Record<LandingContentLanguage, string> = {
  en: "English",
  am: "Amharic",
};

export type LandingExperienceId = "leadership" | "teachers" | "families";

export type LandingPortalDemoId =
  | "school"
  | "teacher"
  | "student"
  | "parent"
  | "registrar";

export type LandingContent = {
  header: {
    tagline: string;
    contentLanguageLabel: string;
    nav: { href: string; label: string }[];
    signIn: string;
    dashboard: string;
    openDashboard: string;
    bookWalkthrough: string;
    scheduleCall: string;
    openPortal: string;
    signInToSchool: string;
    mobileMenuOpen: string;
    mobileMenuClose: string;
    parentDraftsNote: string;
  };
  hero: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    lead: string;
    bullets: string[];
    cardBranch: string;
    cardView: string;
    todayLabel: string;
    highlights: { title: string; desc: string }[];
    todayItems: { title: string; desc: string }[];
    sceneCards: { illustration: HeroIllustrationId; label: string; alt: string }[];
    gallery: { illustration: HeroIllustrationId; title: string; alt: string }[];
  };
  stats: {
    items: { value: string; label: string }[];
  };
  trust: {
    label: string;
    items: string[];
  };
  portalDemos: {
    eyebrow: string;
    title: string;
    lead: string;
    demos: {
      id: LandingPortalDemoId;
      label: string;
      title: string;
      description: string;
      stats: { label: string; value: string }[];
      highlights: string[];
    }[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    lead: string;
    steps: { step: string; title: string; description: string }[];
  };
  experience: {
    eyebrow: string;
    title: string;
    lead: string;
    inPractice: string;
    outcomesEyebrow: string;
    experiences: {
      id: LandingExperienceId;
      label: string;
      title: string;
      description: string;
      metrics: { label: string; value: string }[];
      actions: string[];
    }[];
    outcomes: { title: string; description: string }[];
  };
  tools: {
    eyebrow: string;
    title: string;
    lead: string;
    helpfulTools: { title: string; description: string }[];
    coverageEyebrow: string;
    coverageTitle: string;
    coverageLead: string;
    coverageItems: string[];
  };
  structure: {
    eyebrow: string;
    title: string;
    lead: string;
    centralOffice: {
      subtitle: string;
      title: string;
      description: string;
      capabilities: string[];
    };
    branchStaffHeading: string;
    branchStaffLabels: string[];
    gradeBandsHeading: string;
    academicLayers: { label: string; detail: string }[];
    familyPortalsHeading: string;
    familyRoles: { label: string; description: string }[];
    orgMapPrefix: string;
    orgMapLink: string;
  };
  portals: {
    eyebrow: string;
    title: string;
    lead: string;
    centralOfficeHeading: string;
    branchStaffHeading: string;
    familiesHeading: string;
    central: { label: string; description: string };
    branchStaff: { label: string; description: string }[];
    family: { label: string; description: string }[];
    registerPrefix: string;
    registerLink: string;
  };
  programs: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { title: string; grades: string; desc: string }[];
  };
  modules: {
    eyebrow: string;
    title: string;
    lead: string;
    items: { id: string; title: string; description: string; items: string[] }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    lead: string;
    recommended: string;
    plans: {
      name: string;
      tagline: string;
      price: string;
      priceNote: string;
      promoBadge?: string;
      highlighted?: boolean;
      features: string[];
      cta: string;
      ctaHref?: string;
    }[];
  };
  cta: {
    eyebrow: string;
    title: string;
    lead: string;
    signIn: string;
    contactUs: string;
  };
  faq: {
    eyebrow: string;
    title: string;
    items: { question: string; answer: string }[];
  };
  footer: {
    tagline: string;
    description: string;
    location: string;
    linksHeading: string;
    signIn: string;
    staffRegistration: string;
    pricing: string;
    modules: string;
    contactHeading: string;
    contactLabels: { website: string; phone: string; email: string };
    copyright: string;
    terms: string;
    privacy: string;
  };
};
