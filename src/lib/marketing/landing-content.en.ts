import type { LandingContent } from "@/lib/marketing/landing-content.types";
export const EN_CONTENT: LandingContent = {
  header: {
    tagline: "Entro Ethiopia",
    contentLanguageLabel: "Language",
    nav: [
      { href: "#overview", label: "Overview" },
      { href: "#demos", label: "Demos" },
      { href: "#experience", label: "Experience" },
      { href: "#ai", label: "AI" },
      { href: "#coverage", label: "Coverage" },
      { href: "#portals", label: "Portals" },
      { href: "#features", label: "Modules" },
      { href: "#pricing", label: "Pricing" },
      { href: "#contact", label: "Contact" },
    ],
    signIn: "Sign in",
    dashboard: "Dashboard",
    openDashboard: "Open dashboard",
    bookWalkthrough: "Book a walkthrough",
    scheduleCall: "Schedule a call",
    openPortal: "Open your portal",
    signInToSchool: "Sign in to your school",
    mobileMenuOpen: "Open menu",
    mobileMenuClose: "Close menu",
    parentDraftsNote: "Parent drafts available in English & Amharic",
  },
  hero: {
    eyebrow: "School management · KG–12",
    titleLine1: "Your whole school,",
    titleLine2: "one calm workspace",
    lead: "Enrollment, attendance, fees, report cards, inventory, facility inspections, and parent updates — connected for administrators, teachers, and families across every branch.",
    bullets: [
      "Dedicated portal for every role — including store & compliance",
      "Multi-branch from a single central office",
      "Inventory, procurement, and inspection checklists built in",
    ],
    cardBranch: "Monday · Addis branch",
    cardView: "Staff morning view",
    todayLabel: "Today",
    highlights: [
      { title: "Academics", desc: "Grades & transcripts" },
      { title: "Finance", desc: "Fees & payments" },
      { title: "Inventory", desc: "Stock & assets" },
      { title: "Inspection", desc: "Facility compliance" },
    ],
    todayItems: [
      { title: "3 items below minimum stock", desc: "Store manager alerted · reorder pending" },
      { title: "Inspection checklist 78% complete", desc: "Branch admin review due Friday" },
      { title: "Grade 8B — attendance slipping", desc: "Homeroom teacher notified" },
    ],
    sceneCards: [
      {
        illustration: "attendance",
        label: "Attendance",
        alt: "Daily attendance register with present and absent markers",
      },
      {
        illustration: "parents",
        label: "Parent updates",
        alt: "Parent notification drafts on mobile in English and Amharic",
      },
    ],
    gallery: [
      {
        illustration: "classroom",
        title: "Teacher portal",
        alt: "Teacher at smartboard with student roster and mark entry",
      },
      {
        illustration: "grades",
        title: "Report cards",
        alt: "Digital report card with subject grades and GPA",
      },
      {
        illustration: "finance",
        title: "Fees & finance",
        alt: "Tuition invoice with payment status and reminders",
      },
      {
        illustration: "attendance",
        title: "Attendance",
        alt: "Class attendance tracking dashboard",
      },
    ],
  },
  stats: {
    items: [
      { value: "12+", label: "Integrated modules" },
      { value: "KG–12", label: "Grade coverage" },
      { value: "2", label: "Languages" },
      { value: "∞", label: "Branches supported" },
    ],
  },
  trust: {
    label: "Built for schools across Ethiopia",
    items: [
      "Private & international schools",
      "Multi-branch networks",
      "Central office oversight",
      "Ministry-ready exports",
      "Inventory & facility inspection tools",
    ],
  },
  portalDemos: {
    eyebrow: "Live demos",
    title: "One platform, five dedicated portals",
    lead: "Each role gets its own dashboard — switch tabs to preview what admins, teachers, and families see after sign-in.",
    demos: [
      {
        id: "school",
        label: "School admin",
        title: "Central office command center",
        description:
          "Cross-branch enrollment, collections, and settings — the view super admins use to run the whole network.",
        stats: [
          { label: "Branches", value: "All live" },
          { label: "Enrollment", value: "2,840" },
          { label: "Collections", value: "94%" },
        ],
        highlights: [
          "Multi-branch KPI dashboard",
          "Global policies & audit logs",
          "PDF / Excel exports for leadership",
        ],
      },
      {
        id: "registrar",
        label: "Registrar",
        title: "Enrollment & records desk",
        description:
          "Register students, issue ID cards, and keep transcripts ready — without duplicate spreadsheets.",
        stats: [
          { label: "Pending", value: "18 apps" },
          { label: "This term", value: "412 enrolled" },
          { label: "ID cards", value: "Ready" },
        ],
        highlights: [
          "Student & staff onboarding",
          "Transcript export",
          "Parent account linking",
        ],
      },
      {
        id: "teacher",
        label: "Teacher",
        title: "Classroom workspace",
        description:
          "Attendance, weekly marks, and rosters in one place — grades flow to report cards automatically.",
        stats: [
          { label: "Classes", value: "5 sections" },
          { label: "Today", value: "3 sessions" },
          { label: "Marks due", value: "1 class" },
        ],
        highlights: [
          "Daily & weekly attendance",
          "Weighted grading",
          "Parent message drafts",
        ],
      },
      {
        id: "parent",
        label: "Parent",
        title: "Family updates hub",
        description:
          "Fees, results, and attendance for every linked child — on phone, without calling the office.",
        stats: [
          { label: "Children", value: "2 linked" },
          { label: "Fees due", value: "4,200 ETB" },
          { label: "Alerts", value: "3 new" },
        ],
        highlights: [
          "Fee balance & payment history",
          "Report cards & attendance",
          "English & Amharic message drafts",
        ],
      },
      {
        id: "student",
        label: "Student",
        title: "Personal academic portal",
        description:
          "Timetable, grades, announcements, and study tools — students stay on track between terms.",
        stats: [
          { label: "GPA", value: "3.72" },
          { label: "Classes", value: "8 today" },
          { label: "Library", value: "2 books" },
        ],
        highlights: [
          "Personal timetable",
          "Grades & transcripts",
          "Study companion",
        ],
      },
    ],
  },
  workflow: {
    eyebrow: "Get started",
    title: "Live in three clear steps",
    lead: "From registration to your first branch going live — the same onboarding flow schools use on EduSync today.",
    steps: [
      {
        step: "01",
        title: "Register your school",
        description:
          "Submit your school profile online. Our team reviews and activates your workspace — usually within one business day.",
      },
      {
        step: "02",
        title: "Configure branches & roles",
        description:
          "Add branches, grade bands, and staff accounts. Registrars enroll students; each role lands in the right portal.",
      },
      {
        step: "03",
        title: "Staff & families sign in",
        description:
          "Teachers mark attendance, finance tracks fees, and parents see updates — all from the same student records.",
      },
    ],
  },
  experience: {
    eyebrow: "Experience",
    title: "Designed for how schools actually run",
    lead: "Administrators, teachers, finance, HR, store managers, and families each get a workspace that fits their job — all tied to the same student records and operational data.",
    inPractice: "In practice",
    outcomesEyebrow: "What you gain",
    experiences: [
      {
        id: "leadership",
        label: "Leadership",
        title: "Every branch, one clear picture",
        description:
          "Compare enrollment, attendance, and fees without chasing spreadsheets. Pull monthly summaries when leadership or the board needs them.",
        metrics: [
          { label: "Branches", value: "Unified view" },
          { label: "Reports", value: "On demand" },
          { label: "Audit", value: "Full trail" },
        ],
        actions: [
          "Enrollment and collections per branch in one dashboard.",
          "Track inventory levels, purchase orders, and low-stock alerts.",
          "Run facility inspection checklists with evidence and export-ready reports.",
          "Export-ready data for ministry or board meetings.",
        ],
      },
      {
        id: "teachers",
        label: "Teachers",
        title: "Marks once. Reports follow.",
        description:
          "Attendance, grading, and parent updates from one workspace — no copying between notebooks and Excel.",
        metrics: [
          { label: "Classes", value: "Your roster" },
          { label: "Attendance", value: "Daily" },
          { label: "Reports", value: "Automatic" },
        ],
        actions: [
          "Grades flow into report cards and parent portals.",
          "See absences stacking up before they become a pattern.",
          "Draft parent messages; you send when ready.",
        ],
      },
      {
        id: "families",
        label: "Families",
        title: "Parents stay informed",
        description:
          "Attendance, results, fees, and library activity — on their phone, without calling the office every week.",
        metrics: [
          { label: "Parents", value: "All children" },
          { label: "Students", value: "Self-service" },
          { label: "Content language", value: "English & Amharic" },
        ],
        actions: [
          "Fee balance and payment history at a glance.",
          "Schedules, assignments, and transcripts for students.",
          "Parent drafts in English and Amharic.",
        ],
      },
    ],
    outcomes: [
      {
        title: "Early alerts",
        description: "Grades and attendance together flag students who need a conversation.",
      },
      {
        title: "Monthly summaries",
        description: "Leadership gets a readable month-end picture without manual compilation.",
      },
      {
        title: "Attendance flow",
        description: "Absences visible to staff and families before they escalate.",
      },
      {
        title: "Operations control",
        description: "Stock, assets, procurement, and facility inspection scores in one place.",
      },
      {
        title: "One record",
        description: "GPA, transcripts, fees, and audit logs share the same student profile.",
      },
      {
        title: "Parent messages",
        description: "Draft updates in English and Amharic content language — you review first.",
      },
    ],
  },
  ai: {
    eyebrow: "AI-powered school support",
    title: "Practical AI where it helps",
    titleHighlight: "teachers, students, and leaders",
    lead: "AI in EduSync SMS is a support layer — not a replacement for educators. Teachers plan faster, students get guided study help, leaders generate executive monthly reports, and staff draft clear parent messages. Your team always reviews before anything goes out.",
    capabilities: [
      {
        title: "AI Study Tutor",
        description:
          "Student-facing tutor for guided explanations, learning help, and context-aware study conversations.",
      },
      {
        title: "AI Lesson Planner",
        description:
          "Draft objectives, activities, assessments, and differentiated support by grade and subject — edit before you teach.",
      },
      {
        title: "Performance analytics",
        description:
          "Grades and attendance combined to flag at-risk students early for homeroom follow-up.",
      },
      {
        title: "AI monthly report",
        description:
          "Executive summaries combining enrollment, academics, attendance, finance, and branch performance.",
      },
      {
        title: "Smart parent messages",
        description:
          "Tone-aware draft updates for progress, attendance alerts, and fee reminders — English and Amharic.",
      },
    ],
  },
  tools: {
    eyebrow: "Tools",
    title: "Time saved — people stay in charge",
    lead: "Optional assistants help teachers plan, students study, and leadership report. Your team always reviews before anything goes to a parent or student.",
    helpfulTools: [
      {
        title: "Study companion",
        description:
          "Guided explanations for students — teachers stay in control of what reaches the classroom.",
      },
      {
        title: "Lesson planning",
        description:
          "Draft objectives, activities, and assessments by grade and subject. Edit before you teach.",
      },
      {
        title: "Performance insights",
        description:
          "Grades and attendance combined to highlight students who may need a homeroom conversation.",
      },
      {
        title: "Monthly summary",
        description: "Enrollment, academics, attendance, and finance in one leadership-ready report.",
      },
      {
        title: "Message drafts",
        description:
          "Clear parent updates for fees, attendance, or progress — in English and Amharic content language.",
      },
    ],
    coverageEyebrow: "Coverage",
    coverageTitle: "Full platform coverage",
    coverageLead: "Registrar, finance, library, inventory, inspection, HR, and family portals — not just assistants.",
    coverageItems: [
      "Multi-branch dashboards for central office",
      "Enrollment, records, ID cards, and transcripts",
      "Teacher rosters, grading, and attendance",
      "Fees, payments, receipts, and finance reports",
      "Library catalog, loans, reservations, and fines",
      "Inventory — stock, assets, procurement, requests & alerts",
      "Facility inspection checklists — scoring, evidence & exports",
      "HR, payroll, leave, and recruitment",
      "Parent and student portals (English & Amharic message drafts)",
      "Role-based access and audit logs",
    ],
  },
  structure: {
    eyebrow: "Structure",
    title: "Organized around roles and grade levels",
    lead: "Central office oversees branches. Each branch runs day-to-day work through dedicated portals for staff, teachers, and families.",
    centralOffice: {
      subtitle: "Super Admin · system-wide control",
      title: "Central Office",
      description:
        "Cross-branch dashboards, global settings, audit logs, and consolidated exports for leadership.",
      capabilities: [
        "All branches & enrollment",
        "Global settings & policies",
        "Audit trail & compliance",
        "PDF / Excel / CSV exports",
      ],
    },
    branchStaffHeading: "Branch staff",
    branchStaffLabels: [
      "Branch Admin",
      "Registrar",
      "Teacher",
      "Finance Officer",
      "Librarian",
      "Store Manager",
      "HR Officer",
    ],
    gradeBandsHeading: "Grade bands",
    academicLayers: [
      { label: "Grade bands", detail: "KG · Primary 1–5 · Junior 6–8 · Senior 9–12" },
      { label: "Classes", detail: "Sections per branch & academic year" },
      { label: "Homeroom", detail: "One teacher per section" },
      { label: "Students", detail: "Roster, attendance, assessments" },
    ],
    familyPortalsHeading: "Family portals",
    familyRoles: [
      { label: "Parent", description: "Fees, results, attendance for linked children" },
      { label: "Student", description: "Personal timetable, grades, announcements" },
    ],
    orgMapPrefix: "Signed-in admins can view the",
    orgMapLink: "live organization map",
  },
  portals: {
    eyebrow: "Portals",
    title: "Each role opens the tools they need",
    lead: "After sign-in, users land in a workspace matched to their job — registrar, teacher, parent, and so on.",
    centralOfficeHeading: "Central office",
    branchStaffHeading: "Branch staff",
    familiesHeading: "Families",
    central: {
      label: "Super Admin",
      description: "Central office — all branches, settings, audit",
    },
    branchStaff: [
      { label: "Branch Admin", description: "Branch KPIs, staff, classes, registrar approvals" },
      { label: "Registrar", description: "Enroll students, staff, and parent accounts" },
      { label: "Teacher", description: "Grading, weekly attendance, class rosters" },
      { label: "Finance Officer", description: "Semester fees, payments, financial reports" },
      { label: "Librarian", description: "Catalog, issue/return, fines" },
      { label: "Store Manager", description: "Inventory, stock, assets & procurement" },
      { label: "HR Officer", description: "Employees, payroll, leave, recruitment" },
    ],
    family: [
      { label: "Parent", description: "Fees, results, attendance for linked children" },
      { label: "Student", description: "Personal timetable, grades, announcements" },
    ],
    registerPrefix: "New staff?",
    registerLink: "Apply through your school's registration page",
  },
  programs: {
    eyebrow: "Programs",
    title: "KG through Grade 12",
    lead: "One platform that adapts to each stage — from kindergarten routines to senior transcripts.",
    items: [
      {
        title: "Kindergarten",
        grades: "KG",
        desc: "Simple routines, picture books, and early progress parents can follow.",
      },
      {
        title: "Primary",
        grades: "Grades 1–5",
        desc: "Subject grading, reading habits, and parent updates in English and Amharic.",
      },
      {
        title: "Junior High",
        grades: "Grades 6–8",
        desc: "Assessment trends and attendance follow-up before gaps widen.",
      },
      {
        title: "Senior High",
        grades: "Grades 9–12",
        desc: "Streams, exam prep, transcripts, GPA, and graduation reporting.",
      },
    ],
  },
  modules: {
    eyebrow: "Modules",
    title: "One student record, every department",
    lead: "Academic, attendance, finance, library, inventory, inspection, HR, and AI — one student record every department shares.",
    items: [
      {
        id: "academic",
        title: "Academic",
        description: "KG–12 teaching & assessment",
        items: ["Weighted grading", "Report cards", "GPA & transcripts"],
      },
      {
        id: "attendance",
        title: "Attendance",
        description: "Daily & weekly tracking",
        items: ["Weekly sheet", "Daily summary", "Parent visibility"],
      },
      {
        id: "finance",
        title: "Finance",
        description: "Tuition & collections",
        items: ["Semester fees", "Payment plans", "Outstanding balance"],
      },
      {
        id: "library",
        title: "Library",
        description: "Resources & circulation",
        items: ["Catalog", "Issue / return", "Fines"],
      },
      {
        id: "analytics",
        title: "Analytics",
        description: "Early warning & leadership insight",
        items: ["At-risk flags", "Dropout warning", "Intervention suggestions"],
      },
      {
        id: "communication",
        title: "Communication",
        description: "Family-ready updates in English & Amharic",
        items: ["Parent drafts", "English & Amharic content", "WhatsApp / Telegram"],
      },
      {
        id: "ai",
        title: "AI",
        description: "Optional assistants for students, teachers, and leadership",
        items: [
          "AI Study Tutor",
          "AI Lesson Planner",
          "Performance analytics & at-risk flags",
          "AI monthly executive reports",
          "Smart parent message drafts (English & Amharic)",
        ],
      },
      {
        id: "registrar",
        title: "Registrar",
        description: "Student records and onboarding",
        items: ["Enrollment", "ID cards", "Transcript export"],
      },
      {
        id: "hr",
        title: "Human resources",
        description: "People operations for schools",
        items: ["Payroll", "Leave", "Recruitment"],
      },
      {
        id: "inventory",
        title: "Inventory",
        description: "Stock, assets & procurement",
        items: ["Multi-location stock", "Asset assignment", "Purchase orders & alerts"],
      },
      {
        id: "inspection",
        title: "Inspection",
        description: "Facility compliance checklists",
        items: ["Criterion scoring", "Photo evidence", "PDF / CSV export"],
      },
      {
        id: "security",
        title: "Security",
        description: "Role-based system protection",
        items: ["NextAuth", "RBAC", "Audit logs"],
      },
    ],
  },
  pricing: {
    eyebrow: "Pricing",
    title: "Plans that fit your school",
    lead: "Register online — Starter includes your first month free at 30 ETB per student. Upgrade to Growth for full AI support at 50 ETB per student per month.",
    recommended: "Recommended",
    plans: [
      {
        name: "Starter",
        tagline: "Single school getting organized",
        promoBadge: "1 month free",
        price: "30 ETB",
        priceNote: "1st month free · then per student / month",
        ctaHref: "/register/school",
        features: [
          "First month free after approval",
          "1 branch to start, add more anytime",
          "Academics, attendance & report cards",
          "Parent & student portals",
          "Finance, library, HR, inventory & inspection",
          "Leadership dashboards & audit logs",
          "Core modules — AI not included",
          "Email support",
        ],
        cta: "Start free for 1 month",
      },
      {
        name: "Growth",
        tagline: "Multi-branch schools with AI",
        price: "50 ETB",
        priceNote: "per student / month · includes AI",
        highlighted: true,
        ctaHref: "/register/school",
        features: [
          "Everything in Starter",
          "Full AI support — tutor, lesson planner & reports",
          "Smart parent message drafts (English & Amharic)",
          "Unlimited branches after activation",
          "Finance, library, HR, inventory & inspection",
          "Leadership dashboards & audit logs",
          "Priority onboarding & support",
        ],
        cta: "Register your school",
      },
      {
        name: "Enterprise",
        tagline: "Networks & ministries",
        price: "Custom",
        priceNote: "dedicated deployment",
        features: [
          "Everything in Growth",
          "Dedicated environment",
          "Custom integrations & exports",
          "Staff training included",
          "Account manager",
        ],
        cta: "Contact us",
      },
    ],
  },
  cta: {
    eyebrow: "Next step",
    title: "See if EduSync fits your school",
    lead: "We'll walk you through the portals, answer setup questions, and share pricing for your branch count and student size.",
    signIn: "Sign in",
    contactUs: "Contact us",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Common questions from school leaders",
    items: [
      {
        question: "Does EduSync work for multi-branch schools?",
        answer:
          "Yes. Central office sees every branch from one dashboard. Each branch runs day-to-day work through its own staff portals while sharing the same student database.",
      },
      {
        question: "Which grade levels are supported?",
        answer:
          "KG through Grade 12 — kindergarten routines, primary grading, junior high follow-up, and senior transcripts with GPA and graduation reporting.",
      },
      {
        question: "Can parents receive updates in Amharic?",
        answer:
          "Parent message drafts are available in English and Amharic content language. Your staff reviews every message before it goes out.",
      },
      {
        question: "How does pricing work?",
        answer:
          "Starter is 30 ETB per student per month after your free first month — core modules without AI. Growth is 50 ETB per student per month and includes full AI support. Enterprise is custom pricing for large networks.",
      },
      {
        question: "Can we track school inventory and facility inspections?",
        answer:
          "Yes. The inventory module covers stock, assets, procurement, staff requests, and low-stock alerts. The inspection module supports facility checklists with criterion scoring, photo evidence, and export-ready reports for ministry reviews.",
      },
      {
        question: "Is our data secure?",
        answer:
          "Role-based access, audit logs, and secure sign-in protect every portal. Each user only sees the data their job requires.",
      },
    ],
  },
  footer: {
    tagline: "Entro Ethiopia",
    description:
      "School management for KG–12 — enrollment, academics, finance, library, inventory, inspection, HR, and family portals in one secure system.",
    location: "Designed and built in Ethiopia",
    linksHeading: "Links",
    signIn: "Sign in",
    staffRegistration: "Staff registration",
    pricing: "Pricing",
    modules: "Modules",
    contactHeading: "Contact",
    contactLabels: { website: "Website", phone: "Phone", email: "Email" },
    copyright: "EduSync SMS · Entro Ethiopia Software Development PLC. All rights reserved.",
    terms: "Terms",
    privacy: "Privacy",
  },
};
