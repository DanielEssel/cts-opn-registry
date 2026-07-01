import type { Metadata } from "next";
import CtsAppsShowcase from "@/components/shared/CtsAppsShowcase";

export const metadata: Metadata = {
  title: "CTS Driver App App | CTS Africa",
  description:
    "Discover the CTS Driver App App — the official platform for certified PCRAA drivers to accept ride-hailing, parcel delivery, and gas delivery jobs.",
};

export default function DriverAppPage() {
  return <CtsAppsShowcase />;
}