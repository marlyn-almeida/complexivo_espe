// src/pages/dashboard/DashboardAdmin.tsx
import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardAdmin() {
  const items: DashItem[] = [
    { label: "Docentes", to: "/docentes", icon: "docentes" },
    { label: "Estudiantes", to: "/estudiantes", icon: "estudiantes" },
    { label: "Tribunales", to: "/tribunales", icon: "tribunales" },
    { label: "Casos de estudio", to: "/casos-estudio", icon: "casosEstudio" },
    // Cuando crees estas rutas, las activas:
    // { label: "Calificaciones", to: "/calificaciones", icon: "rubricas" },
    // { label: "Actas firmadas", to: "/actas-firmadas", icon: "acta" },
  ];

  return <DashboardBase items={items} role="DIRECTOR" />;
}
