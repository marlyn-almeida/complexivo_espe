import React from "react";
import { useNavigate } from "react-router-dom";
import { ACTIVE_ROLE_KEY, ROLES_KEY, dashboardByRole } from "../../utils/auth";
import type { RolId } from "../../utils/auth";
import { authService } from "../../services/auth.service";

type RoleItem = { id_rol: number; nombre_rol: string };

function toRolId(n: number): RolId | null {
  if (n === 1 || n === 2 || n === 3) return n;
  return null;
}

export default function RoleSwitcher() {
  const navigate = useNavigate();

  const raw = localStorage.getItem(ROLES_KEY);
  const roles: RoleItem[] = raw ? JSON.parse(raw) : [];

  if (!roles.length) return null;

  const current = Number(localStorage.getItem(ACTIVE_ROLE_KEY) || "0");
  const [loading, setLoading] = React.useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const rid = toRolId(id);
    if (!rid) return;

    setLoading(true);
    try {
      // 1) pedir token nuevo al backend (rol activo nuevo)
      const data = await authService.changeActiveRole(rid);

      // 2) guardar token nuevo (ajusta la key si usas otra)
      localStorage.setItem("accessToken", data.accessToken);

      // 3) actualizar rol activo local (para UI)
      localStorage.setItem(ACTIVE_ROLE_KEY, String(rid));

      // 4) si backend devuelve roles "bonitos", refrescamos el cache
      if (Array.isArray(data.roles)) {
        localStorage.setItem(ROLES_KEY, JSON.stringify(data.roles));
      }

      // 5) navegar
      if (data.redirectTo) {
        navigate(data.redirectTo, { replace: true });
      } else {
        navigate(dashboardByRole(rid), { replace: true });
      }
    } catch (err) {
      console.error("Error cambiando rol activo:", err);
      // fallback: no cambiamos rol local si falló backend
      // (si quieres, aquí puedes mostrar un toast)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Rol:</span>

      <select value={current || ""} onChange={handleChange} disabled={loading}>
        {roles
          .filter((r) => !!toRolId(r.id_rol))
          .map((r) => (
            <option key={r.id_rol} value={r.id_rol}>
              {r.nombre_rol}
            </option>
          ))}
      </select>

      {loading && <span style={{ fontSize: 12, opacity: 0.7 }}>Cambiando...</span>}
    </div>
  );
}
