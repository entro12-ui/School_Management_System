import { PaymentStatus } from "@prisma/client";
import {
  PARENT_COMMUNICATION_LANGUAGE_LABELS,
  PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS,
  type ParentCommunicationLanguage,
  type ParentCommunicationMessageType,
  type ParentCommunicationTone,
} from "@/lib/parent-communication";
import { prisma } from "@/lib/prisma";
import { formatCurrency, fullName } from "@/lib/utils";
import { formatGradeLevel } from "@/lib/grade-utils";
import { getChildrenForParent } from "./parent";
import { getTeacherByUserId, getTeacherClasses } from "./teacher";

type ParentChildRecord = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  gradeLabel: string;
  className: string;
  branchName: string;
  classId?: string | null;
};

export type ParentCommunicationChildSummary = {
  id: string;
  studentName: string;
  studentId: string;
  gradeLabel: string;
  className: string;
  branchName: string;
  recentGrades: number;
  averagePercent: number | null;
  latestAssessmentTitle: string | null;
  latestAssessmentSubject: string | null;
  latestAssessmentPercent: number | null;
  strongestSubject: string | null;
  watchSubject: string | null;
  absencesLast30Days: number;
  lateLast30Days: number;
  attendanceRate: number | null;
  outstandingBalance: number;
  pendingFeeItems: number;
  homeroomTeacherName: string | null;
};

export type ParentCommunicationBotContext = {
  parentName: string;
  defaultChildId: string | null;
  children: ParentCommunicationChildSummary[];
};

export type ParentCommunicationDraft = {
  subject: string;
  preview: string;
  body: string;
  highlights: string[];
  language: ParentCommunicationLanguage;
  languageLabel: string;
  messageType: ParentCommunicationMessageType;
  messageTypeLabel: string;
  tone: ParentCommunicationTone;
  source: "rules";
};

export type ParentCommunicationDraftInput = {
  childId: string;
  messageType: ParentCommunicationMessageType;
  language: ParentCommunicationLanguage;
  tone: ParentCommunicationTone;
  additionalNotes?: string;
};

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildParentName(parent: {
  user?: { firstName?: string | null; lastName?: string | null } | null;
}) {
  const first = parent.user?.firstName ?? "";
  const last = parent.user?.lastName ?? "";
  const name = fullName(first, last).trim();
  return name || "Parent";
}

async function buildChildSummary(
  child: ParentChildRecord
): Promise<ParentCommunicationChildSummary> {
  const gradesSince = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const attendanceSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [grades, attendance, payments] = await Promise.all([
    prisma.gradeRecord.findMany({
      where: {
        studentId: child.id,
        assessment: { date: { gte: gradesSince } },
      },
      include: {
        assessment: {
          select: {
            title: true,
            date: true,
            maxScore: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: [{ assessment: { date: "desc" } }, { createdAt: "desc" }],
      take: 12,
    }),
    prisma.attendanceRecord.findMany({
      where: {
        studentId: child.id,
        date: { gte: attendanceSince },
      },
      select: { status: true },
      orderBy: { date: "desc" },
      take: 60,
    }),
    prisma.payment.findMany({
      where: {
        studentId: child.id,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
      select: {
        amount: true,
        paidAmount: true,
        status: true,
      },
    }),
  ]);

  const gradePercents = grades.map((grade) =>
    grade.assessment.maxScore > 0
      ? Math.round((grade.score / grade.assessment.maxScore) * 100)
      : 0
  );

  const latestGrade = grades[0];
  const strongestBySubject = new Map<string, number[]>();
  for (const grade of grades) {
    const subject = grade.assessment.subject.name;
    const pct =
      grade.assessment.maxScore > 0
        ? Math.round((grade.score / grade.assessment.maxScore) * 100)
        : 0;
    strongestBySubject.set(subject, [...(strongestBySubject.get(subject) ?? []), pct]);
  }

  const subjectAverages = [...strongestBySubject.entries()].map(([subject, scores]) => ({
    subject,
    average: average(scores) ?? 0,
  }));
  subjectAverages.sort((left, right) => right.average - left.average);

  const presentCount = attendance.filter((record) => record.status === "PRESENT").length;
  const lateCount = attendance.filter((record) => record.status === "LATE").length;
  const excusedCount = attendance.filter((record) => record.status === "EXCUSED").length;
  const absentCount = attendance.filter((record) => record.status === "ABSENT").length;
  const attendanceRate =
    attendance.length > 0
      ? Math.round(((presentCount + lateCount + excusedCount) / attendance.length) * 100)
      : null;

  const outstandingBalance = payments.reduce(
    (sum, payment) => sum + Math.max(0, Number(payment.amount) - Number(payment.paidAmount)),
    0
  );

  let homeroomTeacherName: string | null = null;
  if (child.classId) {
    const homeroom = await prisma.classTeacher.findFirst({
      where: { classId: child.classId },
      orderBy: { isPrimary: "desc" },
      select: {
        teacher: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (homeroom?.teacher?.user) {
      const name = fullName(
        homeroom.teacher.user.firstName,
        homeroom.teacher.user.lastName
      ).trim();
      homeroomTeacherName = name || null;
    }
  }

  return {
    id: child.id,
    studentName: fullName(child.firstName, child.lastName),
    studentId: child.studentId,
    gradeLabel: child.gradeLabel,
    className: child.className,
    branchName: child.branchName,
    recentGrades: grades.length,
    averagePercent: average(gradePercents),
    latestAssessmentTitle: latestGrade?.assessment.title ?? null,
    latestAssessmentSubject: latestGrade?.assessment.subject.name ?? null,
    latestAssessmentPercent:
      latestGrade && latestGrade.assessment.maxScore > 0
        ? Math.round((latestGrade.score / latestGrade.assessment.maxScore) * 100)
        : null,
    strongestSubject: subjectAverages[0]?.subject ?? null,
    watchSubject:
      subjectAverages.length > 1
        ? subjectAverages[subjectAverages.length - 1]?.subject ?? null
        : subjectAverages[0]?.average != null && subjectAverages[0].average < 70
          ? subjectAverages[0].subject
          : null,
    absencesLast30Days: absentCount,
    lateLast30Days: lateCount,
    attendanceRate,
    outstandingBalance,
    pendingFeeItems: payments.length,
    homeroomTeacherName,
  };
}

function englishDraft(
  parentName: string,
  summary: ParentCommunicationChildSummary,
  messageType: ParentCommunicationMessageType,
  tone: ParentCommunicationTone,
  additionalNotes?: string
): ParentCommunicationDraft {
  const greeting = tone === "formal" ? `Dear ${parentName},` : `Hello ${parentName},`;
  const closing =
    tone === "formal"
      ? "Thank you for your partnership and continued support."
      : "Thank you for the support you continue to give at home.";
  const childName = summary.studentName;
  const performance =
    summary.averagePercent != null
      ? `${childName} is currently averaging ${summary.averagePercent}% across recent assessments.`
      : `Recent assessment data for ${childName} is still limited, but progress is being monitored closely.`;
  const subjectInsight = summary.strongestSubject
    ? summary.watchSubject && summary.watchSubject !== summary.strongestSubject
      ? `A clear strength is ${summary.strongestSubject}, while ${summary.watchSubject} could benefit from a little more attention.`
      : `${childName} is showing encouraging strength in ${summary.strongestSubject}.`
    : `${childName}'s recent subject performance will become clearer as more assessments are recorded.`;
  const attendance =
    summary.attendanceRate != null
      ? `Attendance over the last 30 days is ${summary.attendanceRate}%, with ${summary.absencesLast30Days} absence(s) and ${summary.lateLast30Days} late arrival(s).`
      : "Attendance data for the last 30 days is not yet available.";
  const fees =
    summary.outstandingBalance > 0
      ? `There is an outstanding fee balance of ${formatCurrency(summary.outstandingBalance)} across ${summary.pendingFeeItems} item(s).`
      : "Fee records are currently up to date.";
  const latestAssessment =
    summary.latestAssessmentTitle && summary.latestAssessmentPercent != null
      ? `The latest recorded result was ${summary.latestAssessmentTitle} in ${summary.latestAssessmentSubject ?? "class"}, scored at ${summary.latestAssessmentPercent}%.`
      : "A latest assessment result has not yet been recorded.";
  const note = additionalNotes?.trim()
    ? `Additional note: ${additionalNotes.trim()}`
    : null;

  const drafts: Record<ParentCommunicationMessageType, Omit<ParentCommunicationDraft, "language" | "languageLabel" | "messageType" | "messageTypeLabel" | "tone" | "source">> =
    {
      progress_report: {
        subject: `Progress update for ${childName}`,
        preview: `${childName}'s current learning progress, attendance, and next support steps.`,
        body: [greeting, "", performance, latestAssessment, subjectInsight, attendance, fees, note, "", closing]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.averagePercent != null ? `Average score: ${summary.averagePercent}%` : "Average score: pending more grades",
          summary.strongestSubject
            ? `Strength area: ${summary.strongestSubject}`
            : "Strength area: building new data",
          summary.watchSubject ? `Watch area: ${summary.watchSubject}` : "Watch area: none flagged yet",
        ],
      },
      attendance_alert: {
        subject: `Attendance follow-up for ${childName}`,
        preview: `A ready-to-send attendance alert covering absences, lateness, and follow-up.`,
        body: [
          greeting,
          "",
          `We are writing to follow up on ${childName}'s recent attendance record.`,
          attendance,
          summary.absencesLast30Days > 0 || summary.lateLast30Days > 0
            ? `Please speak with ${childName} about punctuality and daily attendance so we can keep learning on track.`
            : `Attendance has been stable recently, and we encourage the same consistency going forward.`,
          performance,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `Absences (30 days): ${summary.absencesLast30Days}`,
          `Late arrivals (30 days): ${summary.lateLast30Days}`,
          summary.attendanceRate != null
            ? `Attendance rate: ${summary.attendanceRate}%`
            : "Attendance rate: no recent data",
        ],
      },
      fee_alert: {
        subject: `Fee reminder for ${childName}`,
        preview: `A clear fee reminder with balance status and a respectful parent-facing tone.`,
        body: [
          greeting,
          "",
          `This is a friendly reminder regarding ${childName}'s school fee status.`,
          fees,
          summary.outstandingBalance > 0
            ? `Please complete the pending payment at your earliest convenience so there is no interruption to related school processes.`
            : `No further action is required at this time.`,
          performance,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `Outstanding balance: ${formatCurrency(summary.outstandingBalance)}`,
          `Pending fee items: ${summary.pendingFeeItems}`,
          summary.averagePercent != null
            ? `Current academic average: ${summary.averagePercent}%`
            : "Current academic average: pending more grades",
        ],
      },
      positive_update: {
        subject: `Positive update for ${childName}`,
        preview: `A warm, encouraging update celebrating recent progress and engagement.`,
        body: [
          greeting,
          "",
          `We are happy to share a positive update about ${childName}.`,
          performance,
          subjectInsight,
          latestAssessment,
          summary.attendanceRate != null
            ? `Attendance has also been tracked at ${summary.attendanceRate}% over the last 30 days.`
            : null,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.strongestSubject
            ? `Strongest subject: ${summary.strongestSubject}`
            : "Strongest subject: emerging",
          summary.latestAssessmentPercent != null
            ? `Latest score: ${summary.latestAssessmentPercent}%`
            : "Latest score: not available",
          summary.attendanceRate != null
            ? `Attendance: ${summary.attendanceRate}%`
            : "Attendance: no recent data",
        ],
      },
      meeting_request: {
        subject: `Meeting request regarding ${childName}`,
        preview: `A respectful request to meet with school staff about ${childName}'s learning and wellbeing.`,
        body: [
          greeting,
          "",
          `I would like to schedule a meeting to discuss ${childName}'s progress and how we can support learning together.`,
          `${childName} is enrolled in ${summary.gradeLabel}, class ${summary.className}, at ${summary.branchName}.`,
          summary.homeroomTeacherName
            ? `If appropriate, I would appreciate coordinating with ${summary.homeroomTeacherName}.`
            : null,
          performance,
          attendance,
          note,
          "",
          `Please share available dates and times for a brief conversation.`,
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.homeroomTeacherName
            ? `Class teacher: ${summary.homeroomTeacherName}`
            : "Class teacher: contact school office",
          summary.averagePercent != null
            ? `Recent average: ${summary.averagePercent}%`
            : "Recent average: pending more grades",
          summary.attendanceRate != null
            ? `Attendance (30 days): ${summary.attendanceRate}%`
            : "Attendance: no recent data",
        ],
      },
    };

  return {
    ...drafts[messageType],
    language: "en",
    languageLabel: PARENT_COMMUNICATION_LANGUAGE_LABELS.en,
    messageType,
    messageTypeLabel: PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS[messageType],
    tone,
    source: "rules",
  };
}

function amharicDraft(
  parentName: string,
  summary: ParentCommunicationChildSummary,
  messageType: ParentCommunicationMessageType,
  tone: ParentCommunicationTone,
  additionalNotes?: string
): ParentCommunicationDraft {
  const greeting = tone === "formal" ? `ክቡር/ክብርት ${parentName},` : `ሰላም ${parentName},`;
  const closing =
    tone === "formal"
      ? "ለቀጣይ ትብብርዎ እናመሰግናለን።"
      : "በቤት የምትሰጡትን ድጋፍ እናመሰግናለን።";
  const childName = summary.studentName;
  const scoreLine =
    summary.averagePercent != null
      ? `${childName} በቅርብ ጊዜ ፈተናዎች ላይ ${summary.averagePercent}% አማካይ ውጤት አለው/አላት።`
      : `${childName} ላይ የተሟላ የውጤት መረጃ እስካሁን አልተሰበሰበም፣ ግን እድገቱ/እድገቷ በቅርብ እየተከታተለ ነው።`;
  const attendanceLine =
    summary.attendanceRate != null
      ? `ባለፉት 30 ቀናት የመገኘት መጠን ${summary.attendanceRate}% ሲሆን ${summary.absencesLast30Days} ቀሪ ቀን እና ${summary.lateLast30Days} ዘግይቶ መግባት ተመዝግቧል።`
      : "የቅርብ 30 ቀናት የመገኘት መረጃ ገና አልተገኘም።";
  const feeLine =
    summary.outstandingBalance > 0
      ? `የሚከፈል ${formatCurrency(summary.outstandingBalance)} ቀሪ ክፍያ አለ።`
      : "የክፍያ መረጃው አሁን ድረስ በጥሩ ሁኔታ ላይ ነው።";
  const note = additionalNotes?.trim()
    ? `ተጨማሪ ማስታወሻ: ${additionalNotes.trim()}`
    : null;

  const drafts: Record<ParentCommunicationMessageType, Omit<ParentCommunicationDraft, "language" | "languageLabel" | "messageType" | "messageTypeLabel" | "tone" | "source">> =
    {
      progress_report: {
        subject: `የ${childName} የእድገት ሪፖርት`,
        preview: `የትምህርት እድገት፣ የመገኘት ሁኔታ እና ቀጣይ ድጋፍ የሚያጠቃልል ረቂቅ።`,
        body: [
          greeting,
          "",
          scoreLine,
          summary.strongestSubject
            ? `ጠንካራ የሆነ የትምህርት ክፍል ${summary.strongestSubject} ነው።`
            : "ተጨማሪ የትምህርት ውጤት ሲመጣ ጠንካራ ክፍሎች ይታያሉ።",
          summary.watchSubject
            ? `${summary.watchSubject} ላይ ተጨማሪ ድጋፍ ሊፈልግ ይችላል።`
            : null,
          attendanceLine,
          feeLine,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.averagePercent != null ? `አማካይ ውጤት: ${summary.averagePercent}%` : "አማካይ ውጤት: መረጃ በመሰብሰብ ላይ",
          summary.strongestSubject ? `ጠንካራ ክፍል: ${summary.strongestSubject}` : "ጠንካራ ክፍል: ገና አልተወሰነም",
          summary.watchSubject ? `የሚከታተል: ${summary.watchSubject}` : "የሚከታተል: ገና የለም",
        ],
      },
      attendance_alert: {
        subject: `የ${childName} የመገኘት ማሳሰቢያ`,
        preview: `እንደ ቀሪ ቀን እና ዘግይቶ መግባት ሁኔታ የተዘጋጀ ረቂቅ።`,
        body: [
          greeting,
          "",
          `${childName} የቅርብ ጊዜ የመገኘት ሁኔታን ለመከታተል እንጽፋለን።`,
          attendanceLine,
          "እባክዎ ከልጅዎ ጋር ስለ መደበኛ መገኘት እና ሰዓት አክብሮ መግባት ይነጋገሩ።",
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `ቀሪ ቀን: ${summary.absencesLast30Days}`,
          `ዘግይቶ መግባት: ${summary.lateLast30Days}`,
          summary.attendanceRate != null ? `የመገኘት መጠን: ${summary.attendanceRate}%` : "የመገኘት መጠን: መረጃ የለም",
        ],
      },
      fee_alert: {
        subject: `የ${childName} የክፍያ ማሳሰቢያ`,
        preview: `የቀሪ ክፍያ ሁኔታን በክብር የሚገልጽ ረቂቅ።`,
        body: [
          greeting,
          "",
          `ይህ መልዕክት ስለ ${childName} የትምህርት ክፍያ ሁኔታ ለማስታወስ ነው።`,
          feeLine,
          summary.outstandingBalance > 0
            ? "እባክዎ የቀረውን ክፍያ በተቻለ ፍጥነት እንዲያጠናቁ እንጠይቃለን።"
            : "አሁን በዚህ ረገድ ተጨማሪ እርምጃ አያስፈልግም።",
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `ቀሪ ክፍያ: ${formatCurrency(summary.outstandingBalance)}`,
          `የተከፈቱ ክፍያዎች: ${summary.pendingFeeItems}`,
          summary.averagePercent != null ? `አማካይ ውጤት: ${summary.averagePercent}%` : "አማካይ ውጤት: መረጃ በመሰብሰብ ላይ",
        ],
      },
      positive_update: {
        subject: `ስለ ${childName} አዎንታዊ መልዕክት`,
        preview: `የቅርብ ጊዜ እድገትን እና ጥሩ ተሳትፎን የሚያጎላ ረቂቅ።`,
        body: [
          greeting,
          "",
          `ስለ ${childName} ጥሩ የሆነ ዝርዝር መጋራት እንፈልጋለን።`,
          scoreLine,
          summary.strongestSubject
            ? `${summary.strongestSubject} ውስጥ ጥሩ እድገት ታይቷል።`
            : null,
          summary.attendanceRate != null
            ? `ባለፉት 30 ቀናት የመገኘት መጠን ${summary.attendanceRate}% ነበር።`
            : null,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.strongestSubject ? `ጠንካራ ክፍል: ${summary.strongestSubject}` : "ጠንካራ ክፍል: በመሰብሰብ ላይ",
          summary.latestAssessmentPercent != null ? `የቅርብ ውጤት: ${summary.latestAssessmentPercent}%` : "የቅርብ ውጤት: የለም",
          summary.attendanceRate != null ? `መገኘት: ${summary.attendanceRate}%` : "መገኘት: መረጃ የለም",
        ],
      },
      meeting_request: {
        subject: `ስለ ${childName} የስብሰባ ጥያቄ`,
        preview: `ስለ ልጅዎ እድገት እና ድጋፍ ከትምህርት ቤቱ ጋር ለመገናኘት የተዘጋጀ ረቂቅ።`,
        body: [
          greeting,
          "",
          `ስለ ${childName} እድገት እና ቀጣይ ድጋፍ ለመወያየት ስብሰባ ለመጠየቅ እፈልጋለሁ።`,
          `${childName} በ${summary.gradeLabel}፣ ክፍል ${summary.className}፣ በ${summary.branchName} ተመዝቧል/ተመዝባለች።`,
          summary.homeroomTeacherName
            ? `በተቻለ መጠን ከ${summary.homeroomTeacherName} ጋር ማስተባበር እንደሚቻል እጠብቃለሁ።`
            : null,
          scoreLine,
          attendanceLine,
          note,
          "",
          `ለአጭር ውይይት የሚመጡ ቀናት እና ሰዓቶችን እባክዎ ያሳውቁኝ።`,
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.homeroomTeacherName
            ? `ክፍል መምህር: ${summary.homeroomTeacherName}`
            : "ክፍል መምህር: ትምህርት ቤቱን ያግኙ",
          summary.averagePercent != null ? `አማካይ ውጤት: ${summary.averagePercent}%` : "አማካይ ውጤት: መረጃ በመሰብሰብ ላይ",
          summary.attendanceRate != null ? `መገኘት: ${summary.attendanceRate}%` : "መገኘት: መረጃ የለም",
        ],
      },
    };

  return {
    ...drafts[messageType],
    language: "am",
    languageLabel: PARENT_COMMUNICATION_LANGUAGE_LABELS.am,
    messageType,
    messageTypeLabel: PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS[messageType],
    tone,
    source: "rules",
  };
}

function oromoDraft(
  parentName: string,
  summary: ParentCommunicationChildSummary,
  messageType: ParentCommunicationMessageType,
  tone: ParentCommunicationTone,
  additionalNotes?: string
): ParentCommunicationDraft {
  const greeting = tone === "formal" ? `${parentName} kabajamaa,` : `Akkam ${parentName},`;
  const closing =
    tone === "formal"
      ? "Galatoomaa tumsa fi deeggarsa itti fufsiiftaniif."
      : "Deeggarsa mana keessaa itti fufsiiftaniif galatoomaa.";
  const childName = summary.studentName;
  const performance =
    summary.averagePercent != null
      ? `${childName} qormaata dhihoo irratti giddugaleessaan ${summary.averagePercent}% galmeesseera.`
      : `Ragaan qabxii ${childName} irratti guutuun hin gahin, garuu hojii isaa/ishii itti dhiyeenyaan hordofamaa jira.`;
  const attendance =
    summary.attendanceRate != null
      ? `Guyyoota 30 darban keessatti argamni ${summary.attendanceRate}% ture; hafuun ${summary.absencesLast30Days} fi tursiisuun ${summary.lateLast30Days} galmaa'eera.`
      : "Ragaan argamaa guyyaa 30 darban irraa guutuun hin argamne.";
  const fees =
    summary.outstandingBalance > 0
      ? `Kaffaltiin hafe ${formatCurrency(summary.outstandingBalance)} jira.`
      : "Kaffaltiin yeroo ammaa guutameera.";
  const note = additionalNotes?.trim()
    ? `Yaadannoo dabalataa: ${additionalNotes.trim()}`
    : null;

  const drafts: Record<ParentCommunicationMessageType, Omit<ParentCommunicationDraft, "language" | "languageLabel" | "messageType" | "messageTypeLabel" | "tone" | "source">> =
    {
      progress_report: {
        subject: `Gabaasa hojii barnootaa ${childName}`,
        preview: `Hojii barnootaa, argamaa fi tarkaanfii deeggarsaa gabaabinaan ibsa.`,
        body: [
          greeting,
          "",
          performance,
          summary.strongestSubject
            ? `Kutaan inni/ishiin jabaatee mul'ate ${summary.strongestSubject} dha.`
            : null,
          summary.watchSubject
            ? `${summary.watchSubject} irratti deeggarsi dabalataa barbaachisuu danda'a.`
            : null,
          attendance,
          fees,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.averagePercent != null ? `Giddugaleessa: ${summary.averagePercent}%` : "Giddugaleessa: ragaan dabalataa eeggamaa jira",
          summary.strongestSubject ? `Jabina: ${summary.strongestSubject}` : "Jabina: hin murtoofne",
          summary.watchSubject ? `Ilaalcha barbaada: ${summary.watchSubject}` : "Ilaalcha barbaada: hin jiru",
        ],
      },
      attendance_alert: {
        subject: `Beeksisa argamaa ${childName}`,
        preview: `Hafuufi yeroo boodatti dhufu ilaalchisee ergaa qophaa'e.`,
        body: [
          greeting,
          "",
          `Argama ${childName} yeroo dhihoo hordofuuf isin qunnamna.`,
          attendance,
          "Maaloo waa'ee yeroon mana barumsaa dhaqqabuu fi argamaa itti fufiinsa qabu irratti waliin mari'adhaa.",
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `Hafuu: ${summary.absencesLast30Days}`,
          `Tursiisuu: ${summary.lateLast30Days}`,
          summary.attendanceRate != null ? `Argama: ${summary.attendanceRate}%` : "Argama: ragaan hin jiru",
        ],
      },
      fee_alert: {
        subject: `Yaadachiisa kaffaltii ${childName}`,
        preview: `Haala kaffaltii hafee ifaan ibsuun ergaa kabajamaa qopheessa.`,
        body: [
          greeting,
          "",
          `Ergaan kun haala kaffaltii mana barumsaa ${childName} yaadachiisuuf qophaa'eera.`,
          fees,
          summary.outstandingBalance > 0
            ? "Maaloo kaffaltii hafe yeroo isin danda'etti xumuraa."
            : "Ammaaf tarkaanfiin dabalataa hin barbaachisu.",
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          `Kaffaltii hafe: ${formatCurrency(summary.outstandingBalance)}`,
          `Wantoota kaffaltii hafan: ${summary.pendingFeeItems}`,
          summary.averagePercent != null ? `Giddugaleessa barnootaa: ${summary.averagePercent}%` : "Giddugaleessa barnootaa: ragaan dabalataa eeggamaa jira",
        ],
      },
      positive_update: {
        subject: `Odeeffannoo gaarii ${childName}`,
        preview: `Milkaa'ina fi fooyya'iinsa yeroo dhihoo kabajuuf ergaa ho'aa.`,
        body: [
          greeting,
          "",
          `Waa'ee ${childName} odeeffannoo gaarii isin waliin qooduuf gammachuu guddaan qabna.`,
          performance,
          summary.strongestSubject
            ? `${summary.strongestSubject} keessatti fooyya'iinsi gaariin mul'ateera.`
            : null,
          summary.attendanceRate != null
            ? `Argamni guyyaa 30 darbe keessatti ${summary.attendanceRate}% ture.`
            : null,
          note,
          "",
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.strongestSubject ? `Kutaa cimaa: ${summary.strongestSubject}` : "Kutaa cimaa: hin murtoofne",
          summary.latestAssessmentPercent != null ? `Qabxii dhumaa: ${summary.latestAssessmentPercent}%` : "Qabxii dhumaa: hin jiru",
          summary.attendanceRate != null ? `Argama: ${summary.attendanceRate}%` : "Argama: ragaan hin jiru",
        ],
      },
      meeting_request: {
        subject: `Gaaffii walga'ii ${childName}`,
        preview: `Guddina barnootaa fi deeggarsa irratti hojii mana barumsaa waliin mari'achuuf ergaa kabajamaa.`,
        body: [
          greeting,
          "",
          `Guddina ${childName} fi akkamitti waliin deeggaruu danda'u ilaaluuf walga'ii qopheessuuf gaafachuu barbaada.`,
          `${childName} ${summary.gradeLabel}, kutaa ${summary.className}, ${summary.branchName} keessatti galmaa'eera.`,
          summary.homeroomTeacherName
            ? `Yoo ta'e ${summary.homeroomTeacherName} waliin walitti qabuu nan barbaada.`
            : null,
          performance,
          attendance,
          note,
          "",
          `Mari'achuuf guyyaa fi sa'aatni jiran naaf himaa.`,
          closing,
        ]
          .filter(Boolean)
          .join("\n"),
        highlights: [
          summary.homeroomTeacherName
            ? `Barsiisaa kutaa: ${summary.homeroomTeacherName}`
            : "Barsiisaa kutaa: waajjira mana barumsaa qunnamaa",
          summary.averagePercent != null ? `Giddugaleessa: ${summary.averagePercent}%` : "Giddugaleessa: ragaan dabalataa eeggamaa jira",
          summary.attendanceRate != null ? `Argama: ${summary.attendanceRate}%` : "Argama: ragaan hin jiru",
        ],
      },
    };

  return {
    ...drafts[messageType],
    language: "om",
    languageLabel: PARENT_COMMUNICATION_LANGUAGE_LABELS.om,
    messageType,
    messageTypeLabel: PARENT_COMMUNICATION_MESSAGE_TYPE_LABELS[messageType],
    tone,
    source: "rules",
  };
}

function buildLocalizedDraft(
  parentName: string,
  summary: ParentCommunicationChildSummary,
  messageType: ParentCommunicationMessageType,
  language: ParentCommunicationLanguage,
  tone: ParentCommunicationTone,
  additionalNotes?: string
) {
  if (language === "am") {
    return amharicDraft(parentName, summary, messageType, tone, additionalNotes);
  }
  if (language === "om") {
    return oromoDraft(parentName, summary, messageType, tone, additionalNotes);
  }
  return englishDraft(parentName, summary, messageType, tone, additionalNotes);
}

export async function getParentCommunicationBotContext(
  parentUserId: string
): Promise<ParentCommunicationBotContext> {
  const { parent, children } = await getChildrenForParent(parentUserId);
  if (!parent) {
    return { parentName: "Parent", defaultChildId: null, children: [] };
  }

  const summaries = await Promise.all(
    children.map((child) =>
      buildChildSummary({
        id: child.id,
        studentId: child.studentId,
        firstName: child.firstName,
        lastName: child.lastName,
        gradeLabel: child.gradeLabel,
        className: child.className,
        branchName: child.branchName,
        classId: child.classId,
      })
    )
  );

  return {
    parentName: buildParentName(parent),
    defaultChildId: summaries[0]?.id ?? null,
    children: summaries,
  };
}

export async function generateParentCommunicationDraft(
  parentUserId: string,
  input: ParentCommunicationDraftInput
): Promise<{
  parentName: string;
  summary: ParentCommunicationChildSummary;
  draft: ParentCommunicationDraft;
} | null> {
  const { parent, children } = await getChildrenForParent(parentUserId);
  if (!parent) return null;

  const child = children.find((entry) => entry.id === input.childId);
  if (!child) return null;

  const summary = await buildChildSummary({
    id: child.id,
    studentId: child.studentId,
    firstName: child.firstName,
    lastName: child.lastName,
    gradeLabel: child.gradeLabel,
    className: child.className,
    branchName: child.branchName,
    classId: child.classId,
  });

  return {
    parentName: buildParentName(parent),
    summary,
    draft: buildLocalizedDraft(
      buildParentName(parent),
      summary,
      input.messageType,
      input.language,
      input.tone,
      input.additionalNotes
    ),
  };
}

function buildTeacherName(teacher: {
  user?: { firstName?: string | null; lastName?: string | null } | null;
}) {
  const first = teacher.user?.firstName ?? "";
  const last = teacher.user?.lastName ?? "";
  const name = fullName(first, last).trim();
  return name || "Teacher";
}

export async function getTeacherCommunicationBotContext(
  teacherUserId: string
): Promise<ParentCommunicationBotContext> {
  const [teacher, classData] = await Promise.all([
    getTeacherByUserId(teacherUserId),
    getTeacherClasses(teacherUserId),
  ]);

  if (!teacher || !classData || classData.classes.length === 0) {
    return { parentName: "Teacher", defaultChildId: null, children: [] };
  }

  const classIds = classData.classes.map((cls) => cls.id);
  const students = await prisma.student.findMany({
    where: {
      isActive: true,
      branchId: teacher.branchId,
      classId: { in: classIds },
    },
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      classId: true,
      branch: { select: { name: true } },
      class: { select: { name: true } },
    },
    orderBy: [{ gradeLevel: "asc" }, { lastName: "asc" }, { firstName: "asc" }],
    take: 80,
  });

  const summaries = await Promise.all(
    students.map((student) =>
      buildChildSummary({
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        gradeLabel: formatGradeLevel(student.gradeLevel),
        className: student.class?.name ?? "Unassigned",
        branchName: student.branch.name,
        classId: student.classId,
      })
    )
  );

  return {
    parentName: buildTeacherName(teacher),
    defaultChildId: summaries[0]?.id ?? null,
    children: summaries,
  };
}

export async function generateTeacherCommunicationDraft(
  teacherUserId: string,
  input: ParentCommunicationDraftInput
): Promise<{
  parentName: string;
  summary: ParentCommunicationChildSummary;
  draft: ParentCommunicationDraft;
} | null> {
  const [teacher, classData] = await Promise.all([
    getTeacherByUserId(teacherUserId),
    getTeacherClasses(teacherUserId),
  ]);

  if (!teacher || !classData) return null;

  const accessibleClassIds = new Set(classData.classes.map((cls) => cls.id));
  const student = await prisma.student.findFirst({
    where: {
      id: input.childId,
      isActive: true,
      branchId: teacher.branchId,
      classId: { in: [...accessibleClassIds] },
    },
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      gradeLevel: true,
      classId: true,
      branch: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  if (!student) return null;

  const summary = await buildChildSummary({
    id: student.id,
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    gradeLabel: formatGradeLevel(student.gradeLevel),
    className: student.class?.name ?? "Unassigned",
    branchName: student.branch.name,
    classId: student.classId,
  });

  const recipientName = "Parent/Guardian";

  return {
    parentName: buildTeacherName(teacher),
    summary,
    draft: buildLocalizedDraft(
      recipientName,
      summary,
      input.messageType,
      input.language,
      input.tone,
      input.additionalNotes
    ),
  };
}
