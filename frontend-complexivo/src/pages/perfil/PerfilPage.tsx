import { useEffect, useMemo, useState } from "react";
import { perfilService } from "../../services/perfil.service";
import type { PerfilMeResponse } from "../../types/perfil";
import "./PerfilPage.css";

export default function PerfilPage() {
  const [data, setData] = useState<PerfilMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [openPwd, setOpenPwd] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(
    null
  );

  const docente = data?.docente;

  const fullName = useMemo(() => {
    if (!docente) return "";
    return `${docente.nombres_docente} ${docente.apellidos_docente}`.trim();
  }, [docente]);

  const rolesText = useMemo(() => {
    if (!data?.roles?.length) return "—";
    return data.roles.map((r) => r.nombre_rol).join(", ");
  }, [data]);

  const activeRoleName = useMemo(() => {
    if (!data?.activeRole || !data?.roles?.length) return "—";
    const found = data.roles.find((r) => r.id_rol === data.activeRole);
    return found?.nombre_rol ?? String(data.activeRole);
  }, [data]);

  function showToast(type: "success" | "error" | "info", message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 2600);
  }

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const res = await perfilService.me();
      setData(res);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Error al cargar perfil");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openPasswordModal() {
    setNewPassword("");
    setConfirmPassword("");
    setOpenPwd(true);
  }

  function closePasswordModal() {
    if (saving) return;
    setOpenPwd(false);
  }

  async function handleSavePassword() {
    if (saving) return;

    const np = newPassword.trim();
    const cp = confirmPassword.trim();

    if (np.length < 6) {
      showToast("error", "La contraseña debe tener mínimo 6 caracteres.");
      return;
    }
    if (np !== cp) {
      showToast("error", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setSaving(true);
      const r = await perfilService.changePassword({ newPassword: np, confirmPassword: cp });
      showToast("success", r?.message || "Contraseña actualizada.");
      setOpenPwd(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      showToast("error", e?.response?.data?.message || e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <div className="headerRow">
            <div>
              <h2 className="title">Mi Perfil</h2>
              <p className="subtitle">Cargando información…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="page">
        <div className="card">
          <div className="headerRow">
            <div>
              <h2 className="title">Mi Perfil</h2>
              <p className="subtitle">Ocurrió un error al cargar</p>
            </div>
            <div className="summaryActions">
              <button className="btnSecondary" onClick={load}>
                Reintentar
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, color: "rgba(180, 40, 40, 0.95)", fontWeight: 900 }}>
            {err}
          </div>
        </div>
      </div>
    );
  }

  if (!docente) {
    return (
      <div className="page">
        <div className="card">
          <h2 className="title">Mi Perfil</h2>
          <p className="subtitle">No hay datos para mostrar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Mi Perfil</h2>
            <p className="subtitle">
              Revisa tus datos y actualiza tu contraseña cuando lo necesites.
            </p>

            <div className="summaryRow">
              <div className="summaryBoxes">
                <div className={`summaryBox ${docente.estado === 1 ? "active" : "inactive"}`}>
                  <div className="label">Estado</div>
                  <div className="value">{docente.estado === 1 ? "Activo" : "Inactivo"}</div>
                </div>

                <div className="summaryBox">
                  <div className="label">Rol activo</div>
                  <div className="value">{activeRoleName}</div>
                </div>

                <div className="summaryBox">
                  <div className="label">Roles</div>
                  <div className="value">{data.roles?.length ?? 0}</div>
                </div>

                <div className="summaryBox">
                  <div className="label">Usuario</div>
                  <div className="value">{docente.nombre_usuario}</div>
                </div>
              </div>

              <div className="summaryActions">
                <button className="btnPrimary" onClick={openPasswordModal}>
                  Cambiar contraseña
                </button>
                <button className="btnSecondary" onClick={load}>
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="profileBadge">
            <div className="profileAvatar" aria-hidden="true">
              {initials(fullName)}
            </div>
            <div>
              <div className="profileName">{fullName}</div>
              <div className="profileSub">{rolesText}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="card">
        <div className="sectionTitleRow">
          <div>
            <div className="sectionTitle">Datos del docente</div>
            <div className="sectionSub">Información registrada en el sistema</div>
          </div>
        </div>

        <div className="infoGrid">
          <InfoItem label="Nombre completo" value={fullName} />
          <InfoItem label="Usuario" value={docente.nombre_usuario} />
          <InfoItem label="Cédula" value={docente.cedula} />
          <InfoItem label="ID institucional" value={docente.id_institucional_docente} />
          <InfoItem label="Correo" value={docente.correo_docente ?? "—"} />
          <InfoItem label="Teléfono" value={docente.telefono_docente ?? "—"} />
          <InfoItem label="Debe cambiar password" value={docente.debe_cambiar_password === 1 ? "Sí" : "No"} />
          <InfoItem label="Rol activo" value={activeRoleName} />
        </div>
      </div>

      {/* Modal Cambiar Password */}
      {openPwd && (
        <div className="modalOverlay" onClick={closePasswordModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Cambiar contraseña</div>
                <div className="subtitle" style={{ margin: "6px 0 0" }}>
                  Ingresa una nueva contraseña y confírmala.
                </div>
              </div>
              <button className="modalClose" onClick={closePasswordModal} disabled={saving}>
                ✕
              </button>
            </div>

            <div className="formStack">
              <div className="formField">
                <div className="label">Nueva contraseña</div>
                <input
                  className="fieldInput"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={saving}
                />
                <div className="helperText">Tip: usa una contraseña fácil de recordar pero segura.</div>
              </div>

              <div className="formField">
                <div className="label">Confirmar contraseña</div>
                <input
                  className="fieldInput"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  disabled={saving}
                />
              </div>

              <div className="modalFooter">
                <button className="btnGhost" onClick={closePasswordModal} disabled={saving}>
                  Cancelar
                </button>
                <button className="btnPrimary" onClick={handleSavePassword} disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="infoItem">
      <div className="infoKey">{label}</div>
      <div className="infoVal">{value}</div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}
