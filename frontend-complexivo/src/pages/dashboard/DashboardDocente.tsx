// src/pages/dashboard/DashboardDocente.tsx
import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardDocente() {
  const items: DashItem[] = [
    { label: "Mis tribunales", to: "/mis-tribunales", icon: "tribunales" },
    { label: "Actas", to: "/actas", icon: "acta" },
    { label: "Mi perfil", to: "/perfil", icon: "perfil" },
  ];

  return <DashboardBase items={items} role="DOCENTE" />;
}
