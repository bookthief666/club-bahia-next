import type { Metadata } from "next";
import { EventsExperience } from "@/components/events/EventsExperience";

export const metadata: Metadata = {
  title: "Upcoming Events",
  description:
    "Explore Club Bahia programming for live music, dance nights, private events, birthdays, and reservation inquiries.",
  openGraph: {
    title: "Upcoming Events | Club Bahia",
    description:
      "Upcoming Club Bahia programming, private events, birthdays, and reservations on Sunset Boulevard.",
    url: "/events",
  },
};

export default function EventsPage() {
  return <EventsExperience />;
}
