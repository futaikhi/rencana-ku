export function formatIDR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount).replace(/\s+/g, "");
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return "No date set";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatMonthYear(dateString?: string | null): string {
  if (!dateString) return "Flexible";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string): string {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export const CATEGORIES = [
  { id: "Wedding", label: "Wedding", icon: "HeartHandshake", color: "#C45A38" },
  { id: "House", label: "Build / Buy House", icon: "Home", color: "#3B6E58" },
  { id: "Vacation", label: "Vacation & Travel", icon: "Plane", color: "#B8731F" },
  { id: "Car", label: "Vehicle / Car", icon: "Car", color: "#4B5563" },
  { id: "Education", label: "Education & Skills", icon: "GraduationCap", color: "#5A67D8" },
  { id: "Renovation", label: "Home Renovation", icon: "Hammer", color: "#D97706" },
  { id: "Business", label: "Business Launch", icon: "Rocket", color: "#0F766E" },
  { id: "Personal", label: "Personal Goal", icon: "Target", color: "#7C3AED" },
  { id: "Custom", label: "Custom Plan", icon: "Sparkles", color: "#2563EB" },
];

export const PLAN_TEMPLATES = [
  {
    id: "tpl_wedding",
    name: "Wedding Celebration",
    category: "Wedding",
    icon: "HeartHandshake",
    color: "#C45A38",
    description: "Plan every detail of our dream wedding with family and loved ones.",
    budget_enabled: true,
    budget_target: 75000000,
    sampleMilestones: [
      "Decide Wedding Date & Guest Roster",
      "Survey & Book Venue",
      "Choose Caterer & Photographer",
      "Attire & Makeup Fittings",
      "Send Invitations & Collect RSVPs",
      "Wedding Day Execution",
    ],
    sampleTasks: [
      "Finalize headcount with parents",
      "Schedule garden venue walkthroughs",
      "Food tasting session with caterer",
      "Book documentary photographer",
      "Tailor bespoke bridal attire",
      "Print eco-friendly invitations",
    ],
  },
  {
    id: "tpl_house",
    name: "Build a House",
    category: "House",
    icon: "Home",
    color: "#3B6E58",
    description: "From land acquisition to architectural blueprints and moving day.",
    budget_enabled: true,
    budget_target: 500000000,
    sampleMilestones: [
      "Land Acquisition & Notary Registration",
      "Architectural Blueprint & PBG Permit",
      "Foundation & Structural Framing",
      "Roofing & Masonry",
      "Interior Finishing & Handover",
    ],
    sampleTasks: [
      "Topographic soil test",
      "Review spatial layout with architect",
      "Submit PBG building permit",
      "Tender 3 contractor bids",
      "Inspect electrical & plumbing rough-ins",
    ],
  },
  {
    id: "tpl_japan",
    name: "Japan Autumn Trip",
    category: "Vacation",
    icon: "Plane",
    color: "#B8731F",
    description: "Tokyo, Kyoto, and Takayama autumn foliage exploration.",
    budget_enabled: true,
    budget_target: 30000000,
    sampleMilestones: [
      "Flight & Tourist Visa",
      "Accommodation & Ryokan Bookings",
      "Itinerary & Train Passes",
      "Packing & Travel Readiness",
    ],
    sampleTasks: [
      "Book roundtrip flights",
      "Apply for Japan tourist e-visa",
      "Reserve authentic onsen ryokan",
      "Order 7-day JR Rail Pass",
      "Rent pocket Wi-Fi router",
    ],
  },
  {
    id: "tpl_japanese",
    name: "Learn Japanese (JLPT N3)",
    category: "Education",
    icon: "GraduationCap",
    color: "#5A67D8",
    description: "Systematic self-study plan to reach conversational fluency (No budget required).",
    budget_enabled: false,
    budget_target: 0,
    sampleMilestones: [
      "JLPT N5 Foundations (800 Vocab & 100 Kanji)",
      "JLPT N4 Intermediate (1,500 Vocab & 300 Kanji)",
      "JLPT N3 Fluency & Mock Exam Pass",
    ],
    sampleTasks: [
      "Complete Genki I textbook exercises",
      "Review daily Anki Kanji deck",
      "Finish Quartet Book 1 grammar",
      "Listen to 30 Japanese podcast episodes",
      "Take timed mock test",
    ],
  },
  {
    id: "tpl_saas",
    name: "Launch SaaS Product",
    category: "Business",
    icon: "Rocket",
    color: "#0F766E",
    description: "Design, build, validate, and launch a software product to first 100 users.",
    budget_enabled: true,
    budget_target: 20000000,
    sampleMilestones: [
      "Problem Validation & Wireframes",
      "MVP Functional Prototype",
      "Private Beta with 20 Users",
      "Public Product Launch",
    ],
    sampleTasks: [
      "Interview 15 target users",
      "Build core workflow components",
      "Setup database & authentication",
      "Create landing page & onboarding",
      "Post launch announcement on Product Hunt",
    ],
  },
];
