import DashboardBase from "./DashboardBase";
import type { DashItem } from "./DashboardBase";

export default function DashboardAdmin() {
  const items: DashItem[] = [
    { label: "Docentes", to: "/docentes", icon: "👩‍🏫" },
    { label: "Estudiantes", to: "/estudiantes", icon: "🧑‍🎓" },
    { label: "Franjas horarias", to: "/franjas", icon: "⏱️" },
    { label: "Tribunales", to: "/tribunales", icon: "🏛️" },
  ];

  return <DashboardBase items={items} />;
}
