// ✅ src/pages/misCalificaciones/CalificarTribunalPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCcw,
  Save,
  ClipboardCheck,
  BadgeCheck,
  FileText,
  Eye,
  Download,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./CalificarTribunalPage.css";

import {
  misCalificacionesDocenteService,
  type ItemPlan,
  type Nivel,
  type SavePayload,
  type MisCalificacionesDocenteResponse,
} from "../../services/misCalificacionesDocente.service";

// ✅ PDFs
import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

type ToastType = "success" | "error" | "info";
type SelectedMap = Record<number, { id_nivel: number; observacion?: string | null }>;

// ✅ si navegas desde otra pantalla puedes mandar estos por state
type NavState = { id_estudiante?: number; id_caso_estudio?: number };

function extractMsg(e: any) {
  const msg = e?.response?.data?.message;
  const errs = e?.response?.data?.errors;
  if (Array.isArray(errs) && errs.length && errs[0]?.msg) return String(errs[0].msg);
  if (typeof msg === "string" && msg.trim()) return msg;
  return e?.message || "Ocurrió un error.";
}

function isPdfResponse(res: any) {
  const ct = String(res?.headers?.["content-type"] ?? "");
  return ct.includes("pdf");
}

function openPdfFromAxios(res: any) {
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadPdfFromAxios(res: any, filename: string) {
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function CalificarTribunalPage() {
  const nav = useNavigate();
  const { idTribunalEstudiante } = useParams();
  const id_te = Number(idTribunalEstudiante || 0);

  const location = useLocation();
  const navState = (location.state || {}) as NavState;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const [header, setHeader] = useState<{
    mi_designacion?: string | null;
    plan_nombre?: string | null;
    cerrado?: 0 | 1 | boolean;

    // ✅ PDFs:
    id_estudiante?: number | null;     // para entrega
    id_caso_estudio?: number | null;   // para caso estudio

    estudiante_label?: string | null;
  } | null>(null);

  const [items, setItems] = useState<ItemPlan[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});
  const [obsGeneral, setObsGeneral] = useState("");

  const cerrado = Number(header?.cerrado ?? 0) === 1;

  function buildInitialSelected(resp: MisCalificacionesDocenteResponse): SelectedMap {
    const out: SelectedMap = {};
    const existentes = resp?.data?.existentes ?? [];
    for (const r of existentes) {
      const idCrit = Number((r as any).id_rubrica_criterio);
      const idNivel = Number((r as any).id_rubrica_nivel);
      if (idCrit > 0 && idNivel > 0) {
        out[idCrit] = { id_nivel: idNivel, observacion: (r as any).observacion ?? "" };
      }
    }
    return out;
  }

  async function load() {
    if (!id_te) {
      setToast({ type: "error", msg: "ID inválido del tribunal-estudiante." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const resp = await misCalificacionesDocenteService.get(id_te);

      const planNombre = resp.data?.plan?.nombre_plan ?? null;
      const mi = resp.data?.mi_designacion ?? null;

      // ✅ Traer IDs desde backend (preferido), o desde state como respaldo
      const idEstBackend = Number((resp as any)?.data?.id_estudiante ?? 0) || 0;
      const idCasoBackend = Number((resp as any)?.data?.id_caso_estudio ?? 0) || 0;

      const idEstState = Number(navState?.id_estudiante ?? 0) || 0;
      const idCasoState = Number(navState?.id_caso_estudio ?? 0) || 0;

      const idEst = idEstBackend || idEstState || 0;
      const idCaso = idCasoBackend || idCasoState || 0;

      const estudianteLabel = (resp as any)?.data?.estudiante ?? null;

      setHeader({
        mi_designacion: mi,
        plan_nombre: planNombre,
        cerrado: resp.data?.cerrado ?? 0,

        id_estudiante: idEst ? Number(idEst) : null,
        id_caso_estudio: idCaso ? Number(idCaso) : null,

        estudiante_label: estudianteLabel ? String(estudianteLabel) : null,
      });

      setItems(resp.data?.estructura ?? []);
      setSelected(buildInitialSelected(resp));
      setObsGeneral("");
    } catch (e: any) {
      setItems([]);
      setSelected({});
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_te]);

  function nivelesOf(item: ItemPlan): Nivel[] {
    return Array.isArray((item as any).niveles) ? (item as any).niveles : [];
  }

  function onPick(idCriterio: number, idNivel: number) {
    setSelected((prev) => ({
      ...prev,
      [idCriterio]: { ...prev[idCriterio], id_nivel: idNivel },
    }));
  }

  function onObsCriterio(idCriterio: number, v: string) {
    setSelected((prev) => ({
      ...prev,
      [idCriterio]: { ...prev[idCriterio], observacion: v },
    }));
  }

  // =========================
  // ✅ PDFs (2 documentos)
  // =========================

  // 1) ✅ CASO DE ESTUDIO (PDF) → por id_caso_estudio
  async function verCasoEstudio() {
    const idCaso = Number(header?.id_caso_estudio ?? 0);
    if (!idCaso) {
      setToast({
        type: "info",
        msg: "No se pudo determinar el caso de estudio (falta id_caso_estudio). Devuélvelo en el backend.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await casosEstudioService.download(idCaso);

      if (!isPdfResponse(res)) {
        const txt = await new Response(res.data).text();
        console.error("CasoEstudio no-PDF:", txt);
        setToast({ type: "error", msg: "El backend no devolvió un PDF del caso de estudio." });
        return;
      }

      openPdfFromAxios(res);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  async function descargarCasoEstudio() {
    const idCaso = Number(header?.id_caso_estudio ?? 0);
    if (!idCaso) {
      setToast({
        type: "info",
        msg: "No se pudo determinar el caso de estudio (falta id_caso_estudio). Devuélvelo en el backend.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await casosEstudioService.download(idCaso);

      if (!isPdfResponse(res)) {
        const txt = await new Response(res.data).text();
        console.error("CasoEstudio no-PDF:", txt);
        setToast({ type: "error", msg: "El backend no devolvió un PDF del caso de estudio." });
        return;
      }

      downloadPdfFromAxios(res, `caso_estudio_${idCaso}.pdf`);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  // 2) ✅ ENTREGA DEL ESTUDIANTE (PDF) → por id_estudiante
  async function verEntregaEstudiante() {
    const idEst = Number(header?.id_estudiante ?? 0);
    if (!idEst) {
      setToast({
        type: "info",
        msg: "No se pudo determinar el estudiante (falta id_estudiante). Devuélvelo en el backend.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await entregasCasoService.downloadByEstudiante(idEst);

      if (!isPdfResponse(res)) {
        const txt = await new Response(res.data).text();
        console.error("Entrega no-PDF:", txt);
        setToast({ type: "error", msg: "El backend no devolvió un PDF de la entrega." });
        return;
      }

      openPdfFromAxios(res);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  async function descargarEntregaEstudiante() {
    const idEst = Number(header?.id_estudiante ?? 0);
    if (!idEst) {
      setToast({
        type: "info",
        msg: "No se pudo determinar el estudiante (falta id_estudiante). Devuélvelo en el backend.",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await entregasCasoService.downloadByEstudiante(idEst);

      if (!isPdfResponse(res)) {
        const txt = await new Response(res.data).text();
        console.error("Entrega no-PDF:", txt);
        setToast({ type: "error", msg: "El backend no devolvió un PDF de la entrega." });
        return;
      }

      downloadPdfFromAxios(res, `entrega_estudiante_${idEst}.pdf`);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ✅ SAVE
  // =========================
  async function onSave() {
    if (cerrado) {
      setToast({ type: "info", msg: "Este tribunal está cerrado. No se pueden guardar cambios." });
      return;
    }

    const payload: SavePayload = { items: [] };

    for (const it of items) {
      const compsOut: Array<{
        id_rubrica_componente: number;
        criterios: Array<{
          id_rubrica_criterio: number;
          id_rubrica_nivel: number;
          observacion?: string;
        }>;
      }> = [];

      for (const comp of it.componentes || []) {
        const criteriosOut: Array<{
          id_rubrica_criterio: number;
          id_rubrica_nivel: number;
          observacion?: string;
        }> = [];

        for (const crit of comp.criterios || []) {
          const pick = selected[crit.id_rubrica_criterio];
          if (!pick?.id_nivel) continue;

          const obs = String(pick.observacion ?? "").trim();

          criteriosOut.push({
            id_rubrica_criterio: Number(crit.id_rubrica_criterio),
            id_rubrica_nivel: Number(pick.id_nivel),
            ...(obs ? { observacion: obs } : {}),
          });
        }

        if (criteriosOut.length) {
          compsOut.push({
            id_rubrica_componente: Number(comp.id_rubrica_componente),
            criterios: criteriosOut,
          });
        }
      }

      if (compsOut.length) {
        payload.items.push({
          id_plan_item: Number(it.id_plan_item),
          componentes: compsOut,
        });
      }
    }

    if (!payload.items.length) {
      setToast({ type: "info", msg: "Selecciona al menos un criterio para guardar." });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      await misCalificacionesDocenteService.save(id_te, payload);
      setToast({ type: "success", msg: "Calificaciones guardadas correctamente." });
      await load();
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  const totalItems = items.length;

  const totalSeleccionados = useMemo(() => {
    return Object.values(selected || {}).filter((x) => Number(x?.id_nivel || 0) > 0).length;
  }, [selected]);

  return (
    <div className="califPage wrap containerFull">
      {/* HERO */}
      <div className="hero">
        <div className="heroLeft">
          <img className="heroLogo" src={escudoESPE} alt="ESPE" />
          <div className="heroText">
            <h1 className="heroTitle">CALIFICAR TRIBUNAL</h1>
            <p className="heroSubtitle">
              {header?.plan_nombre ? (
                <>
                  Plan activo: <b>{header.plan_nombre}</b>
                </>
              ) : (
                "Cargando información..."
              )}
            </p>
          </div>
        </div>

        <div className="heroActions">
          <button className="heroBtn ghost" onClick={load} disabled={loading || saving} title="Actualizar">
            <RefreshCcw className="heroBtnIcon" />
            Actualizar
          </button>

          <button className="heroBtn primary" onClick={onSave} disabled={loading || saving || cerrado} title="Guardar">
            <Save className="heroBtnIcon" />
            {saving ? "Guardando..." : "Guardar Mis Calificaciones"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="toastClose" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* Breadcrumb + Rol */}
      <div className="crumbRow">
        <div className="crumb">
          <button className="crumbLink" onClick={() => nav("/docente/calificaciones")}>
            Mis Evaluaciones
          </button>
          <span className="crumbSep">/</span>
          <span className="crumbHere">Calificar</span>
        </div>

        <div className="rolePill">
          <BadgeCheck size={16} />
          <span>
            Tu designación: <b>{header?.mi_designacion || "Miembro"}</b>
          </span>
        </div>
      </div>

      {/* ✅ DOCUMENTOS: 2 PDFs */}
      <div className="box" style={{ marginBottom: 16 }}>
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <FileText />
            </span>
            <span>Documentos del Tribunal</span>
          </div>

          <div className="boxRight">
            {header?.estudiante_label ? (
              <div className="roleBadge">
                <span>Estudiante:</span>
                <b>{header.estudiante_label}</b>
              </div>
            ) : null}
          </div>
        </div>

        <div className="docRow">
          {/* ✅ PDF 1 */}
          <div className="docCard">
            <div className="docTitle">Caso de Estudio (PDF)</div>
            <div className="docSub">Documento asignado a la asignación tribunal-estudiante.</div>
            <div className="docActions">
              <button className="btnGhost" onClick={verCasoEstudio} disabled={loading}>
                <Eye size={16} /> Ver
              </button>
              <button className="btnPrimary" onClick={descargarCasoEstudio} disabled={loading}>
                <Download size={16} /> Descargar
              </button>
            </div>
          </div>

          {/* ✅ PDF 2 */}
          <div className="docCard">
            <div className="docTitle">Entrega del Estudiante (PDF)</div>
            <div className="docSub">Archivo subido por el estudiante/administración.</div>
            <div className="docActions">
              <button className="btnGhost" onClick={verEntregaEstudiante} disabled={loading}>
                <Eye size={16} /> Ver
              </button>
              <button className="btnPrimary" onClick={descargarEntregaEstudiante} disabled={loading}>
                <Download size={16} /> Descargar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Box principal */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <ClipboardCheck />
            </span>
            <span>Formulario de Calificación</span>
          </div>

          <div className="boxRight">
            <div className={`statePill ${cerrado ? "off" : "on"}`}>{cerrado ? "CERRADO" : "ABIERTO"}</div>
            <div className="roleBadge">
              <span>Designación:</span>
              <b>{header?.mi_designacion || "Miembro"}</b>
            </div>
          </div>
        </div>

        <div className="meta">
          <div>
            <b>Tribunal-Estudiante:</b> {id_te}
          </div>
          <div>
            <b>Items a calificar:</b> {totalItems}
          </div>
          <div>
            <b>Criterios seleccionados:</b> {totalSeleccionados}
          </div>
        </div>

        {loading ? (
          <div className="emptyBox">Cargando estructura...</div>
        ) : !items.length ? (
          <div className="emptyBox">
            No hay estructura para calificar (plan/rúbrica no disponibles o no asignados a tu rol).
          </div>
        ) : (
          items.map((item) => {
            const niveles = nivelesOf(item);

            return (
              <div className="rubricaCard" key={item.id_plan_item}>
                <div className="rubricaCardHead">
                  <div className="rubricaCardTitle">
                    <span className="rubricaIndex">{item.nombre_item}</span>
                    {item.ponderacion_global_pct != null && (
                      <span className="chipPercent">{Number(item.ponderacion_global_pct).toFixed(2)}%</span>
                    )}
                  </div>
                  <div className="rubricaCardSub">Rúbrica ID: {item.id_rubrica ?? "—"}</div>
                </div>

                {(item.componentes || []).map((comp) => (
                  <div className="compBlock" key={comp.id_rubrica_componente}>
                    <div className="compTitle">
                      <span className="compDot" />
                      <b>{comp.nombre_componente}</b>
                      {comp.tipo_componente ? <span className="compHint">({comp.tipo_componente})</span> : null}
                    </div>

                    <div className="tableWrap">
                      <table className="tableRubrica">
                        <thead>
                          <tr>
                            <th className="thCriterio">Criterio</th>

                            {niveles.map((n) => (
                              <th key={n.id_rubrica_nivel} className="thNivel">
                                {n.nombre_nivel}
                                <div className="muted">({Number(n.valor_nivel).toFixed(2)})</div>
                              </th>
                            ))}

                            <th className="thObs">Observación (Opcional)</th>
                          </tr>
                        </thead>

                        <tbody>
                          {(comp.criterios || []).map((crit) => {
                            const picked = selected[crit.id_rubrica_criterio]?.id_nivel ?? null;

                            return (
                              <tr key={crit.id_rubrica_criterio}>
                                <td className="tdCriterio">
                                  <div className="critMain">{crit.nombre_criterio}</div>
                                </td>

                                {niveles.map((n) => {
                                  const checked = picked === n.id_rubrica_nivel;

                                  return (
                                    <td key={n.id_rubrica_nivel} className={`tdNivel ${checked ? "sel" : ""}`}>
                                      <label className="nivelOption">
                                        <input
                                          type="radio"
                                          name={`crit-${crit.id_rubrica_criterio}`}
                                          checked={checked}
                                          disabled={cerrado}
                                          onChange={() => onPick(crit.id_rubrica_criterio, n.id_rubrica_nivel)}
                                        />
                                        <span className="nivelRadio" />
                                        <span className="nivelText">{n.nombre_nivel}</span>
                                      </label>
                                    </td>
                                  );
                                })}

                                <td className="tdObs">
                                  <textarea
                                    className="obsInput"
                                    placeholder="Observación específica..."
                                    value={selected[crit.id_rubrica_criterio]?.observacion || ""}
                                    disabled={cerrado}
                                    onChange={(e) => onObsCriterio(crit.id_rubrica_criterio, e.target.value)}
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}

        {/* Observación general */}
        <div className="obsGeneralWrap">
          <div className="obsGeneralLabel">Observación General (Opcional)</div>
          <textarea
            className="obsGeneral"
            placeholder="Observación general..."
            value={obsGeneral}
            disabled={cerrado}
            onChange={(e) => setObsGeneral(e.target.value)}
          />
          <div className="muted" style={{ marginTop: 6 }}>
            * Por ahora es solo visual. Si luego guardas esta observación en backend, se envía/recupera aquí.
          </div>
        </div>

        {/* Footer */}
        <div className="footerBtns">
          <button className="btnPrimary" onClick={onSave} disabled={loading || saving || cerrado}>
            <Save size={18} />
            {saving ? "Guardando..." : "Guardar Mis Calificaciones"}
          </button>

          <button className="btnGhost" onClick={() => nav("/docente/calificaciones")}>
            <ArrowLeft size={18} />
            Volver a Mis Evaluaciones
          </button>
        </div>
      </div>
    </div>
  );
}
