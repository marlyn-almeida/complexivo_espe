import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

import logo from "../../assets/logo_espe.png";
import campus from "../../assets/campus.jpg";
import { setSession } from "../../utils/auth";

type LoginResponse =
  | { mustChangePassword: true; tempToken: string; __version?: string }
  | {
      mustChangePassword: false;
      accessToken: string;
      roles: Array<{ id_rol: number; nombre_rol: string }>;
      activeRole: { id_rol: number; nombre_rol: string };
      redirectTo: string;
      __version?: string;
    };

export default function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Ingresa usuario y contraseña.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = (await res.json()) as LoginResponse & { message?: string };

      if (!res.ok) {
        setError(data?.message || "Credenciales incorrectas.");
        return;
      }

      if ("mustChangePassword" in data && data.mustChangePassword) {
        localStorage.setItem("tempToken", data.tempToken);
        navigate("/change-password", { replace: true });
        return;
      }

      setSession({
        accessToken: data.accessToken,
        roles: data.roles,
        activeRole: data.activeRole,
      });

      navigate(data.redirectTo || "/superadmin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {/* Imagen izquierda */}
      <div
        className="login-leftImage"
        style={{ backgroundImage: `url(${campus})` }}
      />

      {/* Panel derecho */}
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  placeholder=""
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
                  placeholder=""
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
    </div>
  );
}
