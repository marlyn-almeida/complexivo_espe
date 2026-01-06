import { useNavigate } from "react-router-dom";
import "./SelectRolePage.css";

import { getSession, setSession, clearSession } from "../../utils/auth";
import { setActiveRole } from "../../services/auth.service";
import type { RoleLite } from "../../services/auth.service";

function roleLabel(r: RoleLite) {
  if (r.nombre_rol === "SUPER_ADMIN") return "Súper Administrador";
  if (r.nombre_rol === "ADMIN") return "Administrador (Director / Apoyo)";
  if (r.nombre_rol === "DOCENTE") return "Docente";
  return r.nombre_rol;
}

function roleIcon(r: RoleLite) {
  if (r.nombre_rol === "SUPER_ADMIN") return "🛡️";
  if (r.nombre_rol === "ADMIN") return "🏛️";
  if (r.nombre_rol === "DOCENTE") return "👨‍🏫";
  return "👤";
}

export default function SelectRolePage() {
  const navigate = useNavigate();
  const session = getSession();

  if (!session || !session.roles || session.roles.length === 0) {
    clearSession();
    navigate("/login", { replace: true });
    return null;
  }

  const handleSelect = async (role: RoleLite) => {
    const res = await setActiveRole(role.id_rol);

    setSession({
      accessToken: res.accessToken,
      roles: res.roles,
      activeRole: res.activeRole,
    });

    navigate(res.redirectTo, { replace: true });
  };

  return (
    <div className="select-role-page">
      <h1>Selecciona el perfil</h1>
      <p>Elige con qué rol deseas ingresar al sistema.</p>

      <div className="select-role-grid">
        {session.roles.map((r) => (
          <button
            key={r.id_rol}
            className="select-role-card"
            onClick={() => handleSelect(r)}
          >
            <span className="select-role-icon">{roleIcon(r)}</span>
            <span className="select-role-title">{roleLabel(r)}</span>
            <span className="select-role-sub">{r.nombre_rol}</span>
          </button>
        ))}
      </div>

      <button className="select-role-cancel" onClick={() => navigate("/login")}>
        Cancelar
      </button>
    </div>
  );
}
