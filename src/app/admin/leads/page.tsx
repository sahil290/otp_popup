import type { Metadata } from "next";
import AdminLeadsApp from "@/components/admin/AdminLeadsApp";

export const metadata: Metadata = {
  title: "Leads · Admin",
  description: "Verified OTP leads",
  robots: { index: false, follow: false },
};

export default function AdminLeadsPage() {
  return <AdminLeadsApp />;
}
