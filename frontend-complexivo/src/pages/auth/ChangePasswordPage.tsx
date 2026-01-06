import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePasswordPage.css";

import logo from "../../assets/logo_espe.png";
import campus from "../../assets/campus.jpg";

import { setSession } from "../../utils/auth";

type ChangePasswordResponse =
  | { message?: string; errors?: any }
  | {
      accessToken: string;
      roles: Array<{ id_rol: number; nombre_rol: string }>;
      activeRole: { id_rol: number; nombre_rol: string };
      redirectTo?: string;
      __version?: string;
    };

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const MIN_LEN = 8;

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tempToken = localStorage.getItem("tempToken");

  const strength = useMemo(() => {
    const p = newPassword;
    const checks = {
      len: p.length >= MIN_LEN,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      num: /\d/.test(p),
      sym: /[^A-Za-z0-9]/.test(p),
    };
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  }, [newPassword]);

  const strengthLabel = useMemo(() => {
    if (!newPassword) return { text: "—", level: 0 };
    if (strength.score <= 2) return { text: "Débil", level: 1 };
    if (strength.score === 3) return { text: "Media", level: 2 };
    return { text: "Fuerte", level: 3 };
  }, [newPassword, strength.score]);

  const canSubmit =
    !!tempToken &&
    newPassword.length >= MIN_LEN &&
    newPassword === confirm &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tempToken) {
      setError("No hay token temporal. Vuelve a iniciar sesión.");
      navigate("/login", { replace: true });
      return;
    }

    if (newPassword.length < MIN_LEN) {
      setError(`La contraseña debe tener al menos ${MIN_LEN} caracteres.`);
      return;
    }

    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            // ✅ Por si el backend lee el token desde header
            Authorization: `Bearer ${tempToken}`,
          },
          body: JSON.stringify({
            // ✅ Por si el backend lo lee desde body
            tempToken,
            newPassword,
            // ✅ Por si el backend exige confirmación
            confirmPassword: confirm,
          }),
        }
      );

      const data = (await res.json()) as ChangePasswordResponse;

      if (!res.ok) {
        // 🔎 Esto te dice EXACTAMENTE por qué da 422
        console.log("CHANGE-PASSWORD ERROR:", res.status, data);
        setError((data as any)?.message || "No se pudo cambiar la contraseña.");
        return;
      }

      const ok = data as any;
      if (!ok.accessToken) {
        console.log("CHANGE-PASSWORD INVALID RESPONSE:", data);
        setError("Respuesta inválida del servidor.");
        return;
      }

      setSession({
        accessToken: ok.accessToken,
        roles: ok.roles,
        activeRole: ok.activeRole,
      });

      localStorage.removeItem("tempToken");

      navigate(ok.redirectTo || "/superadmin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <div className="cp-left">
        <img src={logo} alt="ESPE" className="cp-logo" />

        <h1 className="cp-title">Cambiar contraseña</h1>
        <p className="cp-subtitle">
          Por seguridad, debes definir una nueva contraseña antes de ingresar al
          sistema.
        </p>

        <div className="cp-card">
          <div className="cp-cardHeader">
            <div className="cp-badge">Seguridad</div>
            <div className="cp-meta">
              <span className={`cp-strength cp-strength--l${strengthLabel.level}`}>
                Fortaleza: <b>{strengthLabel.text}</b>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="cp-form">
            <div className="cp-field">
              <label className="cp-label">Nueva contraseña</label>
              <div className="cp-inputWrap">
                <span className="cp-icon">🔒</span>
                <input
                  type={show ? "text" : "password"}
                  className="cp-input"
                  placeholder="Ingresa tu nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="cp-eye"
                  onClick={() => setShow((s) => !s)}
                  aria-label="Mostrar/ocultar contraseña"
                >
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="cp-field">
              <label className="cp-label">Confirmar contraseña</label>
              <div className="cp-inputWrap">
                <span className="cp-icon">🔒</span>
                <input
                  type={show ? "text" : "password"}
                  className="cp-input"
                  placeholder="Repite tu nueva contraseña"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {confirm && newPassword !== confirm && (
                <div className="cp-hint cp-hint--danger">
                  Las contraseñas no coinciden.
                </div>
              )}
            </div>

            <div className="cp-rules">
              <div className={`cp-rule ${strength.checks.len ? "ok" : ""}`}>
                • Mínimo {MIN_LEN} caracteres
              </div>
              <div className={`cp-rule ${strength.checks.upper ? "ok" : ""}`}>
                • Al menos 1 mayúscula
              </div>
              <div className={`cp-rule ${strength.checks.lower ? "ok" : ""}`}>
                • Al menos 1 minúscula
              </div>
              <div className={`cp-rule ${strength.checks.num ? "ok" : ""}`}>
                • Al menos 1 número
              </div>
              <div className={`cp-rule ${strength.checks.sym ? "ok" : ""}`}>
                • Al menos 1 símbolo
              </div>
            </div>

            {error && <div className="cp-alert">{error}</div>}

            <button className="cp-btnPrimary" type="submit" disabled={!canSubmit}>
              {loading ? "Guardando..." : "Guardar y entrar"}
            </button>

            <button className="cp-btnGhost" type="button" onClick={() => navigate("/login")}>
              Volver al login
            </button>

            {!tempToken && (
              <div className="cp-hint cp-hint--danger" style={{ marginTop: 10 }}>
                No se encontró token temporal. Inicia sesión nuevamente.
              </div>
            )}
          </form>
        </div>

        <div className="cp-footer">
          <span>Universidad de las Fuerzas Armadas ESPE</span>
          <span className="cp-dot">•</span>
          <span>Examen Complexivo</span>
        </div>
      </div>

      <div className="cp-right" style={{ backgroundImage: `url(${campus})` }} />
    </div>
  );
}
