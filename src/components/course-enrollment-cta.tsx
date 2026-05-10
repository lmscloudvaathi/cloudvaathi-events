import type { ComponentProps } from "react";
import { ItemEnrollmentCta } from "@/components/item-enrollment-cta";

export function CourseEnrollmentCta(props: Omit<ComponentProps<typeof ItemEnrollmentCta>, "itemType">) {
  return <ItemEnrollmentCta itemType="course" {...props} />;
}
