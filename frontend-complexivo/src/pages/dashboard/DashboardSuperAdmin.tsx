import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardSuperAdmin() {
  const items: DashItem[] = [
    { label: "Carreras", to: "/carreras", icon: "🎓" },
    { label: "Períodos", to: "/periodos", icon: "📅" },
    { label: "Carrera-Período", to: "/carrera-periodo", icon: "🧩" },
    { label: "Rúbricas", to: "/rubricas", icon: "📝" },
    { label: "Docentes", to: "/docentes", icon: "👩‍🏫" },
  ];

  return <DashboardBase items={items} />;
}
