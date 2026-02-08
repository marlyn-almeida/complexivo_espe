// ✅ src/pages/misCalificaciones/MisCalificacionesPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";

import { misCalificacionesService } from "../../services/misCalificaciones.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

import type { MisCalificacionRow } from "../../types/misCalificacion";

import {
  RefreshCw,
  Search,
  FileUp,
  FileDown,
  Users,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./MisCalificacionesPage.css";

type ToastType = "success" | "error" | "info";

function safeDateLabel(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function hasEntrega(r: MisCalificacionRow) {
  return !!(
    r.entrega_archivo_path ||
    r.entrega_archivo_nombre ||
    r.id_estudiante_caso_entrega
  );
}

export default function MisCalificacionesPage() {
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MisCalificacionRow[]>([]);
  const [search, setSearch] = useState("");

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendMsg(err: any) {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length && list[0]?.msg) return String(list[0].msg);
    if (typeof msg === "string" && msg.trim()) return msg;
    if (typeof err?.userMessage === "string" && err.userMessage.trim()) return err.userMessage;
    return err?.message || "Ocurrió un error.";
  }

  async function loadAll() {
    try {
      setLoading(true);
      const data = await misCalificacionesService.list();
      setRows(data ?? []);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (!q) return true;

      const estudiante = `${r.apellidos_estudiante ?? ""} ${r.nombres_estudiante ?? ""}`.toLowerCase();
      const inst = String(r.id_institucional_estudiante ?? "").toLowerCase();
      const trib = String(r.nombre_tribunal ?? `Tribunal ${r.id_tribunal}`).toLowerCase();
      const caso = String(r.id_caso_estudio ?? "").toLowerCase();

      return (
        estudiante.includes(q) ||
        inst.includes(q) ||
        trib.includes(q) ||
        caso.includes(q) ||
        String(r.id_estudiante).includes(q)
      );
    });
  }, [rows, search]);

  const total = filtered.length;

  // ✅ abrir PDF inline desde endpoint /entregas-caso/:id_estudiante/:id_caso_estudio/download
  async function openEntregaPdf(row: MisCalificacionRow) {
    if (!row?.id_estudiante || !row?.id_caso_estudio) {
      showToast("Este estudiante aún no tiene caso asignado.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);

      // ✅ OJO: esto asume que tu service tiene una función download(id_estudiante, id_caso_estudio)
      const res = await entregasCasoService.download(Number(row.id_estudiante), Number(row.id_caso_estudio));

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

  // ✅ descargar PDF (force)
  async function downloadEntregaPdf(row: MisCalificacionRow) {
    if (!row?.id_estudiante || !row?.id_caso_estudio) {
      showToast("Este estudiante aún no tiene caso asignado.", "info");
      return;
    }
    if (!hasEntrega(row)) {
      showToast("Aún no existe una entrega registrada para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);

      const res = await entregasCasoService.download(Number(row.id_estudiante), Number(row.id_caso_estudio));
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = row.entrega_archivo_nombre || `entrega_${row.id_estudiante}_${row.id_caso_estudio}.pdf`;
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

    if (!row?.id_estudiante || !row?.id_caso_estudio) {
      showToast("No se puede subir: este estudiante aún no tiene caso asignado.", "info");
      return;
    }

    try {
      setLoading(true);

      await entregasCasoService.subir({
        id_estudiante: Number(row.id_estudiante),
        id_caso_estudio: Number(row.id_caso_estudio),
        archivo: file,
        observacion: "Entrega subida desde Mis Calificaciones",
      });

      showToast("Entrega subida/reemplazada correctamente.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function entregaEstadoLabel(r: MisCalificacionRow) {
    const hasCaso = !!r.id_caso_estudio;
    const entregaOk = hasEntrega(r);

    if (!hasCaso) return { text: "Sin caso asignado", cls: "badge badge-warn" };
    if (!entregaOk) return { text: "Pendiente", cls: "badge badge-warn" };
    return { text: "Entregado", cls: "badge badge-ok" };
  }

  return (
    <div className="mcPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Mis Calificaciones</h1>
              <p className="heroSubtitle">
                Aquí aparecen automáticamente los estudiantes que ya están asignados a un <b>Tribunal</b>.
              </p>

              <div className="heroChips">
                <span className="chip">
                  <Users size={16} /> {total} registros
                </span>
                <span className="chip chipSoft">
                  <ClipboardList size={16} /> Entregas PDF por estudiante
                </span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={loadAll} disabled={loading}>
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
                placeholder="Buscar por tribunal, estudiante, ID institucional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="hintInline">
              <AlertTriangle size={16} />
              <span>Si el estudiante no tiene caso asignado, no se puede subir entrega.</span>
            </div>
          </div>

          {/* TABLE */}
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thCenter" style={{ width: 240 }}>Tribunal</th>
                  <th className="thCenter" style={{ width: 340 }}>Estudiante</th>
                  <th className="thCenter" style={{ width: 180 }}>Caso</th>
                  <th className="thCenter" style={{ width: 220 }}>Estado</th>
                  <th className="thCenter">Entrega</th>
                  <th className="thCenter" style={{ width: 320 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="emptyCell" colSpan={6}>Cargando...</td>
                  </tr>
                ) : filtered.length ? (
                  filtered.map((r) => {
                    // ✅ key estable
                    const key = `${r.id_tribunal}_${r.id_estudiante}`;

                    const badge = entregaEstadoLabel(r);

                    const tribunalLabel = r.nombre_tribunal || `Tribunal ${r.id_tribunal}`;
                    const estudianteLabel =
                      `${r.apellidos_estudiante ?? ""} ${r.nombres_estudiante ?? ""}`.trim() ||
                      `Estudiante ${r.id_estudiante}`;

                    const inst = (r.id_institucional_estudiante ?? "").trim();

                    const entregaName = r.entrega_archivo_nombre || "-";
                    const entregaFecha = r.entrega_fecha_entrega ? safeDateLabel(r.entrega_fecha_entrega) : "";

                    const canUpload = !!r.id_caso_estudio;
                    const canOpen = !!r.id_caso_estudio && hasEntrega(r);

                    return (
                      <tr key={`${r.id_tribunal}_${r.id_estudiante}`}>
                        <td className="tdCenter">
                          <div className="cellMain">{tribunalLabel}</div>
                          <div className="cellSub">ID: {r.id_tribunal}</div>
                        </td>

                        <td className="tdCenter">
                          <div className="cellMain">{estudianteLabel}</div>
                          <div className="cellSub">{inst ? `Inst: ${inst}` : `ID: ${r.id_estudiante}`}</div>
                        </td>

                        <td className="tdCenter">
                          {r.id_caso_estudio ? (
                            <span className="chipCode">CASO {r.id_caso_estudio}</span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>

                        <td className="tdCenter">
                          <span className={badge.cls}>{badge.text}</span>
                        </td>

                        <td className="tdCenter">
                          <div className="cellMain">{entregaName}</div>
                          <div className="cellSub">{entregaFecha || "—"}</div>
                        </td>

                        <td className="tdCenter">
                          <div className="actions">
                            {/* VER INLINE */}
                            <button
                              className="btnGhost"
                              onClick={() => openEntregaPdf(r)}
                              disabled={loading || !canOpen}
                              title={
                                !r.id_caso_estudio
                                  ? "Sin caso asignado"
                                  : !hasEntrega(r)
                                  ? "Sin entrega registrada"
                                  : "Ver PDF"
                              }
                            >
                              <FileDown size={16} /> Ver
                            </button>

                            {/* DESCARGAR */}
                            <button
                              className="btnGhost"
                              onClick={() => downloadEntregaPdf(r)}
                              disabled={loading || !canOpen}
                              title={
                                !r.id_caso_estudio
                                  ? "Sin caso asignado"
                                  : !hasEntrega(r)
                                  ? "Sin entrega registrada"
                                  : "Descargar PDF"
                              }
                            >
                              <FileDown size={16} /> Descargar
                            </button>

                            {/* SUBIR/REEMPLAZAR */}
                            <input
                              ref={(el) => {
                                // ✅ FIX: callback ref debe retornar void
                                // ✅ Limpieza cuando el input se desmonta
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
                              title={!r.id_caso_estudio ? "Sin caso asignado" : "Subir/Reemplazar PDF"}
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
                    <td className="emptyCell" colSpan={6}>
                      No hay estudiantes asignados a tribunales en este Carrera–Período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
