import { useEffect, useMemo, useState } from "react";
import { perfilService } from "../../services/perfil.service";
import type { PerfilMeResponse } from "../../types/perfil";
import "./PerfilPage.css";
import {
  User,
  Shield,
  RefreshCcw,
  Lock,
  IdCard,
  Mail,
  Phone,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

export default function PerfilPage() {
  const [data, setData] = useState<PerfilMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [openPwd, setOpenPwd] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

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
      setErr(
        e?.userMessage ||
          e?.response?.data?.message ||
          e?.message ||
          "Error al cargar perfil"
      );
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
      const r = await perfilService.changePassword({
        newPassword: np,
        confirmPassword: cp,
      });
      showToast("success", r?.message || "Contraseña actualizada.");
      setOpenPwd(false);
    } catch (e: any) {
      showToast(
        "error",
        e?.userMessage ||
          e?.response?.data?.message ||
          e?.message ||
          "No se pudo actualizar"
      );
    } finally {
      setSaving(false);
    }
  }

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="perfilPage">
        <div className="wrap containerFull">
          <div className="box">
            <div className="sectionTitle">Cargando perfil…</div>
            <div className="helperText">Obteniendo información del usuario.</div>
          </div>
        </div>
      </div>
    );
  }

  // ===== ERROR =====
  if (err) {
    return (
      <div className="perfilPage">
        <div className="wrap containerFull">
          <div className="box">
            <div className="boxHead">
              <div className="sectionTitle">
                <span className="sectionTitleIcon">
                  <User size={18} />
                </span>
                MI PERFIL
              </div>
              <button className="btnGhost" onClick={load}>
                <RefreshCcw size={18} />
                Reintentar
              </button>
            </div>

            <div className="divider" />

            <div className="alertError">
              <div className="alertTitle">Error</div>
              <div className="alertText">{err}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== SIN DOCENTE =====
  if (!docente) {
    return (
      <div className="perfilPage">
        <div className="wrap containerFull">
          <div className="box">
            <div className="sectionTitle">MI PERFIL</div>
            <div className="helperText">No hay datos para mostrar.</div>
          </div>
        </div>
      </div>
    );
  }

  const isActive = docente.estado === 1;

  return (
    <div className="perfilPage">
      <div className="wrap containerFull">
        {/* HERO (estilo serio, como Carreras) */}
        <div className="hero">
          <div className="heroLeft">
            <div className="heroMark" aria-hidden="true">
              <User className="heroMarkIcon" />
            </div>

            <div className="heroText">
              <h1 className="heroTitle">MI PERFIL</h1>
              <p className="heroSubtitle">
                Gestión de información personal y configuración de cuenta
              </p>

              <div className="heroMiniRow">
                <span className="heroMiniName">{fullName}</span>
                <span className={`badgeState ${isActive ? "badgeOk" : "badgeOff"}`}>
                  {isActive ? (
                    <>
                      <BadgeCheck size={16} /> ACTIVO
                    </>
                  ) : (
                    <>
                      <BadgeX size={16} /> INACTIVO
                    </>
                  )}
                </span>
                <span className="badgeRole">
                  <Shield size={16} />
                  {activeRoleName}
                </span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <button className="btnPrimary" onClick={openPasswordModal}>
              <Lock size={18} />
              Cambiar contraseña
            </button>
            <button className="btnGhost" onClick={load}>
              <RefreshCcw size={18} />
              Actualizar
            </button>
          </div>
        </div>

        {/* BOX 1: Información personal (form serio) */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <User size={18} />
              </span>
              INFORMACIÓN PERSONAL
            </div>
          </div>

          <div className="divider" />

          <div className="formGrid">
            <div className="field">
              <label className="label">NOMBRE</label>
              <input className="input" value={fullName} disabled />
            </div>

            <div className="field">
              <label className="label">USUARIO</label>
              <input className="input" value={docente.nombre_usuario} disabled />
            </div>

            <div className="field">
              <label className="label">CÉDULA</label>
              <div className="inputIconWrap">
                <IdCard className="inputIcon" />
                <input className="input inputWithIcon" value={docente.cedula} disabled />
              </div>
            </div>

            <div className="field">
              <label className="label">ID INSTITUCIONAL</label>
              <input className="input" value={docente.id_institucional_docente} disabled />
            </div>

            <div className="field">
              <label className="label">CORREO</label>
              <div className="inputIconWrap">
                <Mail className="inputIcon" />
                <input
                  className="input inputWithIcon"
                  value={docente.correo_docente ?? "—"}
                  disabled
                />
              </div>
            </div>

            <div className="field">
              <label className="label">TELÉFONO</label>
              <div className="inputIconWrap">
                <Phone className="inputIcon" />
                <input
                  className="input inputWithIcon"
                  value={docente.telefono_docente ?? "—"}
                  disabled
                />
              </div>
            </div>

            <div className="field">
              <label className="label">DEBE CAMBIAR PASSWORD</label>
              <input
                className="input"
                value={docente.debe_cambiar_password === 1 ? "SÍ" : "NO"}
                disabled
              />
            </div>

            <div className="field">
              <label className="label">ROL ACTIVO</label>
              <input className="input" value={activeRoleName} disabled />
            </div>

            <div className="field fieldFull">
              <div className="softNote">
                Si olvidas tu contraseña, podrás cambiarla aquí cuando estés autenticado. En el primer
                ingreso, el sistema puede obligarte a actualizarla.
              </div>
            </div>
          </div>
        </div>

        {/* BOX 2: Roles (serio, lista simple) */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Shield size={18} />
              </span>
              ROLES DISPONIBLES
            </div>
          </div>

          <div className="divider" />

          <div className="rolesList">
            {roles.length ? (
              roles.map((r) => (
                <div key={r.id_rol} className="roleRow">
                  <div className="roleLeft">
                    <span className={`roleDot ${data?.activeRole === r.id_rol ? "roleDotOn" : ""}`} />
                    <div className="roleName">{r.nombre_rol}</div>
                  </div>
                  <div className="roleRight">
                    {data?.activeRole === r.id_rol ? (
                      <span className="roleActiveTag">ACTIVO</span>
                    ) : (
                      <span className="roleTag">ROL</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="helperText">—</div>
            )}
          </div>
        </div>

        {/* ===== MODAL PASSWORD (se mantiene) ===== */}
        {openPwd && (
          <div className="modalOverlay" onClick={closePasswordModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div className="modalHeaderLeft">
                  <div className="modalHeaderIcon">
                    <Lock size={18} />
                  </div>
                  <div>
                    <div className="modalHeaderTitle">Cambiar contraseña</div>
                    <div className="modalHeaderSub">
                      Ingresa una nueva contraseña y confírmala.
                    </div>
                  </div>
                </div>

                <button className="modalClose" onClick={closePasswordModal} disabled={saving}>
                  ✕
                </button>
              </div>

              <div className="modalDivider" />

              <div className="modalBody">
                <div className="formGrid formGridOne">
                  <div className="field">
                    <div className="label">NUEVA CONTRASEÑA</div>
                    <input
                      className="input"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      disabled={saving}
                    />
                  </div>

                  <div className="field">
                    <div className="label">CONFIRMAR CONTRASEÑA</div>
                    <input
                      className="input"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      disabled={saving}
                    />
                  </div>
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
