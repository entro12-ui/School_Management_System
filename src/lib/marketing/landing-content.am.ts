import type { LandingContent } from "@/lib/marketing/landing-content.types";

export const AM_CONTENT: LandingContent = {
  header: {
    tagline: "Entro Ethiopia",
    contentLanguageLabel: "የይዘት ቋንቋ",
    nav: [
      { href: "#overview", label: "አጠቃላይ እይታ" },
      { href: "#experience", label: "ተሞክሮ" },
      { href: "#tools", label: "መሳሪያዎች" },
      { href: "#portals", label: "መግቢያዎች" },
      { href: "#features", label: "ሞጁሎች" },
      { href: "#pricing", label: "ዋጋ" },
      { href: "#contact", label: "ማግኛ" },
    ],
    signIn: "ግባ",
    dashboard: "ዳሽቦርድ",
    openDashboard: "ዳሽቦርድ ክፈት",
    bookWalkthrough: "ማሳያ ይዘዙ",
    scheduleCall: "ጥሪ ይዘዙ",
    openPortal: "መግቢያዎን ክፈት",
    signInToSchool: "ወደ ትምህርት ቤትዎ ግቡ",
    mobileMenuOpen: "ምናሌ ክፈት",
    mobileMenuClose: "ምናሌ ዝጋ",
    parentDraftsNote: "የወላጅ ረቂቆች በእንግሊዝኛ እና በአማርኛ ይገኛሉ",
  },
  hero: {
    eyebrow: "የትምህርት ቤት አስተዳደር · KG–12",
    titleLine1: "መላ ትምህርት ቤትዎ፣",
    titleLine2: "አንድ ሰላማዊ የስራ ቦታ",
    lead: "ምዝገባ፣ ቅጥያ፣ ክፍያ፣ የውጤት ካርድ እና የወላጅ ማሳወቂያ — ለአስተዳዳሪዎች፣ መምህራን እና ቤተሰቦች በሁሉም ቅርንጫፎች የተገናኘ።",
    bullets: [
      "ለእያንዳንዱ ሚና ልዩ መግቢያ",
      "ከአንድ ማዕከላዊ ቢሮ ብዙ ቅርንጫፎች",
      "የወላጅ መልዕክት ረቂቆች በእንግሊዝኛ እና በአማርኛ የይዘት ቋንቋ",
    ],
    cardBranch: "ሰኞ · የአዲስ ቅርንጫፍ",
    cardView: "የሰራተኞች የጠዋት እይታ",
    todayLabel: "ዛሬ",
    highlights: [
      { title: "ትምህርት", desc: "ውጤቶች እና ትራንስክሪፕት" },
      { title: "ፋይናንስ", desc: "ክፍያዎች እና ገንዘብ" },
      { title: "ቤተ-መጽሐፍት", desc: "ካታሎግ እና ብድር" },
      { title: "ቅጥያ", desc: "ዕለታዊ መዝገቦች" },
    ],
    todayItems: [
      { title: "8ኛ ቢ — ቅጥያ እየቀነሰ ነው", desc: "የክፍል መምህር ተሳተፈ" },
      { title: "12 የክፍያ ማስታወሻዎች ለመላክ ዝግጁ", desc: "ፋይናንስ መጀመሪያ ማረጋገጥ ይችላል" },
      { title: "4 ክፍሎች አሁንም ሳምንታዊ ውጤት ይፈልጋሉ", desc: "በመምህር ዳሽቦርድ ላይ ይታያል" },
    ],
  },
  experience: {
    eyebrow: "ተሞክሮ",
    title: "ትምህርት ቤቶች እንዴት እንደሚሰሩ ተዘጋጅቷል",
    lead: "አስተዳዳሪዎች፣ መምህራን፣ ፋይናንስ፣ HR፣ የቤተ-መጽሐፍት ሰራተኞች እና ቤተሰቦች ለስራቸው የሚስማማ የስራ ቦታ ያገኛሉ — ሁሉም በተመሳሳይ የተማሪ መዝገቦች ላይ የተገናኙ።",
    inPractice: "በተግባር",
    experiences: [
      {
        id: "leadership",
        label: "አመራር",
        title: "ሁሉም ቅርንጫፍ፣ አንድ ግልጽ ምስል",
        description:
          "ምዝገባ፣ ቅጥያ እና ክፍያዎችን ያለ ስፕሬድሺት ማሳያ ማወዳደር። አመራር ወይም ቦርድ ሲፈልጉ ወርሃዊ ማጠቃለያ ማውጣት።",
        metrics: [
          { label: "ቅርንጫፎች", value: "አንድ የተጣመረ እይታ" },
          { label: "ሪፖርቶች", value: "በፍላጎት" },
          { label: "ኦዲት", value: "ሙሉ ተከታታይ" },
        ],
        actions: [
          "በአንድ ዳሽቦርድ ላይ በቅርንጫፍ ምዝገባ እና ገቢ።",
          "የተከታተል ፍላጎት ያላቸው ተማሪዎች ውጤት ከመቀነስ በፊት ይታያሉ።",
          "ለሚኒስትሪ ወይም ቦርድ ስብሰባ የሚላኩ ውሂቦች።",
        ],
      },
      {
        id: "teachers",
        label: "መምህራን",
        title: "አንዴ ውጤት። ሪፖርቶች ይከተላሉ።",
        description:
          "ቅጥያ፣ ውጤት እና የወላጅ ማሳወቂያ ከአንድ የስራ ቦታ — ከኖትቡክ ወደ Excel መቅዳት የለም።",
        metrics: [
          { label: "ክፍሎች", value: "የእርስዎ ዝርዝር" },
          { label: "ቅጥያ", value: "ዕለታዊ" },
          { label: "ሪፖርቶች", value: "ራስ-ሰር" },
        ],
        actions: [
          "ውጤቶች ወደ የውጤት ካርድ እና የወላጅ መግቢያ ይሄዳሉ።",
          "ጥፋት ከመደረግ በፊት ተከማችቷል ብለው ይታያል።",
          "የወላጅ መልዕክቶችን ይጻፉ፤ ዝግጁ ሲሆኑ ይላኩ።",
        ],
      },
      {
        id: "families",
        label: "ቤተሰቦች",
        title: "ወላጆች መረጃ ይኖራቸዋል",
        description:
          "ቅጥያ፣ ውጤት፣ ክፍያ እና የቤተ-መጽሐፍት እንቅስቃሴ — በስልካቸው ላይ፣ በየሳምንቱ ቢሮ ሳይደውሉ።",
        metrics: [
          { label: "ወላጆች", value: "ሁሉም ልጆች" },
          { label: "ተማሪዎች", value: "ራስ-ሰር" },
          { label: "የይዘት ቋንቋ", value: "እንግሊዝኛ እና አማርኛ" },
        ],
        actions: [
          "የክፍያ ቀሪ እና የክፍያ ታሪክ በአንድ ቅጽበት።",
          "ለተማሪዎች መርሃ-ግብር፣ ተግባሮች እና ትራንስክሪፕት።",
          "የወላጅ ረቂቆች በእንግሊዝኛ እና በአማርኛ።",
        ],
      },
    ],
    outcomes: [
      {
        title: "ቅድመ ማስጠንቀቂያዎች",
        description: "ውጤት እና ቅጥያ በአንድ ላይ ለውይይት የሚፈልጉ ተማሪዎችን ያመለክታሉ።",
      },
      {
        title: "ወርሃዊ ማጠቃለያ",
        description: "አመራር በእጅ ማጠቃለያ ሳይፈልግ የሚነበብ የወር መጨረሻ ምስል ያገኛል።",
      },
      {
        title: "የቅጥያ ፍሰት",
        description: "ጥፋቶች ከመጨመር በፊት ለሰራተኞች እና ቤተሰቦች ይታያሉ።",
      },
      {
        title: "አንድ መዝገብ",
        description: "GPA፣ ትራንስክሪፕት እና ክፍያዎች ተመሳሳይ የተማሪ መገለጫ ያጋራሉ።",
      },
      {
        title: "የወላጅ መልዕክቶች",
        description: "ማሳወቂያ ረቂቆች በእንግሊዝኛ እና በአማርኛ የይዘት ቋንቋ — መጀመሪያ እርስዎ ይገምግሙ።",
      },
    ],
  },
  tools: {
    eyebrow: "መሳሪያዎች",
    title: "ጊዜ ተቆጥቷል — ሰዎች ቁጥጥር ላይ ይቆያሉ",
    lead: "አማራጭ ረዳቶች መምህራን እንዲያቅዱ፣ ተማሪዎች እንዲማሩ እና አመራር እንዲሪፖርት ይረዳሉ። ለወላጅ ወይም ተማሪ ከመላክ በፊት ቡድንዎ ሁልጊዜ ይገምግማል።",
    helpfulTools: [
      {
        title: "የመማሪያ ተጋሩ",
        description:
          "ለተማሪዎች የተመራ ማብራሪያ — መምህራን ወደ ክፍል የሚደርሰውን ይቆጣጠራሉ።",
      },
      {
        title: "የትምህርት እቅድ",
        description:
          "በክፍል እና በትምህርት መምሪያ ዓላማዎች፣ እንቅስቃሴዎች እና ግምገማዎችን ይጻፉ። ከመማር በፊት ያርትዑ።",
      },
      {
        title: "የአፈጻጸም ግንዛቤ",
        description:
          "ውጤት እና ቅጥያ ተጣምረው የክፍል መምህር ውይይት ሊያስፈልጋቸው የሚችሉ ተማሪዎችን ያብራራሉ።",
      },
      {
        title: "ወርሃዊ ማጠቃለያ",
        description: "ምዝገባ፣ ትምህርት፣ ቅጥያ እና ፋይናንስ በአንድ ለአመራር የተዘጋጀ ሪፖርት።",
      },
      {
        title: "የመልዕክት ረቂቆች",
        description:
          "ለክፍያ፣ ቅጥያ ወይም እድገት ግልጽ የወላጅ ማሳወቂያ — በእንግሊዝኛ እና በአማርኛ የይዘት ቋንቋ።",
      },
    ],
    coverageTitle: "ሙሉ የመድረክ ሽፋን",
    coverageLead: "ምዝገባ፣ ፋይናንስ፣ ቤተ-መጽሐፍት፣ HR እና የቤተሰብ መግቢያዎች — ረዳቶች ብቻ አይደሉም።",
    coverageItems: [
      "ለማዕከላዊ ቢሮ ብዙ ቅርንጫፍ ዳሽቦርዶች",
      "ምዝገባ፣ መዝገቦች፣ መታወቂያ ካርድ እና ትራንስክሪፕት",
      "የመምህር ዝርዝር፣ ውጤት እና ቅጥያ",
      "ክፍያዎች፣ ገንዘብ፣ ደረሰኞች እና የፋይናንስ ሪፖርቶች",
      "የቤተ-መጽሐፍት ካታሎግ፣ ብድር፣ ማስያዝ እና ቅጣት",
      "HR፣ ደመወዝ፣ ፈቃድ እና ምልመና",
      "የወላጅ እና የተማሪ መግቢያዎች (እንግሊዝኛ እና አማርኛ የመልዕክት ረቂቆች)",
      "በሚና የተመሰረተ መዳረሻ እና ኦዲት መዝገቦች",
    ],
  },
  structure: {
    eyebrow: "መዋቅር",
    title: "በሚናዎች እና በክፍል ደረጃዎች የተደራጀ",
    lead: "ማዕከላዊ ቢሮ ቅርንጫፎችን ይቆጣጠራል። እያንዳንዱ ቅርንጫፍ ለሰራተኞች፣ መምህራን እና ቤተሰቦች ልዩ መግቢያዎች በዕለታዊ ስራ ይሰራል።",
    centralOffice: {
      subtitle: "Super Admin · በሁሉም ስርዓት ቁጥጥር",
      title: "ማዕከላዊ ቢሮ",
      description:
        "በቅርንጫፍ መካከል ዳሽቦርዶች፣ ዓለም አቀፍ ቅንብሮች፣ ኦዲት መዝገቦች እና ለአመራር የተጣመሩ ማስረከቢያዎች።",
      capabilities: [
        "ሁሉም ቅርንጫፎች እና ምዝገባ",
        "ዓለም አቀፍ ቅንብሮች እና ፖሊሲዎች",
        "ኦዲት ተከታታይ እና ተገዢነት",
        "PDF / Excel / CSV ማስረከቢያ",
      ],
    },
    branchStaffHeading: "የቅርንጫፍ ሰራተኞች",
    branchStaffLabels: [
      "Branch Admin",
      "Registrar",
      "Teacher",
      "Finance Officer",
      "Librarian",
      "HR Officer",
    ],
    gradeBandsHeading: "የክፍል ቡድኖች",
    academicLayers: [
      { label: "የክፍል ቡድኖች", detail: "KG · መጀመሪያ 1–5 · ጁኒየር 6–8 · ሲኒየር 9–12" },
      { label: "ክፍሎች", detail: "በቅርንጫፍ እና በትምህርት ዓመት ክፍሎች" },
      { label: "የክፍል መምህር", detail: "በክፍል አንድ መምህር" },
      { label: "ተማሪዎች", detail: "ዝርዝር፣ ቅጥያ፣ ግምገማ" },
    ],
    familyPortalsHeading: "የቤተሰብ መግቢያዎች",
    familyRoles: [
      { label: "ወላጅ", description: "ለተገናኙ ልጆች ክፍያ፣ ውጤት እና ቅጥያ" },
      { label: "ተማሪ", description: "የግል መርሃ-ግብር፣ ውጤት እና ማስታወቂያዎች" },
    ],
    orgMapPrefix: "የገቡ አስተዳዳሪዎች የሚከተለውን ማየት ይችላሉ",
    orgMapLink: "ቀጥታ የድርጅት ካርታ",
  },
  portals: {
    eyebrow: "መግቢያዎች",
    title: "እያንዳንዱ ሚና የሚፈልገውን መሳሪያ ይከፍታል",
    lead: "ከመግባት በኋላ ተጠቃሚዎች ለስራቸው የሚስማማ የስራ ቦታ ይገባሉ — ምዝገባ፣ መምህር፣ ወላጅ እና ሌሎች።",
    centralOfficeHeading: "ማዕከላዊ ቢሮ",
    branchStaffHeading: "የቅርንጫፍ ሰራተኞች",
    familiesHeading: "ቤተሰቦች",
    central: {
      label: "Super Admin",
      description: "ማዕከላዊ ቢሮ — ሁሉም ቅርንጫፍ፣ ቅንብሮች፣ ኦዲት",
    },
    branchStaff: [
      { label: "Branch Admin", description: "የቅርንጫፍ KPI፣ ሰራተኞች፣ ክፍሎች፣ የምዝገባ ማጽደቅ" },
      { label: "Registrar", description: "ተማሪዎችን፣ ሰራተኞችን እና የወላጅ መለያዎችን ይመዝግቡ" },
      { label: "Teacher", description: "ውጤት፣ ሳምንታዊ ቅጥያ፣ የክፍል ዝርዝር" },
      { label: "Finance Officer", description: "የሴሚስተር ክፍያ፣ ገንዘብ፣ የፋይናንስ ሪፖርቶች" },
      { label: "Librarian", description: "ካታሎግ፣ ማስረከብ/መመለስ፣ ቅጣት" },
      { label: "HR Officer", description: "ሰራተኞች፣ ደመወዝ፣ ፈቃድ፣ ምልመና" },
    ],
    family: [
      { label: "ወላጅ", description: "ለተገናኙ ልጆች ክፍያ፣ ውጤት እና ቅጥያ" },
      { label: "ተማሪ", description: "የግል መርሃ-ግብር፣ ውጤት እና ማስታወቂያዎች" },
    ],
    registerPrefix: "አዲስ ሰራተኛ?",
    registerLink: "በትምህርት ቤትዎ የምዝገባ ገጽ ያመልክቱ",
  },
  programs: {
    eyebrow: "ፕሮግራሞች",
    title: "ከ KG እስከ 12ኛ ክፍል",
    lead: "ከኪንደርጋርተን ስራ እስከ ሲኒየር ትራንስክሪፕት ድረስ ለእያንዳንዱ ደረጃ የሚስማማ መድረክ።",
    items: [
      {
        title: "ኪንደርጋርተን",
        grades: "KG",
        desc: "ቀላል ስራዎች፣ የምስል መጽሐፍት እና ወላጆች የሚከተሉት የመጀመሪያ እድገት።",
      },
      {
        title: "መጀመሪያ",
        grades: "1–5ኛ ክፍል",
        desc: "የትምህርት ውጤት፣ የንባብ ልማት እና በእንግሊዝኛ እና በአማርኛ የወላጅ ማሳወቂያ።",
      },
      {
        title: "ጁኒየር ሃይ",
        grades: "6–8ኛ ክፍል",
        desc: "የግምገማ አዝማሚያ እና ቅጥያ ከመስፋት በፊት ተከታተል።",
      },
      {
        title: "ሲኒየር ሃይ",
        grades: "9–12ኛ ክፍል",
        desc: "የትምህርት ፈሳሽ፣ የፈተና ዝግጅት፣ ትራንስክሪፕት፣ GPA እና የምረቃ ሪፖርት።",
      },
    ],
  },
  modules: {
    eyebrow: "ሞጁሎች",
    title: "አንድ የተማሪ መዝገብ፣ ሁሉም ክፍል",
    lead: "ትምህርት፣ ቅጥያ፣ ፋይናንስ፣ ቤተ-መጽሐፍት እና HR ቡድኖች ከተመሳሳይ ውሂብ ይሰራሉ — የተለዩ ስፕሬድሺት አይደሉም።",
    items: [
      {
        id: "academic",
        title: "ትምህርት",
        description: "KG–12 ትምህርት እና ግምገማ",
        items: ["የተመነ ውጤት", "የውጤት ካርድ", "GPA እና ትራንስክሪፕት"],
      },
      {
        id: "attendance",
        title: "ቅጥያ",
        description: "ዕለታዊ እና ሳምንታዊ ተከታተል",
        items: ["ሳምንታዊ ወረቀት", "ዕለታዊ ማጠቃለያ", "የወላጅ እይታ"],
      },
      {
        id: "finance",
        title: "ፋይናንስ",
        description: "ትምህርት ክፍያ እና ገቢ",
        items: ["የሴሚስተር ክፍያ", "የክፍያ እቅድ", "ቀሪ ክፍያ"],
      },
      {
        id: "library",
        title: "ቤተ-መጽሐፍት",
        description: "መርጃዎች እና ማስተላለፍ",
        items: ["ካታሎግ", "ማስረከብ / መመለስ", "ቅጣት"],
      },
      {
        id: "analytics",
        title: "ትንታኔ",
        description: "ቅድመ ማስጠንቀቂያ እና የአመራር ግንዛቤ",
        items: ["የአደጋ ምልክት", "የመውጫ ማስጠንቀቂያ", "የጣልቃ ገብነት ምክር"],
      },
      {
        id: "communication",
        title: "ግንኙነት",
        description: "ለቤተሰብ የተዘጋጀ ማሳወቂያ በእንግሊዝኛ እና በአማርኛ",
        items: ["የወላጅ ረቂቆች", "እንግሊዝኛ እና አማርኛ ይዘት", "WhatsApp / Telegram"],
      },
      {
        id: "assistive-tools",
        title: "ጠቃሚ መሳሪያዎች",
        description: "ለሰራተኞች እና ተማሪዎች አማራጭ ረዳቶች",
        items: [
          "ለተማሪዎች የመማሪያ ተጋሩ",
          "ለመምህራን የትምህርት እቅድ ረቂቆች",
          "ለአመራር ወርሃዊ የትምህርት ቤት ማጠቃለያ",
          "የወላጅ መልዕክት ረቂቆች (እንግሊዝኛ እና አማርኛ)",
          "ከውጤት እና ቅጥያ ቅድመ ማስጠንቀቂያዎች",
        ],
      },
      {
        id: "registrar",
        title: "ምዝገባ",
        description: "የተማሪ መዝገቦች እና መጀመሪያ ምዝገባ",
        items: ["ምዝገባ", "መታወቂያ ካርድ", "ትራንስክሪፕት ማስረከቢያ"],
      },
      {
        id: "hr",
        title: "ሰው ሀብት",
        description: "ለትምህርት ቤቶች የሰው ሀብት ስራ",
        items: ["ደመወዝ", "ፈቃድ", "ምልመና"],
      },
      {
        id: "security",
        title: "ደህንነት",
        description: "በሚና የተመሰረተ የስርዓት ጥበቃ",
        items: ["NextAuth", "RBAC", "ኦዲት መዝገቦች"],
      },
    ],
  },
  pricing: {
    eyebrow: "ዋጋ",
    title: "ለትምህርት ቤትዎ የሚስማሙ እቅዶች",
    lead: "የቅርንጫፍ ብዛት እና የተማሪ ቁጥር ያጋሩ — ተጨማሪ ግዴታ ሳይኖር የተስማማ ዋጋ እንልክልዎታለን።",
    recommended: "የሚመከር",
    plans: [
      {
        name: "Starter",
        tagline: "አንድ ትምህርት ቤት ማደራጀት",
        price: "30 ብር",
        priceNote: "በተማሪ / ከፍታ በኋላ",
        ctaHref: "/register/school",
        features: [
          "1 ቅርንጫፍ ለመጀመር፣ ተጨማሪ በማንኛውም ጊዜ",
          "ትምህርት፣ ቅጥያ እና የውጤት ካርድ",
          "የወላጅ እና የተማሪ መግቢያ",
          "የኢሜይል ድጋፍ",
        ],
        cta: "ትምህርት ቤትዎን ይመዝገቡ",
      },
      {
        name: "Growth",
        tagline: "ብዙ ቅርንጫፍ ትምህርት ቤቶች",
        price: "30 ብር",
        priceNote: "በተማሪ · ከምዝገባ ጋር ይሰፋል",
        highlighted: true,
        ctaHref: "/register/school",
        features: [
          "ከفعላት በኋላ ያልተገደበ ቅርንጫፍ",
          "ፋይናንስ፣ ቤተ-መጽሐፍት እና HR ሞጁሎች",
          "የመማሪያ ተጋሩ እና የመልዕክት ረቂቆች (እንግሊዝኛ እና አማርኛ)",
          "የአመራር ዳሽቦርድ እና ኦዲት መዝገቦች",
          "ቅድሚያ የመጀመሪያ ምዝገባ እና ድጋፍ",
        ],
        cta: "ትምህርት ቤትዎን ይመዝገቡ",
      },
      {
        name: "Enterprise",
        tagline: "አውታረ መረቦች እና ሚኒስትሪዎች",
        price: "ብጁ",
        priceNote: "ልዩ መተግበሪያ",
        features: [
          "በ Growth ውስጥ ያለው ሁሉ",
          "ልዩ አካባቢ",
          "ብጁ ቅንብር እና ማስረከቢያ",
          "የሰራተኞች ስልጠና ተካትቷል",
          "የመለያ አስተዳዳሪ",
        ],
        cta: "ያግኙን",
      },
    ],
  },
  cta: {
    eyebrow: "ቀጣይ እርምጃ",
    title: "EduSync ለትምህርት ቤትዎ የሚስማማ ይመስልዎታል?",
    lead: "መግቢያዎችን እናሳያለን፣ የመጀመሪያ ጥያቄዎችን እንመልሳለን እና ለቅርንጫፍ ብዛት እና የተማሪ መጠን ዋጋ እንጋራለን።",
    signIn: "ግባ",
    contactUs: "ያግኙን",
  },
  footer: {
    tagline: "Entro Ethiopia",
    description:
      "ለ KG–12 የትምህርት ቤት አስተዳደር — ምዝገባ፣ ትምህርት፣ ፋይናንስ፣ ቤተ-መጽሐፍት፣ HR እና የቤተሰብ መግቢያዎች በአንድ ደህንነቱ የተጠበቀ ስርዓት።",
    location: "በኢትዮጵያ ተዘጋጅቶ ተሰራ",
    linksHeading: "አገናኞች",
    signIn: "ግባ",
    staffRegistration: "የሰራተኛ ምዝገባ",
    pricing: "ዋጋ",
    modules: "ሞጁሎች",
    contactHeading: "ማግኛ",
    contactLabels: { website: "Website", phone: "Phone", email: "Email" },
    copyright: "EduSync SMS · Entro Ethiopia Software Development PLC. All rights reserved.",
    terms: "ውሎች",
    privacy: "ግላዊነት",
  },
};
