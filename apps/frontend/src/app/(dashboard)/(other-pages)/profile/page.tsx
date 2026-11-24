import { Metadata } from "next";

import ProfilePageClient from "@/features/profile/components/ProfilePageClient";


export const metadata: Metadata = {
  title: "Profile | Medical Dashboard",
  description: "Profile",
};

export default function Profile() {
  return <ProfilePageClient />;
}
