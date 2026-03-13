import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Training Spaces",
  description:
    "Find agility training facilities near you. Browse indoor and outdoor spaces with equipment details and rental info.",
};

export default function TrainingSpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
