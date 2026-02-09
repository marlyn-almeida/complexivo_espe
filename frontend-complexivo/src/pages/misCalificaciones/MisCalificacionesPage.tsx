// ✅ src/pages/misCalificaciones/MisCalificacionesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { misCalificacionesService } from "../../services/misCalificaciones.service";
import { entregasCasoService } from "../../services/entregasCaso.service";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { tribunalesDocenteService, type MiTribunalItem } from "../../services/tribunalesDocente.service";

import type { MisCalificacionRow } from "../../types/misCalificacion";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";

import {
  RefreshCw,
  Search,
  FileUp,
  FileDown,
  Users,
  ClipboardList,
  AlertTriangle,
  Filter,
  X,
  Pencil,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./MisCalificacionesPage.css";

import { getActiveRole } from "../../utils/auth";

type ToastType = "success" | "error" | "info";

function safeDateLabel(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function extractBackendMsg(err: any) {
  const msg = err?.response?.data?.message;
  const list = err?.response?.data?.errors;
  if (Array.isArray(list) && list.length && list[0]?.msg) return String(list[0].msg);
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof err?.userMessage === "string" && err.userMessage.trim()) return err.userMessage;
  return err?.message || "Ocurrió un error.";
}

/* =========================
   ADMIN HELPERS
   ========================= */
function hasEntrega(r: MisCalificacionRow) {
  return !!(r.entrega_archivo_path || r.entrega_archivo_nombre || (r as any).id_entrega);
}
function isAsignadoTribunal(r: MisCalificacionRow) {
  return !!(r as any).id_tribunal_estudiante; // si tu row lo tiene, ok
}

/* =========================
   DOCENTE HELPERS
   ========================= */
function isCerradoDocente(r: MiTribunalItem) {
  return Number(r.cerrado ?? 0) === 1;
}

export default function MisCalificacionesPage() {
  const nav = useNavigate();
  const role = getActiveRole(); // 1/2/3

  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // =========================
  // ADMIN: CP SELECT
  // =========================
  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  // =========================
  // DATA + UI
  // =========================
  const [loading, setLoading] = useState(false);

  // ADMIN rows
  const [rows, setRows] = useState<MisCalificacionRow[]>([]);

  // DOCENTE rows
  const [docRows, setDocRows] = useState<MiTribunalItem[]>([]);

  const [search, setSearch] = useState("");

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  // =========================
  // LABEL CP (ADMIN)
  // =========================
  const selectedCPLabel = useMemo(() => {
    const cp = (carreraPeriodos ?? []).find((x: any) => x.id_carrera_periodo === selectedCP);
    if (!cp) return "";
    const carrera = (cp as any).nombre_carrera ?? "Carrera";
    const periodo = (cp as any).codigo_periodo ?? (cp as any).descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }, [carreraPeriodos, selectedCP]);

  // =========================
  // LOAD INIT (según rol)
  // =========================
  useEffect(() => {
    if (role === 2) {
      loadCarreraPeriodos();
    } else if (role === 3) {
      loadDocenteAgenda();
    } else {
      // SUPER_ADMIN no debería estar aquí, pero por si acaso
      setRows([]);
      setDocRows([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // ADMIN: LOAD CP LIST + DATA
  // =========================
  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps ?? []);

      const first = (cps ?? []).find((x: any) => Boolean((x as any).estado)) ?? (cps ?? [])[0];
      if (first) setSelectedCP((first as any).id_carrera_periodo);
      else setSelectedCP("");
    } catch (err: any) {
      showToast("Error al cargar Carrera–Período", "error");
      setCarreraPeriodos([]);
      setSelectedCP("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role !== 2) return;
    if (selectedCP) loadAdminList();
    else setRows([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, role]);

  async function loadAdminList() {
    if (!selectedCP) return;

    try {
      setLoading(true);

      const data = await misCalificacionesService.list({
        carreraPeriodoId: Number(selectedCP),
        id_carrera_periodo: Number(selectedCP),
      });

      setRows(data ?? []);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // DOCENTE: LOAD AGENDA
  // =========================
  async function loadDocenteAgenda() {
    try {
      setLoading(true);
      const res = await tribunalesDocenteService.misTribunales();
      setDocRows(res.data || []);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
      setDocRows([]);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // FILTERED (según rol)
  // =========================
  const filteredAdmin = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (!q) return true;

      const estudiante = `${(r as any).apellidos_estudiante ?? ""} ${(r as any).nombres_estudiante ?? ""}`.toLowerCase();
      const inst = String((r as any).id_institucional_estudiante ?? "").toLowerCase();
      const trib = String((r as any).nombre_tribunal ?? `Tribunal ${(r as any).id_tribunal}`).toLowerCase();
      const carrera = String((r as any).nombre_carrera ?? "").toLowerCase();
      const periodo = String((r as any).codigo_periodo ?? (r as any).descripcion_periodo ?? "").toLowerCase();

      return (
        estudiante.includes(q) ||
        inst.includes(q) ||
        trib.includes(q) ||
        carrera.includes(q) ||
        periodo.includes(q) ||
        String((r as any).id_estudiante).includes(q)
      );
    });
  }, [rows, search]);

  const filteredDocente = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (docRows ?? []).filter((r) => {
      if (!q) return true;
      const base = `${r.estudiante} ${r.carrera ?? ""} ${r.fecha ?? ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [docRows, search]);

  const total = role === 3 ? filteredDocente.length : filteredAdmin.length;

  // =========================
  // ADMIN: PDF actions
  // =========================
  async function openEntregaPdf(row: MisCalificacionRow) {
    if (!row?.id_estudiante || !isAsignadoTribunal(row)) {
      showToast("Este estudiante no está asignado a un tribunal.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudiante(Number((row as any).id_estudiante));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function downloadEntregaPdf(row: MisCalificacionRow) {
    if (!row?.id_estudiante || !isAsignadoTribunal(row)) {
      showToast("Este estudiante no está asignado a un tribunal.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudiante(Number((row as any).id_estudiante));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = (row as any).entrega_archivo_nombre || `entrega_${(row as any).id_estudiante}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function pickFile(key: string) {
    fileRefs.current[key]?.click();
  }

  async function onUpload(row: MisCalificacionRow, file: File | null) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Solo se permite PDF.", "info");
      return;
    }

    if (!row?.id_estudiante || !isAsignadoTribunal(row)) {
      showToast("No se puede subir: el estudiante no está asignado a un tribunal.", "info");
      return;
    }

    try {
      setLoading(true);

      await entregasCasoService.subirByEstudiante({
        id_estudiante: Number((row as any).id_estudiante),
        archivo: file,
        observacion: "Entrega subida desde Mis Evaluaciones (ADMIN)",
      });

      showToast("Entrega subida/reemplazada correctamente.", "success");
      await loadAdminList();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function entregaEstadoLabel(r: MisCalificacionRow) {
    if (!isAsignadoTribunal(r)) return { text: "No asignado", cls: "badge badge-warn" };
    if (!hasEntrega(r)) return { text: "Pendiente", cls: "badge badge-warn" };
    return { text: "Entregado", cls: "badge badge-ok" };
  }

  function horarioLabel(r: MisCalificacionRow) {
    const hi = String((r as any).hora_inicio ?? "").trim();
    const hf = String((r as any).hora_fin ?? "").trim();
    if (!hi && !hf) return "—";
    if (hi && hf) return `${hi} - ${hf}`;
    return hi || hf;
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="mcPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">
                {role === 3 ? "Mis Tribunales (DOCENTE)" : "Mis Evaluaciones de Tribunales (ADMIN)"}
              </h1>

              <p className="heroSubtitle">
                {role === 3 ? (
                  <>
                    Agenda del docente. Entra a <b>Calificar</b> según tu rol y el Plan de Evaluación.
                  </>
                ) : (
                  <>
                    Gestión por <b>Carrera–Período</b>. Aquí aparecen estudiantes asignados a un <b>Tribunal</b>.
                  </>
                )}
              </p>

              {role === 2 && selectedCPLabel ? (
                <div className="heroHint">
                  Trabajando en: <b>{selectedCPLabel}</b>
                </div>
              ) : null}

              <div className="heroChips">
                <span className="chip">
                  <Users size={16} /> {total} registros
                </span>

                {role === 2 ? (
                  <span className="chip chipSoft">
                    <ClipboardList size={16} /> Entregas PDF por estudiante
                  </span>
                ) : (
                  <span className="chip chipSoft">
                    <ClipboardList size={16} /> Calificación por criterios (según Plan)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="heroActions">
            <button
              className="heroBtn ghost"
              onClick={role === 3 ? loadDocenteAgenda : loadAdminList}
              disabled={loading || (role === 2 && !selectedCP)}
            >
              <RefreshCw className="heroBtnIcon" />
              Actualizar
            </button>
          </div>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder={role === 3 ? "Buscar por estudiante / carrera / fecha..." : "Buscar por estudiante, carrera, período, tribunal..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Selector CP SOLO ADMIN */}
            {role === 2 && (
              <div className="filterWrap">
                <Filter className="filterIcon" />
                <select
                  className="select"
                  value={selectedCP}
                  onChange={(e) => setSelectedCP(e.target.value ? Number(e.target.value) : "")}
                  disabled={loading}
                  title="Seleccione Carrera–Período"
                >
                  <option value="">Seleccione Carrera–Período</option>
                  {carreraPeriodos.map((cp: any) => {
                    const carrera = cp.nombre_carrera ?? `Carrera ${cp.id_carrera}`;
                    const periodo = cp.codigo_periodo ?? cp.descripcion_periodo ?? `Período ${cp.id_periodo}`;
                    return (
                      <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                        {carrera} — {periodo}
                      </option>
                    );
                  })}
                </select>

                {selectedCP && (
                  <button className="chipClear" onClick={() => setSelectedCP("")} title="Quitar filtro">
                    <X size={14} /> Quitar
                  </button>
                )}
              </div>
            )}

            <div className="hintInline">
              <AlertTriangle size={16} />
              <span>
                {role === 3
                  ? "Solo verás tus tribunales asignados. Presiona Calificar para ingresar."
                  : "Solo puedes subir/ver/descargar si el estudiante está asignado a un tribunal."}
              </span>
            </div>
          </div>

          {/* =========================
              TABLA DOCENTE (ROL 3)
             ========================= */}
          {role === 3 ? (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="thCenter" style={{ width: 320 }}>Estudiante</th>
                    <th className="thCenter" style={{ width: 320 }}>Carrera</th>
                    <th className="thCenter" style={{ width: 180 }}>Fecha</th>
                    <th className="thCenter" style={{ width: 160 }}>Horario</th>
                    <th className="thCenter" style={{ width: 140 }}>Estado</th>
                    <th className="thCenter" style={{ width: 220 }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td className="emptyCell" colSpan={6}>Cargando...</td>
                    </tr>
                  ) : filteredDocente.length ? (
                    filteredDocente.map((r) => {
                      const hora = `${r.hora_inicio ?? "--:--"} - ${r.hora_fin ?? "--:--"}`;
                      const cerrado = isCerradoDocente(r);

                      return (
                        <tr key={r.id_tribunal_estudiante}>
                          <td className="tdCenter">
                            <div className="cellMain">{r.estudiante}</div>
                            <div className="cellSub">ID Tribunal-Est.: {r.id_tribunal_estudiante}</div>
                          </td>
                          <td className="tdCenter">{r.carrera ?? "—"}</td>
                          <td className="tdCenter">{r.fecha ?? "—"}</td>
                          <td className="tdCenter">{hora}</td>
                          <td className="tdCenter">
                            <span className={`badge ${cerrado ? "badge-off" : "badge-ok"}`}>
                              {cerrado ? "CERRADO" : "ABIERTO"}
                            </span>
                          </td>
                          <td className="tdCenter">
                            <div className="actions">
                              <button
                                className="btnPrimary"
                                onClick={() => nav(`/docente/calificaciones/${r.id_tribunal_estudiante}`)}
                                disabled={loading}
                                title="Ir a calificar"
                              >
                                <Pencil size={16} /> Calificar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="emptyCell" colSpan={6}>No tienes tribunales asignados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* =========================
               TABLA ADMIN (ROL 2)
               ========================= */
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="thCenter" style={{ width: 280 }}>Estudiante</th>
                    <th className="thCenter" style={{ width: 280 }}>Carrera</th>
                    <th className="thCenter" style={{ width: 200 }}>Período</th>
                    <th className="thCenter" style={{ width: 170 }}>Fecha</th>
                    <th className="thCenter" style={{ width: 160 }}>Horario</th>
                    <th className="thCenter" style={{ width: 150 }}>Estado</th>
                    <th className="thCenter">Entrega</th>
                    <th className="thCenter" style={{ width: 330 }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedCP ? (
                    <tr>
                      <td className="emptyCell" colSpan={8}>Seleccione una Carrera–Período para ver registros.</td>
                    </tr>
                  ) : loading ? (
                    <tr>
                      <td className="emptyCell" colSpan={8}>Cargando...</td>
                    </tr>
                  ) : filteredAdmin.length ? (
                    filteredAdmin.map((r: any) => {
                      const key = `${r.id_tribunal}_${r.id_estudiante}`;
                      const badge = entregaEstadoLabel(r);

                      const estudianteLabel =
                        `${r.apellidos_estudiante ?? ""} ${r.nombres_estudiante ?? ""}`.trim() ||
                        `Estudiante ${r.id_estudiante}`;

                      const inst = (r.id_institucional_estudiante ?? "").trim();
                      const carrera = r.nombre_carrera ?? "—";
                      const periodo = r.codigo_periodo ?? r.descripcion_periodo ?? "—";
                      const fecha = r.fecha_tribunal ? safeDateLabel(r.fecha_tribunal) : "—";
                      const horario = horarioLabel(r);
                      const estadoTrib = r.estado_tribunal ?? "—";

                      const entregaName = r.entrega_archivo_nombre || "—";
                      const entregaFecha = r.entrega_fecha_entrega ? safeDateLabel(r.entrega_fecha_entrega) : "";

                      const canUpload = isAsignadoTribunal(r);
                      const canOpen = isAsignadoTribunal(r) && hasEntrega(r);

                      return (
                        <tr key={key}>
                          <td className="tdCenter">
                            <div className="cellMain">{estudianteLabel}</div>
                            <div className="cellSub">{inst ? `Inst: ${inst}` : `ID: ${r.id_estudiante}`}</div>
                          </td>

                          <td className="tdCenter">
                            <div className="cellMain">{carrera}</div>
                            <div className="cellSub">{r.nombre_tribunal ?? `Tribunal ${r.id_tribunal}`}</div>
                          </td>

                          <td className="tdCenter">{periodo}</td>
                          <td className="tdCenter">{fecha}</td>
                          <td className="tdCenter">{horario}</td>
                          <td className="tdCenter">{estadoTrib}</td>

                          <td className="tdCenter">
                            <div className="cellMain">{entregaName}</div>
                            <div className="cellSub">{entregaFecha || "—"}</div>
                            <div className="cellSub">
                              <span className={badge.cls}>{badge.text}</span>
                            </div>
                          </td>

                          <td className="tdCenter">
                            <div className="actions">
                              <button
                                className="btnGhost"
                                onClick={() => openEntregaPdf(r)}
                                disabled={loading || !canOpen}
                                title={!isAsignadoTribunal(r) ? "No asignado a tribunal" : !hasEntrega(r) ? "Sin entrega" : "Ver PDF"}
                              >
                                <FileDown size={16} /> Ver
                              </button>

                              <button
                                className="btnGhost"
                                onClick={() => downloadEntregaPdf(r)}
                                disabled={loading || !canOpen}
                                title={!isAsignadoTribunal(r) ? "No asignado a tribunal" : !hasEntrega(r) ? "Sin entrega" : "Descargar PDF"}
                              >
                                <FileDown size={16} /> Descargar
                              </button>

                              <input
                                ref={(el) => {
                                  if (el) fileRefs.current[key] = el;
                                  else delete fileRefs.current[key];
                                }}
                                type="file"
                                accept="application/pdf,.pdf"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  e.target.value = "";
                                  onUpload(r, f);
                                }}
                              />

                              <button
                                className="btnPrimary"
                                onClick={() => pickFile(key)}
                                disabled={loading || !canUpload}
                                title={!isAsignadoTribunal(r) ? "No asignado a tribunal" : "Subir/Reemplazar PDF"}
                              >
                                <FileUp size={16} /> Subir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="emptyCell" colSpan={8}>
                        No hay estudiantes asignados a tribunales en este Carrera–Período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
