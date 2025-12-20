import { Link } from "react-router-dom";

const Card = ({ title, desc, to }: { title: string; desc: string; to: string }) => (
  <Link
    to={to}
    style={{
      display: "block",
      padding: 16,
      borderRadius: 14,
      background: "white",
      boxShadow: "var(--shadow-soft)",
      textDecoration: "none",
      border: "1px solid var(--border-soft)",
    }}
  >
    <div style={{ fontWeight: 900, color: "var(--espe-green)", marginBottom: 6 }}>{title}</div>
    <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{desc}</div>
  </Link>
);

export default function DashboardSuperAdmin() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="rounded-lg bg-white p-4 shadow-espeSoft">
        <h2 style={{ margin: 0, fontWeight: 900 }}>Panel Súper Administrador</h2>
        <p style={{ marginTop: 6, color: "var(--text-muted)" }}>
          Configuración global del sistema: carreras, periodos, docentes, rúbricas y asignación de personal.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <Card title="Carreras" desc="CRUD + búsqueda + estado" to="/carreras" />
        <Card title="Períodos" desc="CRUD + filtros + estado" to="/periodos" />
        <Card title="Docentes" desc="Gestión global de docentes" to="/docentes" />
        <Card title="Asignación de personal" desc="Asignar rol 2 (directores/apoyo) por carrera" to="/asignacion-personal" />
        <Card title="Rúbricas" desc="Componentes, criterios y niveles" to="/rubricas" />
      </div>
    </div>
  );
}
