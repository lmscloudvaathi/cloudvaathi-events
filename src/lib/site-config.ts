/** Public contact email shown in the site footer and enrollment emails. */
export const CONTACT_EMAIL = "lmscloudvaathi@gmail.com";

/** Official social profiles linked from the site footer. */
export const SOCIAL_LINKS = [
  { name: "YouTube", href: "https://www.youtube.com/channel/UClxuspjX9z2unsFV-JEQwkg" },
  { name: "Instagram", href: "https://www.instagram.com/cloudvaathi_universe/" },
  { name: "LinkedIn", href: "https://www.linkedin.com/company/cloudvaathi/" },
] as const;

/** Logo served from `public/`. */
export const BRAND_LOGO_PATH = "/CloudVaathiLogo.png";

export const FAVICON_PATH = BRAND_LOGO_PATH;

export const BRAND_NAME = "Cloud Vaathi";

export const BRAND_TAGLINE = "Learn – Certify – Transform";

export const HERO_HEADLINE = "Learn deeply. Certify confidently. Transform your career.";

export const HERO_EYEBROW = "Cloud • Cybersecurity • AI";

export const HERO_SUBTEXT =
  "Cloud Vaathi helps professionals turn complex cloud, cybersecurity and AI concepts into practical, job-ready capability — through live mentoring, hands-on labs and certification paths built by a practitioner, not a course factory.";

export const FOUNDER_NAME = "Sivva Kannan";

export const FOUNDER_ROLE =
  "Cybersecurity Associate Manager – EY | Director – Training, ISACA Chennai";

export const FOUNDER_CREDIBILITY_TAG = "Cybersecurity Leader • Global Educator • Certification Strategist";

/** Clean headshot served from `public/` (About page). */
export const FOUNDER_PHOTO_PATH = "/sivva-kannan.jpg";

/** Stage / speaking photos for the homepage "Meet our Founder" carousel.
 *  `position` is CSS object-position so Sivva stays centered in the 4:5 crop. */
export const FOUNDER_GALLERY = [
  { src: "/founder/sivva-01.jpg", position: "78% 22%" },
  { src: "/founder/sivva-02.jpg", position: "72% 28%" },
  { src: "/founder/sivva-03.jpg", position: "80% 24%" },
  { src: "/founder/sivva-04.jpg", position: "62% 20%" },
  { src: "/founder/sivva-05.jpg", position: "70% 26%" },
] as const;

export const FOUNDER_INTRO =
  "Sivva Kannan is a cybersecurity professional, cloud security specialist and global educator with 14+ years of experience across Accenture and EY. As an ISC2 Authorized Instructor, Microsoft Certified Trainer and Director – Training at ISACA Chennai, he has trained 12,000+ professionals and mentored 1,000+ learners toward certification success across Cloud, TOGAF, Security Architecture, Governance and AI.";

export const TRUST_STATS = [
  { value: "14+ years", label: "Industry experience" },
  { value: "40+", label: "Credentials held", profileLink: true },
  { value: "12,000+", label: "Professionals trained" },
  { value: "1,000+", label: "Learners mentored to certification success" },
] as const;

export const CREDENTIAL_SNAPSHOT = ["CISM", "CISSP", "CCSP", "AZ-500", "TOGAF", "AAIA"] as const;

/** Mentor intro + teaching demo on the Cloud Vaathi channel. Captions available in the player. */
export const SAMPLE_SESSION = {
  youtubeId: "fGziJ958T-E",
  title: "Think like a manager — a sample Cloud Vaathi session",
  thumbnailAlt: "Sivva Kannan teaching a Cloud Vaathi sample session on certification mindset",
} as const;
