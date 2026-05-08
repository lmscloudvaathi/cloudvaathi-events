export type Course = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  startDate: string;
  price: number;
  seats: number;
  enrolled: number;
  tags: string[];
  instructor: string;
  modules: { title: string; lessons: string[] }[];
};

export type EventItem = {
  slug: string;
  title: string;
  type: "Workshop" | "Tech Talk" | "Hackathon" | "Meetup";
  date: string;
  time: string;
  venue: string;
  price: number;
  seats: number;
  registered: number;
  description: string;
  speakers: string[];
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string;
  itemTitle: string;
  itemType: "Course" | "Event";
  amount: number;
  status: "Paid" | "Pending" | "Refunded";
  registeredAt: string;
};

export const courses: Course[] = [
  {
    slug: "aws-solutions-architect",
    title: "AWS Solutions Architect — Pro Track",
    tagline: "Design resilient, scalable cloud systems on AWS.",
    description:
      "A hands-on bootcamp covering VPC design, multi-AZ deployments, IAM, EKS, serverless and cost optimisation. Build a production-grade architecture in 8 weeks.",
    level: "Advanced",
    duration: "8 weeks · 64 hrs",
    startDate: "2026-06-01",
    price: 14999,
    seats: 40,
    enrolled: 27,
    tags: ["AWS", "Cloud Architecture", "DevOps"],
    instructor: "Arun Prakash",
    modules: [
      { title: "Foundations", lessons: ["Regions & AZs", "IAM deep dive", "VPC design"] },
      { title: "Compute & Containers", lessons: ["EC2 patterns", "ECS vs EKS", "Lambda at scale"] },
      { title: "Data & Resilience", lessons: ["RDS & Aurora", "DynamoDB", "Backup strategies"] },
      { title: "Capstone", lessons: ["Multi-region app", "Cost review", "Mock interview"] },
    ],
  },
  {
    slug: "kubernetes-zero-to-prod",
    title: "Kubernetes: Zero to Production",
    tagline: "Ship containers like a platform team.",
    description:
      "From kubectl basics to GitOps, observability and progressive delivery. Includes lab access on managed clusters.",
    level: "Intermediate",
    duration: "6 weeks · 48 hrs",
    startDate: "2026-05-20",
    price: 9999,
    seats: 50,
    enrolled: 41,
    tags: ["Kubernetes", "DevOps", "GitOps"],
    instructor: "Divya Shankar",
    modules: [
      { title: "Core K8s", lessons: ["Pods & Deployments", "Services", "Ingress"] },
      { title: "Platform", lessons: ["Helm", "ArgoCD", "Observability stack"] },
      { title: "Production", lessons: ["Security", "Autoscaling", "Cost"] },
    ],
  },
  {
    slug: "terraform-iac-mastery",
    title: "Terraform IaC Mastery",
    tagline: "Codify every cloud resource with confidence.",
    description:
      "Modules, workspaces, remote state, drift detection and CI/CD pipelines for infrastructure as code.",
    level: "Intermediate",
    duration: "4 weeks · 32 hrs",
    startDate: "2026-06-15",
    price: 7499,
    seats: 60,
    enrolled: 18,
    tags: ["Terraform", "IaC", "DevOps"],
    instructor: "Karthik R",
    modules: [
      { title: "Core", lessons: ["HCL", "State", "Modules"] },
      { title: "Advanced", lessons: ["Workspaces", "Testing", "Pipelines"] },
    ],
  },
  {
    slug: "azure-fundamentals",
    title: "Azure Fundamentals (AZ-900)",
    tagline: "Your launchpad into Microsoft Azure.",
    description:
      "Pass the AZ-900 exam and build a strong foundation in Azure core services, governance and pricing.",
    level: "Beginner",
    duration: "3 weeks · 24 hrs",
    startDate: "2026-05-12",
    price: 4999,
    seats: 80,
    enrolled: 62,
    tags: ["Azure", "Certification"],
    instructor: "Meera Iyer",
    modules: [
      { title: "Cloud Concepts", lessons: ["Models", "Benefits"] },
      { title: "Azure Core", lessons: ["Compute", "Storage", "Networking"] },
      { title: "Governance", lessons: ["IAM", "Cost", "SLAs"] },
    ],
  },
];

export const events: EventItem[] = [
  {
    slug: "cloud-native-summit-2026",
    title: "Cloud Native Summit 2026",
    type: "Tech Talk",
    date: "2026-06-08",
    time: "09:30 — 18:00 IST",
    venue: "Chennai Trade Centre",
    price: 0,
    seats: 500,
    registered: 312,
    description:
      "A full-day conference featuring 14 speakers across cloud-native, AI infra and platform engineering tracks.",
    speakers: ["Liz Rice", "Kelsey Hightower", "Aparna Sinha"],
  },
  {
    slug: "serverless-workshop",
    title: "Hands-on Serverless Workshop",
    type: "Workshop",
    date: "2026-05-25",
    time: "10:00 — 17:00 IST",
    venue: "Online · Zoom",
    price: 999,
    seats: 80,
    registered: 54,
    description: "Build, deploy and observe a production serverless app on AWS Lambda + API Gateway in one day.",
    speakers: ["Arun Prakash"],
  },
  {
    slug: "devops-hackathon",
    title: "Cloud Vaathi DevOps Hackathon",
    type: "Hackathon",
    date: "2026-07-12",
    time: "48 hours",
    venue: "Bengaluru · Hybrid",
    price: 499,
    seats: 200,
    registered: 88,
    description: "Two-day hackathon with ₹2L prize pool. Build automation tools that solve real platform problems.",
    speakers: ["Panel of judges"],
  },
  {
    slug: "ai-infra-meetup",
    title: "AI Infra Meetup #4",
    type: "Meetup",
    date: "2026-05-18",
    time: "18:30 — 21:00 IST",
    venue: "WeWork Embassy Golf Links",
    price: 0,
    seats: 120,
    registered: 96,
    description: "Casual evening meetup on running LLM workloads in production. Pizza & networking included.",
    speakers: ["Community speakers"],
  },
];

export const participants: Participant[] = [
  { id: "P-1042", name: "Aditi Rao", email: "aditi@example.com", phone: "+91 90000 12345", itemTitle: "Kubernetes: Zero to Production", itemType: "Course", amount: 9999, status: "Paid", registeredAt: "2026-05-02" },
  { id: "P-1043", name: "Vignesh K", email: "vignesh@example.com", phone: "+91 98400 22221", itemTitle: "AWS Solutions Architect — Pro Track", itemType: "Course", amount: 14999, status: "Paid", registeredAt: "2026-05-03" },
  { id: "P-1044", name: "Priya Menon", email: "priya@example.com", phone: "+91 99999 11122", itemTitle: "Hands-on Serverless Workshop", itemType: "Event", amount: 999, status: "Pending", registeredAt: "2026-05-04" },
  { id: "P-1045", name: "Rahul Verma", email: "rahul@example.com", phone: "+91 90000 88811", itemTitle: "Cloud Native Summit 2026", itemType: "Event", amount: 0, status: "Paid", registeredAt: "2026-05-05" },
  { id: "P-1046", name: "Sneha Iyer", email: "sneha@example.com", phone: "+91 90011 22000", itemTitle: "Terraform IaC Mastery", itemType: "Course", amount: 7499, status: "Paid", registeredAt: "2026-05-06" },
  { id: "P-1047", name: "Mohammed Ali", email: "ali@example.com", phone: "+91 98765 43210", itemTitle: "Cloud Vaathi DevOps Hackathon", itemType: "Event", amount: 499, status: "Refunded", registeredAt: "2026-05-07" },
  { id: "P-1048", name: "Lakshmi N", email: "lakshmi@example.com", phone: "+91 90909 80808", itemTitle: "Azure Fundamentals (AZ-900)", itemType: "Course", amount: 4999, status: "Paid", registeredAt: "2026-05-08" },
];

export const formatINR = (n: number) =>
  n === 0 ? "Free" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const findCourse = (slug: string) => courses.find((c) => c.slug === slug);
export const findEvent = (slug: string) => events.find((e) => e.slug === slug);
