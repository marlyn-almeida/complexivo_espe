import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardSuperAdmin() {
  const items: DashItem[] = [
    { label: "Carreras", to: "/carreras", icon: "carreras" },
    { label: "Períodos", to: "/periodos", icon: "periodos" },
    { label: "Rúbricas", to: "/rubricas", icon: "rubricas" },
    { label: "Docentes", to: "/docentes", icon: "docentes" },
    { label: "Plantillas Acta Word", to: "/plantillas-acta", icon: "acta" }, // ✅
  ];

  return <DashboardBase items={items} role="SUPER_ADMIN" />;
}
