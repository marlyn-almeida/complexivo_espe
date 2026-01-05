import { useNavigate } from "react-router-dom";
import "./DashboardPortal.css";

export type DashItem = {
  label: string;
  to: string;
  icon: string; // emoji por ahora
};

export default function DashboardBase({ items }: { items: DashItem[] }) {
  const navigate = useNavigate();

  return (
    <div className="portalWrap">
      <h1 className="portalTitle">Dashboard</h1>

      <section className="portalBox" aria-label="Accesos rápidos">
        <div className="portalGrid">
          {items.map((it) => (
            <button
              key={it.to}
              type="button"
              className="portalTile"
              onClick={() => navigate(it.to)}
              aria-label={`Ir a ${it.label}`}
            >
              <div className="portalIconBox" aria-hidden="true">
                <span className="portalEmoji">{it.icon}</span>
              </div>
              <div className="portalLabel">{it.label}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
