const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak, LevelFormat,
  ExternalHyperlink, TableOfContents, Bookmark, InternalHyperlink
} = require('docx');
const fs = require('fs');

// ── helpers ──────────────────────────────────────────────────────────────────
const BLUE      = "1A56A0";
const DARKBLUE  = "0D3B6E";
const LIGHTBLUE = "D6E4F7";
const GREY      = "F4F6F9";
const MIDGREY   = "CDD5E0";
const BLACK     = "1A1A2E";
const GREEN     = "166534";
const LIGHTGREEN= "DCFCE7";
const ORANGE    = "92400E";
const LIGHTORANGE="FEF3C7";
const RED       = "991B1B";
const LIGHTRED  = "FEE2E2";

const border = (color = MIDGREY) => ({ style: BorderStyle.SINGLE, size: 1, color });
const cellBorders = (color = MIDGREY) => ({
  top: border(color), bottom: border(color),
  left: border(color), right: border(color)
});
const noBorder = () => ({
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }
});

function h1(text, bookmarkId) {
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: [new TextRun({ text, font: "Arial", size: 36, bold: true, color: DARKBLUE })] })]
    : [new TextRun({ text, font: "Arial", size: 36, bold: true, color: DARKBLUE })];
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 4 } }
  });
}

function h2(text, bookmarkId) {
  const children = bookmarkId
    ? [new Bookmark({ id: bookmarkId, children: [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE })] })]
    : [new TextRun({ text, font: "Arial", size: 28, bold: true, color: BLUE })];
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children, spacing: { before: 280, after: 80 } });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: BLACK })],
    spacing: { before: 200, after: 60 }
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK, ...opts })],
    spacing: { before: 60, after: 60 }
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK })],
    spacing: { before: 40, after: 40 }
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    children: [new TextRun({ text, font: "Arial", size: 22, color: BLACK })],
    spacing: { before: 40, after: 40 }
  });
}

function spacer(size = 120) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: size, after: 0 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function labelValue(label, value) {
  return new Paragraph({
    children: [
      new TextRun({ text: label + ": ", font: "Arial", size: 22, bold: true, color: BLUE }),
      new TextRun({ text: value, font: "Arial", size: 22, color: BLACK })
    ],
    spacing: { before: 40, after: 40 }
  });
}

function badgePara(text, fill, textColor = "FFFFFF") {
  return new Paragraph({
    children: [new TextRun({ text: " " + text + " ", font: "Arial", size: 18, bold: true, color: textColor, highlight: undefined })],
    shading: { fill, type: ShadingType.CLEAR },
    spacing: { before: 20, after: 20 }
  });
}

// ── Table builders ───────────────────────────────────────────────────────────
function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders: cellBorders(BLUE),
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: DARKBLUE, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({ children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: "FFFFFF" })], alignment: AlignmentType.LEFT })]
    }))
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      borders: cellBorders(MIDGREY),
      width: { size: colWidths[ci], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? "FFFFFF" : GREY, type: ShadingType.CLEAR },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: cell, font: "Arial", size: 20, color: BLACK })], alignment: AlignmentType.LEFT })]
    }))
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows]
  });
}

function statusBadge(status) {
  const map = { "✅ Finalized": [GREEN, LIGHTGREEN, BLACK], "🔵 Draft": [BLUE, LIGHTBLUE, BLACK], "⚠️ Deferred": [ORANGE, LIGHTORANGE, BLACK] };
  return status;
}

// requirement block
function reqBlock(id, title, text, status = "✅ Finalized") {
  return [
    spacer(80),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({ children: [new TableCell({
          borders: cellBorders(BLUE),
          shading: { fill: LIGHTBLUE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({ children: [
            new TextRun({ text: id + "  ", font: "Arial", size: 20, bold: true, color: DARKBLUE }),
            new TextRun({ text: title, font: "Arial", size: 20, bold: true, color: BLACK }),
            new TextRun({ text: "   " + status, font: "Arial", size: 18, color: GREEN })
          ]})]
        })] }),
        new TableRow({ children: [new TableCell({
          borders: cellBorders(MIDGREY),
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 21, color: BLACK })] })]
        })] })
      ]
    }),
    spacer(40)
  ];
}

function nfrBlock(id, title, text) {
  return [
    spacer(60),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({ children: [new TableCell({
          borders: { top: border(ORANGE), bottom: border(ORANGE), left: { style: BorderStyle.SINGLE, size: 12, color: ORANGE }, right: border(ORANGE) },
          shading: { fill: LIGHTORANGE, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 160, right: 160 },
          children: [new Paragraph({ children: [
            new TextRun({ text: id + "  ", font: "Arial", size: 20, bold: true, color: ORANGE }),
            new TextRun({ text: title, font: "Arial", size: 20, bold: true, color: BLACK })
          ]})]
        })] }),
        new TableRow({ children: [new TableCell({
          borders: cellBorders(MIDGREY),
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 21, color: BLACK })] })]
        })] })
      ]
    }),
    spacer(40)
  ];
}

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.DECIMAL, text: "%1.%2.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
      ]}
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: DARKBLUE },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: BLACK },
        paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "PeerPrep", font: "Arial", size: 18, bold: true, color: BLUE }),
            new TextRun({ text: "   |   Software Requirements Specification   |   v1.0", font: "Arial", size: 18, color: MIDGREY })
          ],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LIGHTBLUE, space: 4 } }
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            new TextRun({ text: "Confidential — PeerPrep SRS v1.0", font: "Arial", size: 16, color: MIDGREY }),
            new TextRun({ text: "        Page ", font: "Arial", size: 16, color: MIDGREY }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MIDGREY }),
            new TextRun({ text: " of ", font: "Arial", size: 16, color: MIDGREY }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 16, color: MIDGREY }),
          ],
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: LIGHTBLUE, space: 4 } }
        })]
      })
    },
    children: [

      // ── COVER PAGE ──────────────────────────────────────────────────────────
      spacer(720),
      new Paragraph({
        children: [new TextRun({ text: "PeerPrep", font: "Arial", size: 80, bold: true, color: DARKBLUE })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Software Requirements Specification", font: "Arial", size: 32, color: BLUE })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "Version 1.0  —  June 2026", font: "Arial", size: 24, color: MIDGREY })],
        alignment: AlignmentType.CENTER, spacing: { before: 0, after: 480 }
      }),
      spacer(240),
      new Table({
        width: { size: 6000, type: WidthType.DXA },
        columnWidths: [2400, 3600],
        rows: [
          ["Project", "PeerPrep"], ["Status", "Draft — v1.0"],
          ["Prepared by", "Shagun (IIT Roorkee)"], ["Date", "June 2026"],
          ["Build Timeline", "3 days (solo developer)"], ["Target Release", "MVP v1.0"]
        ].map(([l, v], i) => new TableRow({ children: [
          new TableCell({
            borders: cellBorders(MIDGREY), shading: { fill: LIGHTBLUE, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 2400, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: l, font: "Arial", size: 20, bold: true, color: DARKBLUE })] })]
          }),
          new TableCell({
            borders: cellBorders(MIDGREY), shading: { fill: i % 2 === 0 ? "FFFFFF" : GREY, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 }, width: { size: 3600, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun({ text: v, font: "Arial", size: 20, color: BLACK })] })]
          })
        ]}))
      }),
      spacer(480),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: border(BLUE), bottom: border(BLUE), left: { style: BorderStyle.SINGLE, size: 16, color: BLUE }, right: border(BLUE) },
          shading: { fill: LIGHTBLUE, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "About This Document", font: "Arial", size: 22, bold: true, color: DARKBLUE })], spacing: { before: 0, after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: "This SRS defines the complete functional requirements, non-functional requirements, use cases, data model, constraints, and assumptions for PeerPrep — a peer mock interview platform for students targeting tech companies. This document serves as the authoritative build reference for the 3-day MVP sprint.", font: "Arial", size: 20, color: BLACK })], spacing: { before: 0, after: 0 } })
          ]
        })] })]
      }),

      pageBreak(),

      // ── TABLE OF CONTENTS ───────────────────────────────────────────────────
      h1("Table of Contents"),
      new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 1 — PRODUCT OVERVIEW
      // ══════════════════════════════════════════════════════════════════════
      h1("1. Product Overview", "s1"),
      spacer(40),

      h2("1.1 Problem Statement"),
      body("Students targeting specific tech companies (SDE, AI/ML roles) lack access to structured, human-led mock interview practice. Current solutions are fragmented: informal senior-junior chats are unstructured, while automated platforms lack genuine human interaction. PeerPrep combines both — structured, company-specific interview practice with real peer-to-peer human interaction."),
      spacer(60),

      h2("1.2 Product Vision"),
      body("PeerPrep is a web-based, two-sided peer mock interview platform where any student can act as an interviewer for companies they have experience with, and as an interviewee for companies they are targeting — with AI-assisted question delivery, embedded video calling, and structured feedback."),
      spacer(60),

      h2("1.3 Technology Stack"),
      spacer(40),
      makeTable(
        ["Layer", "Technology", "Plan / Notes"],
        [
          ["Frontend + Backend", "Next.js (App Router)", "Latest stable"],
          ["Database + Auth", "Supabase (PostgreSQL + Auth)", "Free tier"],
          ["File Storage", "Supabase Storage", "Private bucket, free tier"],
          ["Video Calling", "Daily.co API", "Embedded iframe, free tier — 2,000 participant-minutes"],
          ["AI / LLM", "Groq API (Llama 3.1 8B)", "Free tier — 14,400 req/day"],
          ["Email Notifications", "Resend", "Free tier — 3,000 emails/month"],
          ["Question Bank", "GitHub Raw CSV (snehasishroy repo)", "Cached weekly server-side"],
          ["Hosting", "Vercel", "Free tier — 10s serverless timeout"],
          ["Cron Jobs", "Vercel Cron", "Free tier — daily DB ping + reminders"],
          ["Styling", "Tailwind CSS", "Latest stable"],
        ],
        [3200, 3160, 3000]
      ),
      spacer(120),

      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: border(ORANGE), bottom: border(ORANGE), left: { style: BorderStyle.SINGLE, size: 16, color: ORANGE }, right: border(ORANGE) },
          shading: { fill: LIGHTORANGE, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "⚠️  Daily.co Free Tier Limit", font: "Arial", size: 20, bold: true, color: ORANGE })], spacing: { before: 0, after: 60 } }),
            new Paragraph({ children: [new TextRun({ text: "Daily.co charges based on participant-minutes (not room creation). A 60-minute session with 2 participants = 120 participant-minutes. The free tier includes 2,000 participant-minutes, equating to approximately 16–17 full sessions. Room generation at acceptance is free. Plan to upgrade Daily.co when user sessions grow beyond early prototype stage.", font: "Arial", size: 20, color: BLACK })] })
          ]
        })] })]
      }),
      spacer(60),

      h2("1.4 College Domain Whitelist"),
      body("At launch, the following institutional email domains are whitelisted. Adding new domains requires only a one-line config update — no code changes."),
      spacer(60),
      makeTable(
        ["Domain", "Institution"],
        [
          ["iitr.ac.in", "IIT Roorkee"],
          ["iitb.ac.in", "IIT Bombay"],
          ["iitd.ac.in", "IIT Delhi"],
          ["iitm.ac.in", "IIT Madras"],
          ["iitk.ac.in", "IIT Kanpur"],
          ["iitkgp.ac.in", "IIT Kharagpur"],
          ["iitg.ac.in", "IIT Guwahati"],
          ["iith.ac.in", "IIT Hyderabad"],
          ["bits-pilani.ac.in", "BITS Pilani"],
          ["pilani.bits-pilani.ac.in", "BITS Pilani (Pilani campus)"],
          ["goa.bits-pilani.ac.in", "BITS Pilani (Goa campus)"],
          ["hyderabad.bits-pilani.ac.in", "BITS Pilani (Hyderabad campus)"],
          ["nitt.edu", "NIT Trichy"],
          ["nitw.ac.in", "NIT Warangal"],
          ["mnnit.ac.in", "MNNIT Allahabad"],
        ],
        [4200, 5160]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 2 — STAKEHOLDERS & PERSONAS
      // ══════════════════════════════════════════════════════════════════════
      h1("2. Stakeholders & Personas", "s2"),
      spacer(40),

      h2("2.1 User Roles"),
      body("Roles in PeerPrep are fluid — the same user may act as an Interviewee for their target company (e.g. Google) and as an Interviewer for another company (e.g. Amazon) within the same week. Role is determined per session, not per account."),
      spacer(60),

      makeTable(
        ["Role", "Description", "Primary Goal"],
        [
          ["Seeker (Interviewee)", "A student seeking mock interview practice for a specific company/role", "Find a willing peer, get structured practice, receive feedback"],
          ["Helper (Interviewer)", "A student conducting a mock interview for a company they know", "Build communication skills, give back to community"],
          ["Admin", "Platform administrator (solo developer)", "Monitor usage, deactivate bad actors"],
        ],
        [2200, 4160, 3000]
      ),
      spacer(120),

      h2("2.2 Persona Profiles"),
      spacer(60),

      makeTable(
        ["Attribute", "Persona 1: The Seeker", "Persona 2: The Helper"],
        [
          ["Primary goal", "Get structured mock interview practice for Company X", "Conduct an interview, build communication skills"],
          ["Core pain point", "Cannot find someone willing to conduct an interview", "Does not know what questions to ask; fears running out of time"],
          ["What platform gives them", "Searchable peer pool, slot-based scheduling, resume sharing", "AI question sheet with hints, structured feedback form, embedded video"],
          ["Success signal", "Session completed and structured feedback received", "Session conducted smoothly with clear question structure"],
          ["Motivation", "Anxiety about upcoming tech interviews", "Goodwill, mentorship culture, skill reinforcement"],
        ],
        [2200, 3580, 3580]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 3 — FUNCTIONAL REQUIREMENTS
      // ══════════════════════════════════════════════════════════════════════
      h1("3. Functional Requirements", "s3"),
      body("All requirements below are Finalized unless otherwise noted. Vague terms have been explicitly resolved to measurable, testable criteria."),
      spacer(60),

      // MODULE 1
      h2("3.1 Authentication & Onboarding"),
      ...reqBlock("FR-001", "Email Registration & Verification",
        "The system shall allow a new user to register using a valid institutional email address. The system shall send a verification link to that email and shall not grant platform access until the email is verified."),
      ...reqBlock("FR-002", "College Auto-Detection from Email Domain",
        "The system shall derive and store the user's college automatically by matching their verified email domain against the server-side college domain whitelist. The user shall not be able to manually edit the college field. If the domain is not in the whitelist, the system shall display: 'Your institution is not yet supported. We are expanding soon!' and block registration."),
      ...reqBlock("FR-003", "Google OAuth",
        "The system shall support Google OAuth as an alternative to email/password registration, implemented via Supabase Auth. For Google OAuth sign-ups, the system shall verify that the Google account's email domain exists in the college domain whitelist. If not, registration shall be blocked. Email is marked verified automatically upon OAuth sign-in."),
      ...reqBlock("FR-004", "Guided Onboarding Flow",
        "Upon first login after email verification, the system shall present a sequential guided onboarding flow: Step 1 (mandatory) — name pre-filled from signup, user enters graduation year (numeric input); Step 2 (mandatory) — user searches and selects at least one company from the predefined list, selects a role (SDE / AI-ML / Data Engineer / Product / Other), and selects a status (Targeting / Experienced). Step 3 (optional) — user may add skills and/or upload a resume (PDF only, max 5MB). Steps 1 and 2 cannot be skipped. If the user closes the browser mid-onboarding, the system shall resume from the last incomplete step on next login."),
      ...reqBlock("FR-005", "Company-Role Management",
        "The system shall allow a user to add, edit, or delete their company-role entries at any time from their profile settings page. Each entry shall store: company (from predefined list), role, and status (targeting / experienced). A user may have multiple entries."),
      ...reqBlock("FR-006", "Resume Management",
        "The system shall allow a user to upload or replace their resume (PDF only, max 5MB) at any time from their profile settings page. Resume upload shall not be mandatory at signup or onboarding."),
      ...reqBlock("FR-007", "Password Reset",
        "The system shall provide a Forgot Password flow (implemented via Supabase Auth) allowing users registered with email/password to request a password reset link sent to their verified email. The reset link shall expire after 1 hour."),
      ...reqBlock("FR-008", "Profile Editing Post-Onboarding",
        "The system shall provide a profile settings page where a logged-in user can edit their name, graduation year, skills, resume, and availability toggle at any time after onboarding completion."),

      spacer(60),
      h2("3.2 Discovery & Search"),
      ...reqBlock("FR-009", "College-Scoped Discovery",
        "The system shall restrict all user search and discovery results to users belonging to the same college as the logged-in user, determined by verified email domain. Users from other colleges shall never appear in search results."),
      ...reqBlock("FR-010", "Search & Filter Interface",
        "The system shall provide a search interface allowing users to filter peers by: (1) company name (from predefined list), (2) target role (SDE / AI-ML / Data Engineer / Other), (3) status (targeting / experienced). Search results shall include only users whose availability toggle is set to ON. The logged-in user shall be excluded from their own search results."),
      ...reqBlock("FR-011", "User Card Display",
        "Each user card in search results shall display: name, graduation year, skills (if added), company-role entries with targeting/experienced badge, and availability status. When no results are found, the system shall display: 'No available interviewers found for this company. Try removing filters or check back later.' When the user is the first from their college, the system shall display: 'Looks like you are the first from your college! Invite peers to join.' with a shareable link."),
      ...reqBlock("FR-012", "Availability Toggle",
        "The system shall provide an availability toggle on each user's profile. When set to OFF, the user shall not appear in any search results. When set to ON, the user shall be visible to peers from the same college. The default state at onboarding completion shall be ON."),

      spacer(60),
      h2("3.3 Session Request Flow"),
      ...reqBlock("FR-013", "Send Session Request",
        "The system shall allow a logged-in user (Seeker) to send a session request to another user (Helper) from that user's profile page. The request shall include: (1) target company, pre-populated from the Seeker's own company-role entries; (2) between 1 and 5 proposed time slots (each with date and time); (3) resume share decision — if Yes, the system shall check for an existing resume; if none exists, the system shall prompt the Seeker to upload one before proceeding; if No, the system proceeds without any resume prompt; (4) an optional note (max 500 characters). If a pending session request already exists between the same two users for the same company, the system shall block submission and display: 'You already have a pending request with this user for this company.'"),
      ...reqBlock("FR-014", "Session Request Notifications",
        "The system shall notify the Helper of a new session request via an in-app notification. The system shall additionally send an email notification to the Helper's verified email address via Resend, on a best-effort basis."),
      ...reqBlock("FR-015", "Helper Response — Accept, Reject Slots, or Decline",
        "Upon receiving a session request, the Helper shall be presented with all proposed time slots and three options: (1) Select one slot to confirm — the system shall proceed to Daily.co room generation and session confirmation; (2) None of these slots work — the Helper may optionally add a short note (max 200 characters); the session status shall be set to slots_rejected; the Seeker shall be notified with the Helper's note and may send a new request with different slots; (3) Decline entirely — the session status shall be set to cancelled; the Seeker shall receive a polite system-generated message: 'Sorry, this user is unable to take your request right now.'"),
      ...reqBlock("FR-016", "Session Acceptance — Daily.co Room Generation",
        "Upon the Helper selecting a confirmed time slot, the system shall automatically generate a Daily.co video room via the Daily.co REST API (server-side, via Next.js API route). The room shall be configured to expire 2 hours after the scheduled session time. The generated room URL shall be stored in the session record. The system shall notify the Seeker with the confirmed date, time, and embedded session page link. Neither party shall be required to manually paste a meeting link."),
      ...reqBlock("FR-017", "AI Question Sheet Generation",
        "Upon session acceptance (slot confirmed), the system shall trigger Groq API question generation as a background process (async, via Supabase Edge Function to avoid Vercel 10-second timeout). The session screen shall display a 'Generating question sheet...' indicator. The question sheet shall contain: (1) up to 5 DSA questions fetched from the GitHub CSV for the relevant company, ordered by frequency score descending, each with an AI-generated brute-force approach, optimal approach, and time/space complexity; (2) 3–5 HR questions tailored to the company; (3) 2–3 project-related questions. The question sheet shall be visible only to the Interviewer. If Groq fails: the system retries once after 3 seconds; if retry fails, the system serves pre-cached static fallback questions for that company; if the company has no cache, the interviewer sees: 'Question sheet unavailable. You can proceed with your own questions.'"),
      ...reqBlock("FR-018", "Session Request Auto-Expiry",
        "If a Helper has not responded to a pending session request within 72 hours of it being sent, the system shall automatically set the session status to expired and notify the Seeker: 'Your session request has expired. You can send a new one.'"),
      ...reqBlock("FR-019", "Session Auto-Expiry (Abandoned)",
        "If a session's scheduled_at time has passed by more than 24 hours and the session status is still accepted (i.e. feedback has not been submitted), the system shall automatically set the session status to expired."),

      spacer(60),
      h2("3.4 Interview Session"),
      ...reqBlock("FR-020", "Session Screen — Pre-Session State",
        "After session acceptance and before the scheduled_at time, the system shall display the session screen in pre-session state to the Interviewer: the question sheet is displayed full-width in read-only mode (checklist inactive), the meeting link is visible, and no feedback form is shown. This allows the Interviewer to review and prepare questions before the session begins."),
      ...reqBlock("FR-021", "Session Screen — Live-Session State",
        "At or after the scheduled_at time, the system shall transition the session screen to live-session state displaying three panels: (1) Left — question sheet with interactive DSA checklist, HR questions, and project questions; (2) Centre — Daily.co video call embedded via iframe with microphone, camera, and autoplay permissions; (3) Right — feedback form. A fallback link ('Open video in new tab') shall be displayed below the iframe for browsers that block camera access in iframes. On mobile and tablet viewports (below 1024px), panels shall stack vertically in the order: video call, question sheet, feedback form."),
      ...reqBlock("FR-022", "Interactive Question Checklist",
        "The question sheet shall render each DSA question as an interactive checklist item. The Interviewer may check off questions as they are asked during the session. Checking all questions shall not be mandatory. Checked state shall be saved to Supabase in real time. The Interviewee shall not see the question sheet or checklist at any point."),
      ...reqBlock("FR-023", "Feedback Form",
        "The session screen shall display a feedback form accessible to the Interviewer only, without requiring navigation away from the session screen. The feedback form shall contain the following fields, all optional except the submit action: (1) Clarity of Thought — rating 1 to 5; (2) Communication — rating 1 to 5; (3) Problem-Solving Approach — rating 1 to 5; (4) Code Quality — rating 1 to 5; (5) Time Management — rating 1 to 5; (6) Additional Notes — free text, no character limit. The Interviewer may submit the form at any point during or after the session. The system shall require at least one field to be filled before submission is permitted."),

      spacer(60),
      h2("3.5 Post-Session & Feedback"),
      ...reqBlock("FR-024", "Feedback Submission & Notification",
        "Upon feedback submission by the Interviewer, the system shall: (1) update session status to completed; (2) store the feedback record linked to the session in Supabase; (3) notify the Interviewee via in-app notification and Resend email that feedback is available; (4) make the feedback visible to both the Interviewee and the Interviewer in their respective session history records."),
      ...reqBlock("FR-025", "Feedback Access Control",
        "Feedback shall be strictly one-way. The Interviewee may view feedback submitted by the Interviewer but shall have no ability to respond to, dispute, or edit it. Feedback records shall only be accessible to the two session participants, enforced via Supabase Row Level Security policies. Any attempt to access feedback by an unauthorized user shall return a 403 response."),
      ...reqBlock("FR-026", "Session History",
        "The system shall provide each user with a session history page displaying all sessions they have participated in, both as Interviewer and Interviewee, in reverse chronological order. Each row shall display: date, company, role, capacity (Interviewer/Interviewee), session status, and a View Feedback link for completed sessions. If feedback was not submitted by the Interviewer, the completed session shall display 'Awaiting Feedback' instead of the View Feedback link."),
      ...reqBlock("FR-027", "Feedback Submission Reminder",
        "If a session's scheduled_at time has passed by more than 2 hours and the Interviewer has not submitted feedback, the system shall send the Interviewer a single in-app and email reminder: 'Don't forget to submit feedback for your session with [name].' Only one reminder shall be sent per session."),
      ...reqBlock("FR-028", "Session Reminders",
        "The system shall send in-app and email reminder notifications to both session participants 24 hours before and 1 hour before the scheduled_at time. Reminders shall be triggered via Vercel Cron."),

      spacer(60),
      h2("3.6 Admin"),
      ...reqBlock("FR-029", "Admin Interface",
        "The system shall provide an admin interface accessible only to users with the admin role (assigned directly in Supabase). The admin interface shall display: (1) total number of registered users; (2) total number of sessions broken down by status (pending, accepted, completed, cancelled, expired, slots_rejected); (3) ability to deactivate any user account. Deactivated users shall be immediately prevented from logging in."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 4 — USE CASES
      // ══════════════════════════════════════════════════════════════════════
      h1("4. Use Cases", "s4"),
      spacer(40),

      h2("UC-001: User Registration & Onboarding"),
      makeTable(["Field", "Detail"], [
        ["Actor", "New User"],
        ["Preconditions", "User has a valid institutional email. User has not previously registered."],
        ["Postconditions", "Account created, email verified, profile complete, availability ON, user on dashboard."],
      ], [2400, 6960]),
      spacer(80),
      h3("Main Flow"),
      numbered("User navigates to PeerPrep and clicks Sign Up or Continue with Google"),
      numbered("Email/password: user enters name, institutional email, password → system sends verification email → user clicks link → system verifies"),
      numbered("Google OAuth: user selects institutional Google account → system checks domain whitelist → proceeds"),
      numbered("System redirects to onboarding Step 1 — user confirms name, enters graduation year"),
      numbered("Step 2 — user searches company, selects role, selects targeting/experienced. Repeatable for multiple entries. At least one required."),
      numbered("Step 3 — user optionally adds skills and/or uploads resume (PDF, max 5MB)"),
      numbered("User clicks Finish — profile created, availability set to ON, redirected to dashboard"),
      spacer(60),
      h3("Alternate & Exception Flows"),
      bullet("A1 — User skips Step 3: onboarding completes without skills or resume"),
      bullet("A2 — Browser closed mid-onboarding: system resumes from last incomplete step on next login"),
      bullet("E1 — Email already registered: system displays error, blocks duplicate account creation"),
      bullet("E2 — Verification link expired (after 24 hours): system offers Resend verification email"),
      bullet("E3 — Resume invalid (not PDF or over 5MB): inline error, user can retry or skip"),
      bullet("E4 — Non-whitelisted domain: system displays 'Your institution is not yet supported'"),
      spacer(120),

      h2("UC-002: Search & Discover Interviewer"),
      makeTable(["Field", "Detail"], [
        ["Actor", "Seeker (logged-in user)"],
        ["Preconditions", "User logged in, onboarding complete. At least one other same-college user with availability ON exists."],
        ["Postconditions", "Seeker views filtered peer list and selects one to view profile."],
      ], [2400, 6960]),
      spacer(80),
      h3("Main Flow"),
      numbered("Seeker navigates to Search page"),
      numbered("System displays default list of same-college available users"),
      numbered("Seeker enters company name, optionally filters by role and targeting/experienced status"),
      numbered("System returns matching user cards"),
      numbered("Seeker clicks a card to view full profile"),
      numbered("Seeker decides to send a session request (proceeds to UC-003)"),
      spacer(60),
      h3("Alternate & Exception Flows"),
      bullet("A1 — No filters: results ordered by number of company-role entries (most active first)"),
      bullet("A2 — No matches: system displays 'No available interviewers found. Try removing filters.'"),
      bullet("A3 — Own profile excluded from all results"),
      bullet("E1 — No same-college users: system displays 'You are the first from your college!' with share link"),
      spacer(120),

      h2("UC-003: Send & Accept Session Request"),
      makeTable(["Field", "Detail"], [
        ["Actors", "Seeker (initiator), Helper (recipient)"],
        ["Preconditions", "Both users logged in, same college, Helper has availability ON. No duplicate pending request exists."],
        ["Postconditions", "Session accepted, Daily.co room generated, AI question sheet triggered, both parties notified."],
      ], [2400, 6960]),
      spacer(80),
      h3("Main Flow"),
      numbered("Seeker opens Helper profile, clicks Request Interview"),
      numbered("Seeker selects company (from own company-role entries), proposes 1–5 time slots, chooses resume share Yes/No, adds optional note"),
      numbered("If resume share Yes and no resume exists: system prompts Seeker to upload resume first"),
      numbered("Seeker submits — session created with status pending — Helper notified via in-app + email"),
      numbered("Helper opens request, reviews slots and Seeker details"),
      numbered("Helper selects a slot → system creates Daily.co room → stores URL → session status: accepted → Seeker notified → AI question generation triggered"),
      spacer(60),
      h3("Alternate & Exception Flows"),
      bullet("A1 — Helper selects 'None of these slots work' with optional note → status: slots_rejected → Seeker notified → Seeker can send new request"),
      bullet("A2 — Helper declines → status: cancelled → Seeker receives polite system message"),
      bullet("A3 — 72 hours pass with no response → status: expired → Seeker notified"),
      bullet("A4 — Seeker cancels before Helper responds → status: cancelled"),
      bullet("A5 — Groq API fails at question generation → system retries once → if fails, serves cached fallback → session proceeds"),
      bullet("E1 — Duplicate request: system blocks and displays 'You already have a pending request with this user for this company'"),
      bullet("E2 — All proposed dates in the past: system displays inline validation error"),
      spacer(120),

      h2("UC-004: Conduct Interview Session"),
      makeTable(["Field", "Detail"], [
        ["Actors", "Interviewer (Helper), Interviewee (Seeker)"],
        ["Preconditions", "Session status is accepted. AI question sheet generated. scheduled_at time has arrived."],
        ["Postconditions", "Interview conducted. Questions tracked. Feedback submitted. Session status: completed."],
      ], [2400, 6960]),
      spacer(80),
      h3("Pre-Session (before scheduled_at)"),
      numbered("Interviewer navigates to session — sees question sheet full-width (read-only), meeting link visible"),
      numbered("Interviewer reviews DSA questions, brute/optimal hints, HR and project questions"),
      spacer(60),
      h3("Live Session (at or after scheduled_at)"),
      numbered("Session screen transitions: Left panel (question checklist), Centre panel (Daily.co video iframe), Right panel (feedback form)"),
      numbered("Both users join video call via embedded iframe (or fallback new tab link)"),
      numbered("Interviewer checks off DSA questions as asked — state saved in real time"),
      numbered("Interviewer fills feedback form progressively during session"),
      numbered("Interviewer clicks Submit Feedback — system validates at least one field filled"),
      numbered("Session status updated to completed — Interviewee notified"),
      spacer(60),
      h3("Alternate & Exception Flows"),
      bullet("A1 — Interviewer closes tab mid-session: checked questions and partial feedback saved; state restored on return"),
      bullet("A2 — Interviewee views session screen: sees video and session details only; never sees question sheet or feedback form"),
      bullet("E1 — Empty feedback form submission attempt: system displays 'Please fill at least one field'"),
      bullet("E2 — Question sheet fails to load: system displays retry button; feedback form remains functional"),
      spacer(120),

      h2("UC-005: View Feedback & Session History"),
      makeTable(["Field", "Detail"], [
        ["Actors", "Interviewee, Interviewer"],
        ["Preconditions", "At least one session with status completed exists. Feedback submitted."],
        ["Postconditions", "User has viewed feedback. No data modified."],
      ], [2400, 6960]),
      spacer(80),
      h3("Main Flow — Interviewee"),
      numbered("Interviewee receives in-app + email notification that feedback is available"),
      numbered("Navigates to session history page"),
      numbered("Clicks View Feedback on a completed session"),
      numbered("System displays: ratings for all 5 categories (visual score display), free text notes"),
      numbered("Interviewee reads feedback — no response or edit action available"),
      spacer(60),
      h3("Main Flow — Interviewer"),
      numbered("Interviewer navigates to session history"),
      numbered("Clicks View Feedback — sees the feedback they submitted as a read-only record"),
      spacer(60),
      h3("Exception Flows"),
      bullet("E1 — Unauthorized URL access: system returns 403"),
      bullet("E2 — No completed sessions: system displays 'No completed sessions yet. Start by requesting or accepting an interview.'"),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 5 — DATA MODEL
      // ══════════════════════════════════════════════════════════════════════
      h1("5. Data Model", "s5"),
      spacer(40),

      h2("5.1 Schema Overview"),
      makeTable(
        ["Table", "Description", "Key Fields"],
        [
          ["users", "One record per registered user", "id, name, email, college, graduation_year, skills[], resume_url, availability, created_at"],
          ["companies", "Predefined company list (seeded from GitHub repo)", "id, name, slug"],
          ["user_companies", "User's company-role associations (many-to-many)", "id, user_id (FK), company_id (FK), role, type (targeting/experienced)"],
          ["sessions", "Mock interview session records", "id, interviewee_id, interviewer_id, company_id, status, scheduled_at, daily_room_url, resume_shared, proposed_slots (JSON), questions_json, created_at"],
          ["feedback", "Structured feedback per completed session", "id, session_id (FK), clarity_score, communication_score, problem_solving_score, code_quality_score, time_management_score, notes, created_at"],
          ["notifications", "In-app notification records", "id, user_id (FK), type, message, read, created_at"],
        ],
        [2000, 2800, 4560]
      ),
      spacer(120),

      h2("5.2 Session Status Enum"),
      makeTable(
        ["Status", "Meaning", "Next Possible States"],
        [
          ["pending", "Request sent, awaiting Helper response", "accepted, slots_rejected, cancelled, expired"],
          ["slots_rejected", "Helper rejected proposed slots (not the request)", "pending (new request sent)"],
          ["accepted", "Slot confirmed, Daily.co room generated", "completed, expired"],
          ["completed", "Feedback submitted by Interviewer", "— (terminal)"],
          ["cancelled", "Declined by Helper or cancelled by Seeker", "— (terminal)"],
          ["expired", "No response in 72hrs (pending) or 24hrs past scheduled_at (accepted)", "— (terminal)"],
        ],
        [2200, 3560, 3600]
      ),
      spacer(120),

      h2("5.3 Resume Access Policy"),
      body("Resumes are stored in a private Supabase Storage bucket. Access is granted exclusively via server-generated signed URLs (24-hour expiry) under these conditions:"),
      bullet("The resume owner accesses their own resume"),
      bullet("An Interviewer accesses a shared resume while the session status is accepted"),
      body("After session status changes to completed, the system shall not generate new signed URLs for the Interviewer. The Interviewee retains permanent access to their own resume."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 6 — NON-FUNCTIONAL REQUIREMENTS
      // ══════════════════════════════════════════════════════════════════════
      h1("6. Non-Functional Requirements", "s6"),
      spacer(40),

      h2("6.1 Performance"),
      ...nfrBlock("NFR-001", "Search Response Time",
        "The system shall return search results within 2 seconds of query submission, measured from submission to results rendered on screen, under a concurrent load of up to 200 users."),
      ...nfrBlock("NFR-002", "AI Question Generation Time",
        "The system shall complete Groq API question generation and populate the session's questions_json field within 15 seconds of session acceptance. Generation shall occur asynchronously via a Supabase Edge Function. The acceptance confirmation shall not be blocked by generation. The session screen shall poll for questions_json every 2 seconds and display a 'Generating question sheet...' indicator until populated."),
      ...nfrBlock("NFR-003", "UI Interaction Feedback",
        "All interactive elements (buttons, form fields, toggles) shall provide immediate visual feedback (loading state, disabled state, success/error state) within 100ms of user interaction."),
      ...nfrBlock("NFR-004", "Concurrent User Capacity",
        "The system shall be designed to support up to 200 concurrent users across multiple colleges. Initial deployment shall be validated at 50 concurrent users."),

      spacer(60),
      h2("6.2 Security"),
      ...nfrBlock("NFR-005", "API Key Security",
        "All API keys (Groq, Supabase service role, Daily.co, Resend) shall be stored as server-side environment variables and accessed exclusively via Next.js API routes or Supabase Edge Functions. No API key shall be exposed to the client-side JavaScript bundle."),
      ...nfrBlock("NFR-006", "Resume Privacy",
        "Resumes shall be stored in a private Supabase Storage bucket and never publicly accessible via URL. All access shall be via server-side signed URLs with a 24-hour expiry, restricted to the conditions defined in Section 5.3."),
      ...nfrBlock("NFR-007", "Feedback Access Control",
        "Session feedback records shall only be accessible to the two session participants, enforced via Supabase Row Level Security (RLS) policies. Unauthorized access attempts shall return a 403 response."),
      ...nfrBlock("NFR-008", "HTTPS Only",
        "All data transmission between client and server shall occur over HTTPS only. Supabase and Vercel enforce this by default."),

      spacer(60),
      h2("6.3 Usability"),
      ...nfrBlock("NFR-009", "Responsive Design",
        "The application shall be fully responsive and functional on: mobile (min 375px), tablet (min 768px), and desktop (min 1280px). On viewports below 1024px, the three-panel session screen shall stack vertically: video call on top, question sheet in middle, feedback form at bottom."),
      ...nfrBlock("NFR-010", "Design Quality",
        "The visual design shall follow a clean, structured aesthetic referencing LeetCode's information density and layout familiarity. The design shall avoid generic unstyled component defaults, default Tailwind color palettes, and indiscriminate glassmorphism. Typography, spacing, and color usage shall be intentional and consistent across all pages. The application shall be clearly distinguishable from generic AI-generated web interfaces."),

      spacer(60),
      h2("6.4 Availability & Reliability"),
      ...nfrBlock("NFR-011", "Supabase Inactivity Prevention",
        "The system shall implement a daily automated ping to the Supabase database to prevent free-tier inactivity pause (which occurs after 7 days of inactivity). This shall be implemented as a Vercel Cron Job running once every 24 hours at 00:00 UTC."),
      ...nfrBlock("NFR-012", "Groq API Fallback",
        "In the event of a Groq API failure or rate limit error: (1) the system shall retry the request once after a 3-second delay; (2) if retry fails, the system shall serve pre-cached question hints from a static fallback JSON file seeded at build time for the top 10 most common companies; (3) if the company has no cache entry, the Interviewer shall see 'Question sheet unavailable. You can proceed with your own questions.' The session shall proceed normally in all fallback cases."),
      ...nfrBlock("NFR-013", "GitHub CSV Caching",
        "DSA question data fetched from the GitHub repository shall be cached server-side in Supabase and refreshed once every 7 days. The system shall never fetch directly from GitHub Raw API on a per-session-acceptance basis."),

      spacer(60),
      h2("6.5 Data Retention"),
      ...nfrBlock("NFR-014", "Data Retention Policy",
        "Session records, feedback, and question sheets shall be retained indefinitely unless a user deletes their account. Upon account deletion, all personally identifiable data belonging to that user shall be removed within 30 days."),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 7 — CONSTRAINTS & ASSUMPTIONS
      // ══════════════════════════════════════════════════════════════════════
      h1("7. Constraints & Assumptions", "s7"),
      spacer(40),

      h2("7.1 Technical Constraints"),
      makeTable(
        ["ID", "Constraint", "Impact & Mitigation"],
        [
          ["TC-001", "Vercel free tier: 10-second serverless function timeout", "Groq generation moved to Supabase Edge Function (150s timeout). Vercel triggers; client polls."],
          ["TC-002", "Supabase free tier: 500MB DB, 1GB storage, pauses after 7 days inactivity", "Resume size-limited to 5MB. Daily ping cron prevents pause (NFR-011)."],
          ["TC-003", "Groq free tier: 30 req/min, 6,000 tokens/min, 14,400 req/day", "Single prompt per session. Static fallback cache for Groq downtime (NFR-012)."],
          ["TC-004", "GitHub Raw API: 60 unauthenticated requests/hour per IP", "CSV cached in Supabase, refreshed weekly. Never fetched per request (NFR-013)."],
          ["TC-005", "Next.js serverless functions: no persistent memory between requests", "All state in Supabase. No in-memory caching."],
          ["TC-006", "Google OAuth: requires configured Google Cloud project + OAuth consent screen", "One-time setup (~30 min). Must complete before auth works."],
          ["TC-007", "Daily.co free tier: 2,000 participant-minutes (not room creation)", "16–17 full sessions (60 min, 2 participants each). Upgrade plan when user base grows."],
          ["TC-008", "Daily.co API key: server-side only", "Room creation via Next.js API route only. Room URL is shareable (non-secret)."],
          ["TC-009", "College domain whitelist: maintained as server-side JSON config", "Adding colleges requires config update, no code change. Initial list: 15 institutions."],
          ["TC-010", "Resend free tier: 3,000 emails/month, 100/day", "Sufficient for prototype. Monitor usage as user base grows."],
        ],
        [1000, 3560, 4800]
      ),
      spacer(120),

      h2("7.2 Out of Scope — v1"),
      makeTable(
        ["ID", "Feature", "Deferred To"],
        [
          ["SC-001", "Real-time in-app chat between users", "v2"],
          ["SC-002", "Question upvoting / community contributions", "v2"],
          ["SC-003", "Mobile native app (iOS/Android)", "v2"],
          ["SC-004", "Payment or compensation for Interviewers", "v2"],
          ["SC-005", "Company verification of interviewer claims", "v2"],
          ["SC-006", "System design interview questions", "v2"],
          ["SC-007", "Interview recording or transcription", "v2"],
          ["SC-008", "Rich HTML email templates", "v2"],
          ["SC-009", "Real-time AI question suggestions during live session", "v2"],
          ["SC-010", "User-initiated account deletion", "v2"],
          ["SC-011", "Auto-cancel sessions when a user is deactivated", "v2"],
        ],
        [1000, 4560, 3800]
      ),
      spacer(120),

      h2("7.3 Assumptions"),
      makeTable(
        ["ID", "Assumption", "Risk If Wrong"],
        [
          ["AS-001", "Institutional email domains are unique per college (e.g. iitr.ac.in = IIT Roorkee only)", "If two colleges share a domain, college scoping breaks. Mitigated by manual whitelist curation."],
          ["AS-002", "snehasishroy GitHub repo remains public and CSV structure does not change", "Question fetching breaks. Mitigated by weekly cache — system continues serving cached data."],
          ["AS-003", "Groq free tier remains available without credit card", "AI features break. Mitigated by static fallback cache (NFR-012)."],
          ["AS-004", "Daily.co free tier continues to offer 2,000 participant-minutes", "Video calling breaks above free limit. Mitigation: upgrade plan."],
          ["AS-005", "Users self-report interview experience honestly", "No enforcement in v1. Platform is trust-based."],
          ["AS-006", "Target companies have corresponding folders in the GitHub CSV repo", "Companies not in repo will have no DSA questions — AI hint generation still works for HR/project questions."],
          ["AS-007", "Vercel Cron is available on the free tier", "If removed: DB may pause. Mitigation: manual ping script as backup."],
          ["AS-008", "Users access platform on modern Chrome/Firefox/Edge browsers", "No IE or legacy browser support planned."],
        ],
        [1000, 3560, 4800]
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 8 — REQUIREMENTS TRACEABILITY MATRIX
      // ══════════════════════════════════════════════════════════════════════
      h1("8. Requirements Traceability Matrix", "s8"),
      spacer(40),
      body("Every user goal maps to at least one finalized requirement."),
      spacer(60),
      makeTable(
        ["User Goal", "Requirement(s)", "Use Case"],
        [
          ["Register and verify identity", "FR-001, FR-002, FR-003", "UC-001"],
          ["Complete profile with companies and roles", "FR-004, FR-005", "UC-001"],
          ["Upload resume optionally", "FR-006", "UC-001"],
          ["Reset forgotten password", "FR-007", "UC-001"],
          ["Edit profile post-onboarding", "FR-008", "—"],
          ["Find peers to interview me", "FR-009, FR-010, FR-011", "UC-002"],
          ["Signal availability to others", "FR-012", "UC-002"],
          ["Send a session request with multiple slots", "FR-013, FR-014", "UC-003"],
          ["Share resume with interviewer", "FR-013", "UC-003"],
          ["Accept, reject slots, or decline a request", "FR-015", "UC-003"],
          ["Auto-generate video meeting room", "FR-016", "UC-003"],
          ["Get AI-generated question sheet", "FR-017", "UC-004"],
          ["Handle unanswered / abandoned sessions", "FR-018, FR-019", "UC-003"],
          ["Review questions before session starts", "FR-020", "UC-004"],
          ["Conduct session with video + questions + feedback", "FR-021, FR-022, FR-023", "UC-004"],
          ["Receive and view structured feedback", "FR-024, FR-025, FR-026", "UC-005"],
          ["Get reminded about upcoming sessions", "FR-028", "—"],
          ["Be nudged to submit feedback", "FR-027", "—"],
          ["View all past sessions", "FR-026", "UC-005"],
          ["Admin moderation and stats", "FR-029", "—"],
          ["College-scoped discovery", "FR-009, TC-009", "UC-002"],
          ["Resume privacy after session", "NFR-006, FR-025", "—"],
          ["Platform stays alive on free tier", "NFR-011, NFR-013", "—"],
          ["Graceful AI failure handling", "NFR-012, FR-017", "UC-003"],
        ],
        [3560, 2200, 1800]  // reduced to fit 3 cols in 9360
        // Note: sum = 7560; adjust for full width
      ),

      pageBreak(),

      // ══════════════════════════════════════════════════════════════════════
      // SECTION 9 — BUILD PRIORITY
      // ══════════════════════════════════════════════════════════════════════
      h1("9. Build Priority (3-Day Sprint)", "s9"),
      spacer(40),
      body("Given a 3-day solo development timeline, requirements are prioritized as follows:"),
      spacer(60),
      makeTable(
        ["Priority", "Requirements", "Estimated Effort"],
        [
          ["🔴 Must Have (Day 1–2)", "FR-001–006, FR-009–017, FR-020–026", "~2 days"],
          ["🟡 Should Have (Day 2–3)", "FR-007, FR-008, FR-012, FR-022, FR-027, FR-028, FR-029", "~0.5 days"],
          ["🟢 Nice to Have (Day 3)", "NFR-011 (cron), NFR-012 (fallback cache), NFR-013 (CSV cache), FR-018, FR-019", "~0.5 days"],
        ],
        [2200, 4560, 2600]
      ),
      spacer(120),
      new Table({
        width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360],
        rows: [new TableRow({ children: [new TableCell({
          borders: { top: border(GREEN), bottom: border(GREEN), left: { style: BorderStyle.SINGLE, size: 16, color: GREEN }, right: border(GREEN) },
          shading: { fill: LIGHTGREEN, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: "✅  Build Recommendation", font: "Arial", size: 22, bold: true, color: GREEN })], spacing: { before: 0, after: 80 } }),
            new Paragraph({ children: [new TextRun({ text: "Start with must-have requirements to get the core loop working: register → search → request → accept → session → feedback → history. Add should-have and nice-to-have features as time allows. The core loop is what demonstrates value and should be fully functional before polish.", font: "Arial", size: 20, color: BLACK })] })
          ]
        })] })]
      }),

      spacer(240),
      new Paragraph({
        children: [new TextRun({ text: "End of Document", font: "Arial", size: 20, color: MIDGREY, italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 0 }
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/mnt/user-data/outputs/PeerPrep_SRS_v1.0.docx", buffer);
  console.log("SRS generated successfully.");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
