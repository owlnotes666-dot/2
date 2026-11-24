import { Metadata } from "next";
import AppointmentsClient from "@/features/appointments/components/AppointmentsClient";

export const metadata: Metadata = {
title: "Appointments | Medical Dashboard",
description: "Manage medical appointments",
};

export default function Appointments() {
return <AppointmentsClient />;
}
