import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

import logo from "../../assets/logo_espe.png";
import campus from "../../assets/campus.jpg";

import { login, setActiveRole } from "../../services/auth.service";
import { setSession, setTempToken } from "../../utils/auth";

type RoleLite = { id_rol: number };

function roleLabel(id: number) {
  if (id === 1) return "Súper Administrador";
  if (id === 2) return "Administrador";
  if (id === 3) return "Docente";
  return `Rol ${id}`;
}

function ChooseRoleModal({
  open,
  roles,
  loading,
  onClose,
  onPick,
}: {
  open: boolean;
  roles: RoleLite[];
  loading: boolean;
  onClose: () => void;
  onPick: (id_rol: number) => void;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          background: "#fff",
          borderRadius: 14,
          padding: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, fontSize: 18 }}>Elige un rol</h3>
        <p style={{ marginTop: 6, marginBottom: 12, color: "#555" }}>
          Tu usuario tiene más de un rol. Selecciona con cuál deseas ingresar.
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          {roles.map((r) => (
            <button
              key={r.id_rol}
              type="button"
              disabled={loading}
              onClick={() => onPick(r.id_rol)}
              style={{
                width: "100%",
                padding: "12px 12px",
                borderRadius: 12,
                border: "1px solid #e5e5e5",
                background: "#fff",
                cursor: loading ? "not-allowed" : "pointer",
                textAlign: "left",
              }}
            >
              <b>{roleLabel(r.id_rol)}</b>
              <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>ID rol: {r.id_rol}</div>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #e5e5e5",
              background: "#fafafa",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();

  const [nombreUsuario, setNombreUsuario] = useState(""); // ✅ nombre_usuario
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openChooseRole, setOpenChooseRole] = useState(false);
  const [roles, setRoles] = useState<RoleLite[]>([]);
  const [chooseLoading, setChooseLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombreUsuario.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      // ✅ BACK espera nombre_usuario
      const data = await login(nombreUsuario.trim(), password, 1);


      if (data.mustChangePassword) {
        setTempToken(data.tempToken);
        navigate("/change-password", { replace: true });
        return;
      }

      // ✅ Guardar sesión (le agregamos nombre_rol en el front para la UI)
      setSession({
        accessToken: data.accessToken,
        roles: data.roles.map((r) => ({ id_rol: r.id_rol, nombre_rol: roleLabel(r.id_rol) })),
        activeRole: data.activeRole ? { id_rol: data.activeRole.id_rol, nombre_rol: roleLabel(data.activeRole.id_rol) } : undefined,
        scope: data.scope ?? null,
      });

      if (data.mustChooseRole) {
        setRoles(data.roles);
        setOpenChooseRole(true);
        return;
      }

      navigate(data.redirectTo || "/superadmin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.userMessage || err?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handlePickRole = async (id_rol: number) => {
    setError(null);
    setChooseLoading(true);
    try {
      const data = await setActiveRole(id_rol);

      setSession({
        accessToken: data.accessToken,
        roles: data.roles.map((r) => ({ id_rol: r.id_rol, nombre_rol: roleLabel(r.id_rol) })),
        activeRole: data.activeRole ? { id_rol: data.activeRole.id_rol, nombre_rol: roleLabel(data.activeRole.id_rol) } : undefined,
        scope: data.scope ?? null,
      });

      setOpenChooseRole(false);
      navigate(data.redirectTo || "/superadmin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.userMessage || err?.message || "No se pudo asignar el rol.");
    } finally {
      setChooseLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-leftImage" style={{ backgroundImage: `url(${campus})` }} />

      <div className="login-rightPanel">
        <div className="login-card">
          <img src={logo} alt="ESPE" className="login-logo" />

          <h1 className="login-title">Acceso al sistema de examen complejo</h1>
          <p className="login-subtitle">Universidad de las Fuerzas Armadas ESPE</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field">
              <label className="field-label">Usuario</label>
              <div className="pill">
                <span className="pill-icon" aria-hidden="true">👤</span>
                <input
                  className="pill-input"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label">Contraseña</label>
              <div className="pill">
                <span className="pill-icon" aria-hidden="true">🔒</span>
                <input
                  type="password"
                  className="pill-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? "Ingresando..." : "Acceder"}
            </button>

            <button type="button" className="forgot">
              ¿Olvidó su contraseña?
            </button>

            <div className="lang">
              Idioma: <b>Español - Internacional (es)</b>
            </div>
          </form>
        </div>
      </div>

      <ChooseRoleModal
        open={openChooseRole}
        roles={roles}
        loading={chooseLoading}
        onClose={() => setOpenChooseRole(false)}
        onPick={handlePickRole}
      />
    </div>
  );
}
