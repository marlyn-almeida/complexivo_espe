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

export default function Login() {
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

      if (data.mustChangePassword) {
        // Guarda el tempToken para usarlo en ChangePasswordPage
        localStorage.setItem("tempToken", data.tempToken);
        navigate("/change-password", { replace: true });
        return;
      }

      // Sesión normal: guardar token + roles + activeRole
      setSession({
        accessToken: data.accessToken,
        roles: data.roles,
        activeRole: data.activeRole,
      });

      // Redirige al dashboard correcto (lo mejor es usar redirectTo que ya te da el backend)
      navigate(data.redirectTo || "/superadmin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <img src={logo} alt="ESPE" className="login-logo" />

        <h1 className="login-title">Acceso al sistema de examen complexivo</h1>
        <p className="login-subtitle">
          Universidad de las Fuerzas Armadas ESPE · Tecnologías de la Información
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="login-field-label">Usuario</label>
            <div className="login-input-wrap">
              <span className="login-icon">👤</span>
              <input
                className="login-input"
                placeholder="usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="login-field-label">Contraseña</label>
            <div className="login-input-wrap">
              <span className="login-icon">🔒</span>
              <input
                type="password"
                className="login-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <div style={{ color: "crimson", marginTop: 8 }}>{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Ingresando..." : "Acceder"}
          </button>
        </form>

        <div className="login-actions">
          <button className="login-link" type="button">¿Olvidó su contraseña?</button>
          <button className="login-link" type="button">Entrar como persona invitada</button>
        </div>

        <div className="login-lang">
          Idioma: <b>Español - Internacional (es)</b>
        </div>
      </div>

      <div className="login-right" style={{ backgroundImage: `url(${campus})` }} />
    </div>
  );
}
