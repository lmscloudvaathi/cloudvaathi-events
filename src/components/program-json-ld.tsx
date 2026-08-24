import { schemaEventStatus, type HubProgram, programStatus } from "@/lib/program-lifecycle";

export function ProgramJsonLd({ program }: { program: HubProgram }) {
  const status = programStatus(program);
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: program.title,
    description: program.summary,
    startDate: program.startDate,
    endDate: program.endDate,
    eventStatus: schemaEventStatus(status),
    eventAttendanceMode: /online/i.test(program.format)
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: "Cloud Vaathi",
    },
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
