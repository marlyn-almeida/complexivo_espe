import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardDocente() {
  const items: DashItem[] = [
    { label: "Mis tribunales", to: "/mis-tribunales", icon: "🏛️" },
    { label: "Mi agenda", to: "/mi-agenda", icon: "📅" },
    { label: "Calificar", to: "/calificar", icon: "✅" },
    { label: "Actas", to: "/actas", icon: "📄" },
    { label: "Mi perfil", to: "/perfil", icon: "👤" },
  ];

  return <DashboardBase items={items} />;
}
