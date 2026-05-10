import type { ComponentProps } from "react";
import { ItemEnrollmentCta } from "@/components/item-enrollment-cta";

export function EventEnrollmentCta(props: Omit<ComponentProps<typeof ItemEnrollmentCta>, "itemType">) {
  return <ItemEnrollmentCta itemType="event" {...props} />;
}
