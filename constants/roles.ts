export const USER_ROLES = [
  "SDE",
  "AI-ML",
  "Data Engineer",
  "Product",
  "Other"
] as const;

export type UserRole = typeof USER_ROLES[number];

export const ROLE_DETAILS: Record<UserRole, { label: string; description: string }> = {
  "SDE": {
    label: "Software Development Engineer (SDE)",
    description: "Core software engineering, web development, algorithms, and system architecture."
  },
  "AI-ML": {
    label: "AI / Machine Learning Engineer",
    description: "Deep learning, natural language processing, model deployment, and data science."
  },
  "Data Engineer": {
    label: "Data Engineer",
    description: "Data pipelines, distributed computing, database optimization, and analytics."
  },
  "Product": {
    label: "Product Manager (PM)",
    description: "Product lifecycle, design, metrics, strategy, and business cases."
  },
  "Other": {
    label: "Other Technical Roles",
    description: "DevOps, Security, QA, UI/UX, or hardware engineering roles."
  }
};
