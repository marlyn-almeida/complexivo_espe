import React from "react";
import { useNavigate } from "react-router-dom";
import { ACTIVE_ROLE_KEY, ROLES_KEY, dashboardByRole } from "../../utils/auth";
import type { RolId } from "../../utils/auth";

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    const rid = toRolId(id);
    if (!rid) return;

    localStorage.setItem(ACTIVE_ROLE_KEY, String(rid));
    navigate(dashboardByRole(rid), { replace: true });
  };

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span style={{ fontSize: 12, opacity: 0.8 }}>Rol:</span>
      <select value={current || ""} onChange={handleChange}>
        {roles
          .filter((r) => !!toRolId(r.id_rol))
          .map((r) => (
            <option key={r.id_rol} value={r.id_rol}>
              {r.nombre_rol}
            </option>
          ))}
      </select>
    </div>
  );
}
