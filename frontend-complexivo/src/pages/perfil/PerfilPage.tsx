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

  const activeRoleName = useMemo(() => {
    if (!data?.activeRole || !data?.roles?.length) return "—";
    const found = data.roles.find((r) => r.id_rol === data.activeRole);
    return found?.nombre_rol ?? String(data.activeRole);
  }, [data]);

  const roles = useMemo(() => data?.roles ?? [], [data]);

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
      setErr(e?.userMessage || e?.response?.data?.message || e?.message || "Error al cargar perfil");
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
    } catch (e: any) {
      showToast("error", e?.userMessage || e?.response?.data?.message || e?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="perfilPage">
        <div className="perfilShell">
          <div className="perfilCard perfilSkeleton">
            <div className="skLine w40" />
            <div className="skLine w70" />
            <div className="skGrid">
              <div className="skBox" />
              <div className="skBox" />
              <div className="skBox" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="perfilPage">
        <div className="perfilShell">
          <div className="perfilCard">
            <div className="perfilTop">
              <div>
                <h2 className="perfilTitle">Mi Perfil</h2>
                <p className="perfilSub">No se pudo cargar la información.</p>
              </div>
              <button className="btnSecondary" onClick={load}>
                🔄 Reintentar
              </button>
            </div>

            <div className="alertError">
              <div className="alertIcon">⚠️</div>
              <div>
                <div className="alertTitle">Error</div>
                <div className="alertText">{err}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!docente) {
    return (
      <div className="perfilPage">
        <div className="perfilShell">
          <div className="perfilCard">
            <h2 className="perfilTitle">Mi Perfil</h2>
            <p className="perfilSub">No hay datos para mostrar.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="perfilPage">
      <div className="perfilShell">
        {/* ===== HERO / IDENTIDAD ===== */}
        <div className="perfilHero">
          <div className="heroBackdrop" aria-hidden="true" />

          <div className="heroContent">
            <div className="heroLeft">
              <div className="avatarBig" aria-hidden="true">
                <span>{initials(fullName)}</span>
              </div>

              <div className="heroIdentity">
                <div className="heroName">{fullName}</div>
                <div className="heroMeta">
                  <span className="chip chipSoft">👤 @{docente.nombre_usuario}</span>
                  <span className={`chip ${docente.estado === 1 ? "chipOk" : "chipBad"}`}>
                    {docente.estado === 1 ? "✅ Activo" : "⛔ Inactivo"}
                  </span>
                  <span className="chip chipRole">🛡️ {activeRoleName}</span>
                </div>

                <div className="rolesRow">
                  <div className="rolesLabel">Roles disponibles</div>
                  <div className="rolesChips">
                    {roles.length ? (
                      roles.map((r) => (
                        <span
                          key={r.id_rol}
                          className={`rolePill ${data?.activeRole === r.id_rol ? "rolePillActive" : ""}`}
                          title={data?.activeRole === r.id_rol ? "Rol activo" : "Rol"}
                        >
                          {r.nombre_rol}
                        </span>
                      ))
                    ) : (
                      <span className="rolePill">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="heroActions">
              <button className="btnPrimary" onClick={openPasswordModal}>
                🔒 Cambiar contraseña
              </button>
              <button className="btnSecondary" onClick={load}>
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* ===== MIS DATOS ===== */}
        <div className="perfilCard">
          <div className="sectionHeader">
            <div>
              <div className="sectionTitle">Mis datos</div>
              <div className="sectionSub">Información registrada en el sistema</div>
            </div>
          </div>

          <div className="dataGrid">
            <DataItem icon="🪪" label="Cédula" value={docente.cedula} />
            <DataItem icon="🏫" label="ID institucional" value={docente.id_institucional_docente} />
            <DataItem icon="✉️" label="Correo" value={docente.correo_docente ?? "—"} />
            <DataItem icon="📞" label="Teléfono" value={docente.telefono_docente ?? "—"} />
            <DataItem icon="🔐" label="Debe cambiar password" value={docente.debe_cambiar_password === 1 ? "Sí" : "No"} />
            <DataItem icon="🛡️" label="Rol activo" value={activeRoleName} />
          </div>

          <div className="softNote">
            <div className="softNoteIcon">ℹ️</div>
            <div className="softNoteText">
              Si olvidas tu contraseña, podrás cambiarla aquí cuando estés autenticado. En el primer ingreso,
              el sistema puede obligarte a actualizarla.
            </div>
          </div>
        </div>

        {/* ===== MODAL PASSWORD ===== */}
        {openPwd && (
          <div className="modalOverlay" onClick={closePasswordModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div>
                  <div className="modalTitle">Cambiar contraseña</div>
                  <div className="perfilSub" style={{ margin: "6px 0 0" }}>
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

        {/* ===== TOAST ===== */}
        {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      </div>
    </div>
  );
}

function DataItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="dataItem">
      <div className="dataIcon" aria-hidden="true">{icon}</div>
      <div className="dataBody">
        <div className="dataLabel">{label}</div>
        <div className="dataValue">{value}</div>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase();
}
