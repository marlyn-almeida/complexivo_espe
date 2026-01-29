import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Docente } from "../../types/docente";
import type { Carrera } from "../../types/carrera";

import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import {
  Plus,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Upload,
  Shield,
  Filter,
  X,
  User,
  Hash,
  Mail,
  Phone,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png"; 
import "./DocentesPage.css";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}

function getRoleFromTokenBestEffort(): string | null {
  const keys = ["token", "accessToken", "authToken", "jwt", "JWT"];
  let token: string | null = null;

  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.split(".").length === 3) {
      token = v;
      break;
    }
  }
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    const role = json.activeRole ?? json.rol ?? null;
    if (typeof role === "string") return role;

    if (typeof role === "number") {
      if (role === 1) return "SUPER_ADMIN";
      if (role === 2) return "ADMIN";
      if (role === 3) return "DOCENTE";
    }

    const roles = Array.isArray(json.roles) ? json.roles : [];
    if (roles.includes("SUPER_ADMIN") || roles.includes(1)) return "SUPER_ADMIN";
    return null;
  } catch {
    return null;
  }
}

export default function DocentesPage() {
  const navigate = useNavigate();

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [page, setPage] = useState(1);

  const [filterCarreraId, setFilterCarreraId] = useState<string>(""); // "" = todas

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDocente, setViewDocente] = useState<Docente | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const isSuperAdminUI = useMemo(() => getRoleFromTokenBestEffort() === "SUPER_ADMIN", []);

  useEffect(() => {
    loadCarreras();
  }, []);

  useEffect(() => {
    loadAll();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos, filterCarreraId]);

  async function loadCarreras() {
    try {
      setLoadingCarreras(true);
      const data = await carrerasService.list(false);
      setCarreras((data ?? []).filter((c) => c.estado === 1));
    } catch {
      showToast("Error al cargar carreras", "error");
    } finally {
      setLoadingCarreras(false);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);

      const idCarrera =
        filterCarreraId && Number(filterCarreraId) > 0 ? Number(filterCarreraId) : undefined;

      const data = await docentesService.list({
        includeInactive: mostrarInactivos,
        id_carrera: idCarrera,
      });

      setDocentes(data);
    } catch {
      showToast("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function openView(d: Docente) {
    setViewDocente(d);
    setShowViewModal(true);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Ocurrió un error";
  }

  async function toggleSuperAdmin(d: Docente) {
    if (typeof (d as any).super_admin === "undefined") {
      showToast("Falta flag super_admin en el listado (backend).", "error");
      return;
    }

    const enabled = (d as any).super_admin === 0;

    try {
      await docentesService.setSuperAdmin(d.id_docente, enabled);
      showToast(enabled ? "Rol SUPER_ADMIN asignado." : "Rol SUPER_ADMIN removido.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return docentes
      .filter((d) => (mostrarInactivos ? true : d.estado === 1))
      .filter((d) => {
        if (!q) return true;
        return (
          (d.nombres_docente || "").toLowerCase().includes(q) ||
          (d.apellidos_docente || "").toLowerCase().includes(q) ||
          (d.cedula || "").toLowerCase().includes(q) ||
          (d.id_institucional_docente || "").toLowerCase().includes(q) ||
          (d.nombre_usuario || "").toLowerCase().includes(q) ||
          (d.correo_docente || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.apellidos_docente || ""} ${a.nombres_docente || ""}`.localeCompare(
          `${b.apellidos_docente || ""} ${b.nombres_docente || ""}`,
          "es"
        )
      );
  }, [docentes, search, mostrarInactivos]);

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalDocentes = docentes.length;
  const activos = docentes.filter((d) => d.estado === 1).length;
  const inactivos = docentes.filter((d) => d.estado === 0).length;

  return (
    <div className="docentesPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Docentes</h1>
              <p className="heroSubtitle">
                Gestión de docentes del sistema. La contraseña inicial será la <b>cédula</b> y en el primer
                inicio de sesión deberá cambiarla.
              </p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={() => navigate("/docentes/importar")} disabled={loading}>
              <Upload className="heroBtnIcon" />
              Importar
            </button>

            <button className="heroBtn primary" onClick={() => navigate("/docentes/nuevo")} disabled={loading}>
              <Plus className="heroBtnIcon" />
              Nuevo docente
            </button>
          </div>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <User size={18} />
              </span>
              Listado de docentes
            </div>

            <div className="boxRight">
              <button className="btnGhost" onClick={loadAll} disabled={loading} title="Actualizar">
                ⟳ Actualizar
              </button>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                />
                <span className="slider" />
                <span className="toggleText">Mostrar inactivos</span>
              </label>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="summaryRow">
            <div className="summaryBoxes">
              <div className="summaryBox">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{totalDocentes}</span>
              </div>

              <div className="summaryBox active">
                <span className="summaryLabel">Activos</span>
                <span className="summaryValue">{activos}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Inactivos</span>
                <span className="summaryValue">{inactivos}</span>
              </div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por nombre, cédula, ID institucional, usuario o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <select
                className="select"
                value={filterCarreraId}
                onChange={(e) => setFilterCarreraId(e.target.value)}
                disabled={loadingCarreras}
                aria-label="Filtrar por carrera"
                title="Filtrar por carrera"
              >
                <option value="">{loadingCarreras ? "Cargando carreras..." : "Todas las carreras"}</option>
                {carreras
                  .slice()
                  .sort((a, b) => a.nombre_carrera.localeCompare(b.nombre_carrera, "es"))
                  .map((c) => (
                    <option key={c.id_carrera} value={String(c.id_carrera)}>
                      {c.nombre_carrera} ({c.codigo_carrera})
                    </option>
                  ))}
              </select>

              {filterCarreraId && (
                <button className="chipClear" onClick={() => setFilterCarreraId("")} title="Quitar filtro">
                  <X size={14} /> Quitar filtro
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thName">Docente</th>
                  <th>Cédula</th>
                  <th>ID institucional</th>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th className="thState">Estado</th>
                  <th className="thActions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((d) => (
                    <tr key={d.id_docente}>
                      <td>
                        <div className="nameMain">
                          {d.apellidos_docente} {d.nombres_docente}
                          {(d as any).super_admin === 1 && (
                            <span className="chipPill chipPurple" title="Rol global">
                              SUPER_ADMIN
                            </span>
                          )}
                        </div>

                        <div className="nameSubRow">
                          <span className="subItem">
                            <Hash size={14} />
                            {d.id_docente}
                          </span>
                          <span className="subDot">•</span>
                          <span className="subItem">
                            <Mail size={14} />
                            {d.correo_docente || "-"}
                          </span>
                          {d.telefono_docente ? (
                            <>
                              <span className="subDot">•</span>
                              <span className="subItem">
                                <Phone size={14} />
                                {onlyDigits(d.telefono_docente)}
                              </span>
                            </>
                          ) : null}
                        </div>
                      </td>

                      <td className="mono">{onlyDigits(d.cedula || "") || "-"}</td>

                      <td>
                        <span className="chipCode">{(d.id_institucional_docente || "-").toUpperCase()}</span>
                      </td>

                      {/* ✅ usuario normal (NO chip “bomba”) */}
                      <td className="mono userCell">{d.nombre_usuario || "-"}</td>

                      <td className="mailCell">{d.correo_docente || "-"}</td>

                      <td>
                        {d.estado ? (
                          <span className="badgeActive">
                            <BadgeCheck size={16} />
                            ACTIVO
                          </span>
                        ) : (
                          <span className="badgeInactive">
                            <BadgeX size={16} />
                            INACTIVO
                          </span>
                        )}
                      </td>

                      <td className="tdActions">
                        <div className="actions">
                          {isSuperAdminUI && (
                            <button
                              className={`iconBtn iconBtn_neutral ${(d as any).super_admin === 1 ? "isOn" : ""}`}
                              title={(d as any).super_admin === 1 ? "Quitar SUPER_ADMIN" : "Hacer SUPER_ADMIN"}
                              onClick={() => toggleSuperAdmin(d)}
                            >
                              <Shield className="iconAction" />
                              <span className="tooltip">
                                {(d as any).super_admin === 1 ? "Quitar SUPER_ADMIN" : "Hacer SUPER_ADMIN"}
                              </span>
                            </button>
                          )}

                          <button className="iconBtn iconBtn_neutral" title="Ver" onClick={() => openView(d)}>
                            <Eye className="iconAction" />
                            <span className="tooltip">Ver</span>
                          </button>

                          <button
                            className="iconBtn iconBtn_primary"
                            title="Editar"
                            onClick={() => navigate(`/docentes/${d.id_docente}/editar`)}
                          >
                            {/* re-uso Pencil sin importarlo acá: usa un ícono simple */}
                            <span className="pencilGlyph">✎</span>
                            <span className="tooltip">Editar</span>
                          </button>

                          <button
                            className={`iconBtn ${d.estado ? "iconBtn_danger" : "iconBtn_primary"}`}
                            title={d.estado ? "Desactivar" : "Activar"}
                            onClick={async () => {
                              try {
                                await docentesService.toggleEstado(d.id_docente, d.estado);
                                showToast(d.estado ? "Docente desactivado." : "Docente activado.", "success");
                                await loadAll();
                              } catch {
                                showToast("No se pudo cambiar el estado.", "error");
                              }
                            }}
                          >
                            {d.estado ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                            <span className="tooltip">{d.estado ? "Desactivar" : "Activar"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">No hay docentes para mostrar.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="paginationRow">
            <button className="btnGhost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {page} de {totalPages}
            </span>

            <button className="btnGhost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODAL */}
      {showViewModal && viewDocente && (
        <div className="modalOverlay" onMouseDown={() => setShowViewModal(false)}>
          <div className="modalCard modalPro" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalHeaderLeft">
                <div className="modalHeaderIcon">
                  <Eye size={18} />
                </div>
                <div>
                  <div className="modalHeaderTitle">Detalle de docente</div>
                  <div className="modalHeaderSub">Información registrada del docente</div>
                </div>
              </div>

              <button className="modalClose" onClick={() => setShowViewModal(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modalDivider" />
            <div className="modalBody">
              <div className="viewCards">
                <div className="vCard vCardFull">
                  <div className="vLabel">
                    <User className="vIcon" />
                    DOCENTE
                  </div>
                  <div className="vValue">
                    {viewDocente.apellidos_docente} {viewDocente.nombres_docente}
                  </div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" />
                    ID INSTITUCIONAL
                  </div>
                  <div className="vValue mono">{(viewDocente.id_institucional_docente || "-").toUpperCase()}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" />
                    CÉDULA
                  </div>
                  <div className="vValue mono">{onlyDigits(viewDocente.cedula || "") || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" />
                    USUARIO
                  </div>
                  <div className="vValue mono">{viewDocente.nombre_usuario || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Mail className="vIcon" />
                    CORREO
                  </div>
                  <div className="vValue">{viewDocente.correo_docente || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Phone className="vIcon" />
                    TELÉFONO
                  </div>
                  <div className="vValue">{viewDocente.telefono_docente || "-"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" />
                    DEBE CAMBIAR PASSWORD
                  </div>
                  <div className="vValue">{viewDocente.debe_cambiar_password === 1 ? "Sí" : "No"}</div>
                </div>

                <div className="vCard">
                  <div className="vLabel">
                    <Hash className="vIcon" />
                    ESTADO
                  </div>
                  <div className="vValue">
                    {viewDocente.estado ? <span className="badgeActive">ACTIVO</span> : <span className="badgeInactive">INACTIVO</span>}
                  </div>
                </div>
              </div>

              <div className="modalFooter">
                <button className="btnGhost" onClick={() => setShowViewModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
