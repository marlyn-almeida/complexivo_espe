// ✅ src/pages/misCalificaciones/MisCalificacionesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { misCalificacionesService } from "../../services/misCalificaciones.service";
import { entregasCasoService } from "../../services/entregasCaso.service";
import { notaTeoricaService } from "../../services/notaTeorica.service";
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
  Save,
  Eye,
  List,
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
   HELPERS (ADMIN)
   ========================= */

// ✅ Obtiene el path/nombre/fecha aunque el backend lo mande con nombres distintos
function entregaMeta(r: any) {
  const nombre =
    r?.entrega_archivo_nombre ??
    r?.archivo_nombre ??
    r?.estudiante_entrega_archivo_nombre ??
    r?.nombre_archivo ??
    null;

  const path =
    r?.entrega_archivo_path ??
    r?.archivo_path ??
    r?.estudiante_entrega_archivo_path ??
    r?.path_archivo ??
    null;

  const fecha =
    r?.entrega_fecha_entrega ??
    r?.fecha_entrega ??
    r?.estudiante_entrega_fecha_entrega ??
    r?.created_at ??
    null;

  const idEntrega = r?.id_entrega ?? r?.id_estudiante_entrega ?? null;

  return { nombre, path, fecha, idEntrega };
}

function hasEntrega(r: any) {
  const m = entregaMeta(r);
  return Boolean(m.path || m.nombre || m.idEntrega);
}

function isAsignadoTribunal(r: any) {
  // ✅ clave: solo si existe tribunal_estudiante en ESTE CP (ya viene correcto del repo)
  return Boolean(r?.id_tribunal_estudiante);
}

/* =========================
   HELPERS (DOCENTE)
   ========================= */
function isCerradoDocente(r: MiTribunalItem) {
  return Number((r as any).cerrado ?? 0) === 1;
}

/* =========================
   CP ACTIVO (para ctx.middleware)
   =========================
   ⚠️ Asegúrate de que esta KEY coincida con la usada en axiosClient.ts.
   Si en tu axiosClient guardaste otra, reemplaza aquí también.
*/
const CP_STORAGE_KEY = "active_carrera_periodo_id";
function setActiveCP(id: number | "") {
  if (!id) localStorage.removeItem(CP_STORAGE_KEY);
  else localStorage.setItem(CP_STORAGE_KEY, String(id));
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
  // ADMIN: MODAL NOTA TEÓRICA
  // =========================
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  const [notaTarget, setNotaTarget] = useState<MisCalificacionRow | null>(null);
  const [notaValor, setNotaValor] = useState<string>("");
  const [notaObs, setNotaObs] = useState<string>("");

  function openNotaModal(row: MisCalificacionRow) {
    if (!(row as any)?.id_estudiante) {
      showToast("Fila inválida: falta id_estudiante.", "info");
      return;
    }
    setNotaTarget(row);
    setNotaValor((row as any).nota_teorico_20 != null ? String((row as any).nota_teorico_20) : "");
    setNotaObs((row as any).nota_teorico_observacion ?? "");
    setNotaModalOpen(true);
  }

  async function saveNotaTeorica() {
    if (!(notaTarget as any)?.id_estudiante) return;

    const n = Number(notaValor);
    if (Number.isNaN(n) || n < 0 || n > 20) {
      showToast("La nota debe estar entre 0 y 20.", "info");
      return;
    }

    try {
      setLoading(true);

      await notaTeoricaService.save({
        id_estudiante: Number((notaTarget as any).id_estudiante),
        nota_teorico_20: n,
        observacion: notaObs?.trim() ? notaObs.trim() : undefined,
      });

      showToast("Nota teórica guardada.", "success");
      setNotaModalOpen(false);
      setNotaTarget(null);

      await loadAdminList();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
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

  // ✅ CLAVE: si no hay CP seleccionado => NO mostramos datos, y limpiamos ctx
  useEffect(() => {
    if (role !== 2) return;

    setActiveCP(selectedCP);

    if (!selectedCP) {
      setRows([]);
      return;
    }

    loadAdminList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP, role]);

  async function loadAdminList() {
    if (!selectedCP) return;

    try {
      setLoading(true);

      const data = await misCalificacionesService.list({
        carreraPeriodoId: Number(selectedCP),
        id_carrera_periodo: Number(selectedCP),
        _t: Date.now(),
      } as any);

      setRows((data ?? []) as any);
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
    return (rows ?? []).filter((r: any) => {
      if (!q) return true;

      const estudiante = `${r?.apellidos_estudiante ?? ""} ${r?.nombres_estudiante ?? ""}`.toLowerCase();
      const inst = String(r?.id_institucional_estudiante ?? "").toLowerCase();
      const trib = String(r?.nombre_tribunal ?? `Tribunal ${r?.id_tribunal ?? ""}`).toLowerCase();
      const carrera = String(r?.nombre_carrera ?? "").toLowerCase();

      return (
        estudiante.includes(q) ||
        inst.includes(q) ||
        trib.includes(q) ||
        carrera.includes(q) ||
        String(r?.id_estudiante ?? "").includes(q)
      );
    });
  }, [rows, search]);

  const filteredDocente = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (docRows ?? []).filter((r) => {
      if (!q) return true;
      const base = `${(r as any).estudiante ?? ""} ${(r as any).carrera ?? ""} ${(r as any).fecha ?? ""}`.toLowerCase();
      return base.includes(q);
    });
  }, [docRows, search]);

  // =========================
  // MÉTRICAS (como Docentes)
  // =========================
  const metrics = useMemo(() => {
    if (role === 3) {
      const total = filteredDocente.length;
      const abiertos = filteredDocente.filter((x) => !isCerradoDocente(x)).length;
      const cerrados = total - abiertos;
      return { total, ok: abiertos, warn: cerrados, okLabel: "Abiertos", warnLabel: "Cerrados" };
    }

    const total = filteredAdmin.length;
    const entregados = filteredAdmin.filter((x: any) => hasEntrega(x)).length;
    const pendientes = total - entregados;
    return { total, ok: entregados, warn: pendientes, okLabel: "Entregados", warnLabel: "Pendientes" };
  }, [filteredAdmin, filteredDocente, role]);

  // =========================
  // ADMIN: PDF actions
  // =========================
  async function openEntregaPdf(row: any) {
    if (!row?.id_estudiante) {
      showToast("Fila inválida: falta id_estudiante.", "info");
      return;
    }
    if (!isAsignadoTribunal(row)) {
      showToast("Este estudiante no está asignado a un tribunal.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudiante(Number(row.id_estudiante));
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

  async function downloadEntregaPdf(row: any) {
    if (!row?.id_estudiante) {
      showToast("Fila inválida: falta id_estudiante.", "info");
      return;
    }
    if (!isAsignadoTribunal(row)) {
      showToast("Este estudiante no está asignado a un tribunal.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudiante(Number(row.id_estudiante));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const meta = entregaMeta(row);
      const a = document.createElement("a");
      a.href = url;
      a.download = meta.nombre || `entrega_${row.id_estudiante}.pdf`;
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

  async function onUpload(row: any, file: File | null) {
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Solo se permite PDF.", "info");
      return;
    }

    if (!row?.id_estudiante) {
      showToast("Fila inválida: falta id_estudiante.", "info");
      return;
    }

    if (!isAsignadoTribunal(row)) {
      showToast("No se puede subir: el estudiante no está asignado a un tribunal.", "info");
      return;
    }

    try {
      setLoading(true);

      await entregasCasoService.subirByEstudiante({
        id_estudiante: Number(row.id_estudiante),
        archivo: file,
        observacion: "Entrega subida/reemplazada desde Mis Evaluaciones (ADMIN)",
      });

      showToast("Entrega subida/reemplazada correctamente.", "success");

      // ✅ optimista
      setRows((prev: any[]) =>
        (prev ?? []).map((x: any) => {
          if (Number(x?.id_estudiante) !== Number(row.id_estudiante)) return x;
          return {
            ...x,
            entrega_archivo_nombre: file.name,
            entrega_archivo_path: x?.entrega_archivo_path ?? x?.archivo_path ?? "__uploaded__",
            entrega_fecha_entrega: new Date().toISOString(),
          };
        })
      );

      await loadAdminList();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function entregaEstadoLabel(r: any) {
    if (!isAsignadoTribunal(r)) return { text: "No asignado", cls: "badge badge-warn" };
    if (!hasEntrega(r)) return { text: "Pendiente", cls: "badge badge-warn" };
    return { text: "Entregado", cls: "badge badge-ok" };
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="mcPage">
      <div className="wrap">

        {/* HERO (igual que tus pantallas ESPE) */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">{role === 3 ? "Mis Tribunales (DOCENTE)" : "Mis Evaluaciones (ADMIN)"}</h1>

              <p className="heroSubtitle">
                {role === 3 ? (
                  <>Agenda del docente. Entra a <b>Calificar</b> según tu rol y el Plan de Evaluación.</>
                ) : (
                  <>Gestión por <b>Carrera–Período</b>. Registra <b>nota teórica</b> y gestiona <b>PDF</b>.</>
                )}
              </p>

              {role === 2 && selectedCPLabel ? (
                <div className="heroHint">
                  Trabajando en: <b>{selectedCPLabel}</b>
                </div>
              ) : null}
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

          {/* ✅ Header estilo “Docentes”: título + 3 métricas */}
          <div className="boxHeader">
            <div className="boxHeaderLeft">
              <span className="boxIcon">
                <List size={18} />
              </span>
              <div className="boxHeaderText">
                <div className="boxTitle">{role === 3 ? "Listado de tribunales" : "Listado de evaluaciones"}</div>
                <div className="boxSubtitle">
                  {role === 3 ? "Solo verás tus tribunales asignados." : "Selecciona Carrera–Período para ver y gestionar."}
                </div>
              </div>
            </div>

            <div className="boxHeaderRight">
              <div className="statsRow">
                <div className="miniStat">
                  <div className="miniStatLabel">Total</div>
                  <div className="miniStatValue">{metrics.total}</div>
                </div>

                {role !== 3 && (
                  <>
                    <div className="miniStat miniStatOk">
                      <div className="miniStatLabel">Entregados</div>
                      <div className="miniStatValue">{metrics.ok}</div>
                    </div>

                    <div className="miniStat miniStatWarn">
                      <div className="miniStatLabel">Pendientes</div>
                      <div className="miniStatValue">{metrics.warn}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder={role === 3 ? "Buscar por estudiante / carrera / fecha..." : "Buscar por estudiante / carrera / tribunal..."}
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
                  ? "Presiona Calificar para ingresar."
                  : !selectedCP
                  ? "Selecciona Carrera–Período para gestionar notas y entregas."
                  : "Gestión activa por Carrera–Período."}
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
                    filteredDocente.map((r: any) => {
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
              <table className="table tableAdmin">
                <thead>
                  <tr>
                    <th className="thCenter" style={{ width: 320 }}>Estudiante</th>
                    <th className="thCenter" style={{ width: 320 }}>Carrera / Tribunal</th>
                    <th className="thCenter" style={{ width: 220 }}>Nota teórica</th>
                    <th className="thCenter" style={{ width: 260 }}>Entrega</th>
                    <th className="thCenter" style={{ width: 360 }}>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedCP ? (
                    <tr>
                      <td className="emptyCell" colSpan={5}>Seleccione una Carrera–Período para ver registros.</td>
                    </tr>
                  ) : loading ? (
                    <tr>
                      <td className="emptyCell" colSpan={5}>Cargando...</td>
                    </tr>
                  ) : filteredAdmin.length ? (
                    filteredAdmin.map((r: any) => {
                      const key = String(r.id_estudiante);
                      const badge = entregaEstadoLabel(r);
                      const meta = entregaMeta(r);

                      const estudianteLabel =
                        `${r.apellidos_estudiante ?? ""} ${r.nombres_estudiante ?? ""}`.trim() ||
                        `Estudiante ${r.id_estudiante}`;

                      const inst = (r.id_institucional_estudiante ?? "").trim();
                      const carrera = r.nombre_carrera ?? "—";
                      const tribunal = r.nombre_tribunal ?? `Tribunal ${r.id_tribunal ?? "—"}`;

                      const entregaName = meta.nombre || "—";
                      const entregaFecha = meta.fecha ? safeDateLabel(meta.fecha) : "";

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
                            <div className="cellSub">{tribunal}</div>
                          </td>

                          <td className="tdCenter">
                            <div className="cellMain">{r.nota_teorico_20 != null ? `${r.nota_teorico_20}/20` : "—"}</div>
                            <div className="cellSub">
                              {r.nota_teorico_observacion ? String(r.nota_teorico_observacion) : "Sin observación"}
                            </div>
                          </td>

                          <td className="tdCenter">
                            <div className="cellMain">{entregaName}</div>
                            <div className="cellSub">{entregaFecha || "—"}</div>
                            <div className="cellSub">
                              <span className={badge.cls}>{badge.text}</span>
                            </div>
                          </td>

                          <td className="tdCenter">
                            <div className="actionsRow">
                              <button
                                className="btnAction btnNota"
                                onClick={() => openNotaModal(r)}
                                disabled={loading}
                                title="Registrar/Editar nota teórica"
                              >
                                <Pencil size={16} /> Nota
                              </button>

                              <button
                                className="btnAction btnVer"
                                onClick={() => openEntregaPdf(r)}
                                disabled={loading || !canOpen}
                                title={!isAsignadoTribunal(r) ? "No asignado a tribunal" : !hasEntrega(r) ? "Sin entrega" : "Ver PDF"}
                              >
                                <Eye size={16} /> Ver
                              </button>

                              <button
                                className="btnAction btnDesc"
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
                                className="btnAction btnSubir"
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
                      <td className="emptyCell" colSpan={5}>No hay registros para este Carrera–Período.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ MODAL NOTA TEÓRICA */}
        {notaModalOpen && (
          <div className="modalOverlay" onClick={() => setNotaModalOpen(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <h3>Nota teórica (0–20)</h3>
                <button className="btnGhost" onClick={() => setNotaModalOpen(false)}>
                  <X size={16} /> Cerrar
                </button>
              </div>

              <div className="modalBody">
                <div className="formRow">
                  <label>Nota</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    max={20}
                    step={0.01}
                    value={notaValor}
                    onChange={(e) => setNotaValor(e.target.value)}
                    disabled={loading}
                    placeholder="Ej: 18.5"
                  />
                </div>

                <div className="formRow">
                  <label>Observación (opcional)</label>
                  <textarea
                    className="textarea"
                    value={notaObs}
                    onChange={(e) => setNotaObs(e.target.value)}
                    disabled={loading}
                    placeholder="Observaciones..."
                    rows={4}
                  />
                </div>
              </div>

              <div className="modalFooter">
                <button className="btnPrimary" onClick={saveNotaTeorica} disabled={loading}>
                  <Save size={16} /> Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
