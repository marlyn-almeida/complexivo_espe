// ✅ src/pages/tribunales/TribunalViewModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  X,
  Users,
  CalendarDays,
  Clock,
  Lock,
  Unlock,
  Pencil,
  FileText,
  Download,
  Eye,
} from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { tribunalesService } from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

// ⚠️ Si tú ya tienes un servicio real de calificaciones/resumen, cámbialo aquí
// import { calificacionesService } from "../../services/calificaciones.service";

import "./TribunalViewModal.css";

type ToastType = "success" | "error" | "info";

type Props = {
  open: boolean;
  onClose: () => void;

  tribunal: Tribunal | null;
  cpLabel: string;

  isActivo: (v: any) => boolean;
  showToast: (msg: string, type?: ToastType) => void;

  // abre el modal de asignaciones (si quieres)
  onOpenAsignaciones: (t: Tribunal) => void;

  // ✅ NUEVO: para editar desde el view (si quieres conectarlo)
  onEdit?: (t: Tribunal) => void;

  // ✅ opcional: si tu cierre/apertura NO es por asignación sino por tribunal
  // si lo tienes, lo conectamos luego
};

function safeFileName(name: string) {
  return String(name || "archivo.pdf")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safeFileName(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  // si viene YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  return String(d).slice(0, 10);
}
function fmtTime(t?: string | null) {
  if (!t) return "—";
  return String(t).slice(0, 5);
}

type ResumenItem = {
  id_item?: number;
  nombre_item: string;
  porcentaje_global: number; // 0-100
  nota_item_20: number; // 0-20
  puntaje_ponderado: number; // ej 8.50
  tiene_detalle?: boolean;
};

type RubricaDetalleRow = {
  componente: string;
  evaluador: string;
  rol: string;
  criterio: string;
  calificacion: string;
  observaciones?: string | null;
};

function getFirstActiveAsign(asigs: TribunalEstudiante[]) {
  const rows = asigs ?? [];
  const active = rows.find((r: any) => Number(r?.estado ?? 1) === 1);
  return (active ?? rows[0] ?? null) as any;
}

/** ✅ Modal interno para el “Ver Detalle” (tu captura azul) */
function RubricaDetalleModal({
  open,
  onClose,
  title,
  subtitle,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  rows: RubricaDetalleRow[];
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard rubricaDetailCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="rubricaDetailHeader">
          <div className="rdhLeft">
            <div className="rdhTitle">{title}</div>
            {subtitle ? <div className="rdhSub">{subtitle}</div> : null}
          </div>
          <button className="btnClose" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="rdhBody">
          <div className="rdTableWrap">
            <table className="rdTable">
              <thead>
                <tr>
                  <th>Componente</th>
                  <th>Evaluador</th>
                  <th>Rol</th>
                  <th>Criterio</th>
                  <th>Calificación</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r, idx) => (
                    <tr key={idx}>
                      <td className="rdStrong">{r.componente}</td>
                      <td>{r.evaluador}</td>
                      <td>
                        <span className={`rdRole ${r.rol}`}>
                          {r.rol}
                        </span>
                      </td>
                      <td>{r.criterio}</td>
                      <td className="rdBlue">{r.calificacion}</td>
                      <td>{r.observaciones?.trim() ? r.observaciones : "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="rdEmpty">
                      No hay detalle para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rdFooter">
            <button className="rdBtn" onClick={onClose} type="button">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TribunalViewModal({
  open,
  onClose,
  tribunal,
  cpLabel,
  isActivo,
  showToast,
  onOpenAsignaciones,
  onEdit,
}: Props) {
  const [loading, setLoading] = useState(false);

  const [detail, setDetail] = useState<Tribunal | null>(null);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);

  // ✅ Resumen + detalle (si tienes servicios reales, los conectamos)
  const [resumen, setResumen] = useState<ResumenItem[]>([]);
  const [notaFinal, setNotaFinal] = useState<number | null>(null);

  const [openDetalle, setOpenDetalle] = useState(false);
  const [detalleTitle, setDetalleTitle] = useState("");
  const [detalleSub, setDetalleSub] = useState("");
  const [detalleRows, setDetalleRows] = useState<RubricaDetalleRow[]>([]);

  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const activeId = useMemo(() => Number((tribunal as any)?.id_tribunal) || 0, [tribunal]);

  const docentesOrdenados = useMemo(() => {
    const rows = (detail as any)?.docentes ?? [];
    const byRole = new Map<string, any>();
    for (const d of rows) byRole.set(String(d.designacion || ""), d);

    return {
      presidente: byRole.get("PRESIDENTE") ?? null,
      integrante1: byRole.get("INTEGRANTE_1") ?? null,
      integrante2: byRole.get("INTEGRANTE_2") ?? null,
      extra: rows.filter(
        (x: any) => !["PRESIDENTE", "INTEGRANTE_1", "INTEGRANTE_2"].includes(String(x.designacion || ""))
      ),
    };
  }, [detail]);

  const asignBase = useMemo(() => getFirstActiveAsign(asignaciones), [asignaciones]);

  const estadoDefensa = useMemo(() => {
    // ✅ ABIERTO/CERRADO: si hay asignación tomamos su cerrado
    if (!asignBase) return { label: "SIN ASIGNACIÓN", closed: null as boolean | null };
    const closed = Number((asignBase as any).cerrado ?? 0) === 1;
    return { label: closed ? "CERRADO" : "ABIERTO", closed };
  }, [asignBase]);

  useEffect(() => {
    if (!open || !activeId) return;

    (async () => {
      try {
        setLoading(true);

        // 1) detalle tribunal (docentes)
        let t: Tribunal | null = null;
        try {
          t = await tribunalesService.get(activeId);
        } catch {
          t = tribunal ?? null;
        }
        setDetail(t);

        // 2) asignaciones
        const a = await tribunalEstudiantesService.list({
          tribunalId: activeId,
          includeInactive: true,
          page: 1,
          limit: 400,
        });
        setAsignaciones(a ?? []);

        // 3) resumen calificaciones (si no hay servicio, queda vacío)
        //    ⚠️ Conecta tu endpoint real aquí
        try {
          // EJEMPLO (ajústalo a tu backend):
          // const r = await calificacionesService.resumenTribunal(activeId);
          // setResumen(r.items ?? []);
          // setNotaFinal(typeof r.nota_final === "number" ? r.nota_final : null);

          setResumen([]); // placeholder
          setNotaFinal(null);
        } catch {
          setResumen([]);
          setNotaFinal(null);
        }
      } catch {
        showToast("No se pudo cargar el detalle del tribunal.", "error");
        setDetail(tribunal ?? null);
        setAsignaciones([]);
        setResumen([]);
        setNotaFinal(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId]);

  if (!open || !tribunal) return null;

  const activo = isActivo((tribunal as any).estado);

  const estudianteTxt =
    asignBase?.apellidos_estudiante && asignBase?.nombres_estudiante
      ? `${(asignBase as any).apellidos_estudiante} ${(asignBase as any).nombres_estudiante}`
      : asignBase?.id_estudiante
        ? `ID estudiante: ${(asignBase as any).id_estudiante}`
        : "—";

  const institTxt = (asignBase as any)?.id_institucional_estudiante ?? "—";
  const fecha = fmtDate((asignBase as any)?.fecha);
  const horaIni = fmtTime((asignBase as any)?.hora_inicio);
  const horaFin = fmtTime((asignBase as any)?.hora_fin);

  async function onDownloadCasoBase(row: TribunalEstudiante) {
    const idCaso = Number((row as any).id_caso_estudio) || 0;
    if (!idCaso) return;

    const key = `caso_${(row as any).id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);
      const res = await casosEstudioService.download(idCaso);
      const blob = res?.data as Blob;

      const n = (row as any).numero_caso ? `Caso_${(row as any).numero_caso}` : `Caso_${idCaso}`;
      downloadBlob(blob, `${n}.pdf`);
    } catch {
      showToast("No se pudo descargar el caso base.", "error");
    } finally {
      setDownloadingKey(null);
    }
  }

  async function onDownloadEntrega(row: TribunalEstudiante) {
    const idEst = Number((row as any).id_estudiante) || 0;
    if (!idEst) return;

    const key = `entrega_${(row as any).id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);

      const anySvc: any = entregasCasoService as any;
      let res: any = null;

      if (typeof anySvc.downloadByEstudiante === "function") {
        res = await anySvc.downloadByEstudiante(idEst);
      } else if (typeof anySvc.download === "function") {
        const idEntrega = Number((row as any).id_entrega || (row as any).id_estudiante_caso_entrega) || 0;
        if (idEntrega) res = await anySvc.download(idEntrega);
        else {
          const idCaso = Number((row as any).id_caso_estudio) || 0;
          if (idCaso) res = await anySvc.download(idEst, idCaso);
          else throw new Error("No hay datos para descargar entrega");
        }
      }

      const blob = res?.data as Blob;

      const estName =
        (row as any).apellidos_estudiante && (row as any).nombres_estudiante
          ? `${(row as any).apellidos_estudiante}_${(row as any).nombres_estudiante}`
          : `Est_${idEst}`;

      downloadBlob(blob, `Entrega_${safeFileName(estName)}.pdf`);
    } catch {
      showToast("No se pudo descargar la entrega del estudiante.", "error");
    } finally {
      setDownloadingKey(null);
    }
  }

  function openDetalleRubrica(item: ResumenItem) {
    // ⚠️ Aquí normalmente pedirías el detalle real al backend.
    // Como aún no pegaste tu service de detalle, lo abrimos con dummy y luego lo conectamos.
    setDetalleTitle(item.nombre_item);
    setDetalleSub("Plantilla de Rúbrica: Rúbrica General de Examen Complexivo");
    setDetalleRows([]);
    setOpenDetalle(true);
  }

  const actaDisponible = Boolean((detail as any)?.acta_url || (detail as any)?.acta_pdf_url || (detail as any)?.id_acta);

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard tribunalProfileCard" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER tipo captura */}
        <div className="tpHeader">
          <div className="tpHeaderLeft">
            <div className="tpTitle">PERFIL DEL TRIBUNAL</div>
            <div className="tpSub">
              {estudianteTxt} {institTxt !== "—" ? `(${institTxt})` : ""} <span className="tpDot">•</span>{" "}
              {cpLabel || (tribunal as any).nombre_carrera || "—"}
            </div>
          </div>

          <button className="btnClose" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="tpBody">
          {/* Barra “Datos del Tribunal” + Estado + Acciones (como tu foto) */}
          <div className="tpSectionHead">
            <div className="tpSectionTitle">
              <span className="tpInfoDot">i</span> Datos del Tribunal
              <span
                className={`tpEstadoBadge ${
                  estadoDefensa.closed === null ? "neutral" : estadoDefensa.closed ? "closed" : "open"
                }`}
              >
                {estadoDefensa.label}
              </span>
            </div>

            <div className="tpHeadActions">
              {/* abrir/cerrar tribunal: por ahora es visual (conecta endpoint luego) */}
              <button
                className="tpBtn tpBtnGhost"
                type="button"
                onClick={() => showToast("Aquí conectamos Abrir/Cerrar Tribunal (endpoint).", "info")}
                disabled={!asignBase}
                title={!asignBase ? "Solo disponible cuando ya existe asignación" : undefined}
              >
                {estadoDefensa.closed ? <Unlock size={16} /> : <Lock size={16} />}{" "}
                {estadoDefensa.closed ? "Abrir Tribunal" : "Cerrar Tribunal"}
              </button>

              <button
                className="tpBtn tpBtnPrimary"
                type="button"
                onClick={() => (onEdit ? onEdit(tribunal) : showToast("Conecta onEdit desde el Page.", "info"))}
              >
                <Pencil size={16} /> Editar Datos
              </button>
            </div>
          </div>

          {/* Cards top: Estudiante / Fecha / Hora inicio / Hora fin */}
          <div className="tpCardsGrid">
            <div className="tpCard">
              <div className="tpCardLabel">
                <Users size={16} /> Estudiante
              </div>
              <div className="tpCardValue">{estudianteTxt}</div>
              <div className="tpCardSub">{institTxt}</div>
            </div>

            <div className="tpCard">
              <div className="tpCardLabel">
                <CalendarDays size={16} /> Fecha
              </div>
              <div className="tpCardValue">{fecha}</div>
            </div>

            <div className="tpCard">
              <div className="tpCardLabel">
                <Clock size={16} /> Hora Inicio
              </div>
              <div className="tpCardValue">{horaIni}</div>
            </div>

            <div className="tpCard">
              <div className="tpCardLabel">
                <Clock size={16} /> Hora Fin
              </div>
              <div className="tpCardValue">{horaFin}</div>
            </div>
          </div>

          {/* Miembros */}
          <div className="tpBlock">
            <div className="tpBlockTitle">
              <Users size={18} /> Miembros del Tribunal:
            </div>

            <div className="tpMiembros">
              <div className="tpMiembroRow">
                <span className="tpRoleBadge pres">Presidente</span>
                <span className="tpMiembroName">
                  {docentesOrdenados.presidente
                    ? `${docentesOrdenados.presidente.apellidos_docente ?? ""} ${docentesOrdenados.presidente.nombres_docente ?? ""}`.trim()
                    : "—"}
                </span>
              </div>

              <div className="tpMiembroRow">
                <span className="tpRoleBadge int1">Integrante1</span>
                <span className="tpMiembroName">
                  {docentesOrdenados.integrante1
                    ? `${docentesOrdenados.integrante1.apellidos_docente ?? ""} ${docentesOrdenados.integrante1.nombres_docente ?? ""}`.trim()
                    : "—"}
                </span>
              </div>

              <div className="tpMiembroRow">
                <span className="tpRoleBadge int2">Integrante2</span>
                <span className="tpMiembroName">
                  {docentesOrdenados.integrante2
                    ? `${docentesOrdenados.integrante2.apellidos_docente ?? ""} ${docentesOrdenados.integrante2.nombres_docente ?? ""}`.trim()
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen calificaciones + Nota final */}
          <div className="tpBlock">
            <div className="tpBlockTitle">Resumen de Calificaciones y Nota del Tribunal</div>

            {loading ? (
              <div className="tpEmpty">Cargando...</div>
            ) : resumen.length === 0 ? (
              <div className="tpEmpty">Sin calificaciones registradas.</div>
            ) : (
              <div className="tpTableWrap">
                <table className="tpTable">
                  <thead>
                    <tr>
                      <th>Ítem de Evaluación</th>
                      <th>% Ponderación Global</th>
                      <th>Nota Ítem (sobre 20)</th>
                      <th>Puntaje Ponderado</th>
                      <th style={{ width: 150 }}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.map((it, idx) => (
                      <tr key={idx}>
                        <td className="tpStrong">{it.nombre_item}</td>
                        <td>{it.porcentaje_global.toFixed(2)}%</td>
                        <td className="tpBlue">{it.nota_item_20.toFixed(2)}</td>
                        <td className="tpGreen">{it.puntaje_ponderado.toFixed(2)}</td>
                        <td>
                          <button
                            className="tpBtnSmall"
                            type="button"
                            onClick={() => openDetalleRubrica(it)}
                            disabled={!it.tiene_detalle}
                            title={!it.tiene_detalle ? "No hay detalle disponible" : undefined}
                          >
                            <Eye size={16} /> Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="tpNotaFinal">
                  🏆 <span>NOTA FINAL DEL TRIBUNAL (sobre 20):</span>{" "}
                  <b>{typeof notaFinal === "number" ? notaFinal.toFixed(2) : "—"}</b>
                </div>
              </div>
            )}
          </div>

          {/* Historial (placeholder) */}
          <div className="tpBlock">
            <div className="tpBlockTitle">Historial de Cambios</div>
            <div className="tpEmpty">
              (Aquí conectamos tu historial real. Si ya tienes endpoint/tabla, lo integramos.)
            </div>
          </div>

          {/* Acta */}
          <div className="tpBlock">
            <div className="tpBlockTitle">Acta del Tribunal</div>

            {!actaDisponible ? (
              <div className="tpActaEmpty">
                <div className="tpActaTitle">Acta no disponible</div>
                <div className="tpActaMsg">
                  El acta oficial del tribunal estará disponible para exportación una vez que el tribunal sea cerrado oficialmente.
                </div>
                <div className="tpActaState">
                  Estado actual: <b>{estadoDefensa.closed === true ? "CERRADO" : "ABIERTO"}</b>
                </div>
              </div>
            ) : (
              <button
                className="tpBtn tpBtnPrimary"
                type="button"
                onClick={() => showToast("Conecta descarga del acta (endpoint/url).", "info")}
              >
                <FileText size={16} /> Exportar Acta (PDF)
              </button>
            )}
          </div>

          {/* Bloque pequeño: PDF caso/entrega (si quieres mantenerlo) */}
          <div className="tpBlock">
            <div className="tpBlockTitle">Documentos</div>

            {!asignBase ? (
              <div className="tpEmpty">No hay asignación para descargar documentos.</div>
            ) : (
              <div className="tpDocBtns">
                <button
                  className="tpBtn tpBtnGhost"
                  type="button"
                  onClick={() => onDownloadCasoBase(asignBase)}
                  disabled={!Number((asignBase as any).id_caso_estudio) || downloadingKey === `caso_${(asignBase as any).id_tribunal_estudiante}`}
                >
                  <FileText size={16} /> Caso Base
                </button>

                <button
                  className="tpBtn tpBtnGhost"
                  type="button"
                  onClick={() => onDownloadEntrega(asignBase)}
                  disabled={downloadingKey === `entrega_${(asignBase as any).id_tribunal_estudiante}`}
                >
                  <Download size={16} /> Entrega Estudiante
                </button>

                <button className="tpBtn tpBtnGhost" type="button" onClick={() => onOpenAsignaciones(tribunal)}>
                  <CalendarDays size={16} /> Ver/Editar Asignación
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal detalle (captura azul) */}
      <RubricaDetalleModal
        open={openDetalle}
        onClose={() => setOpenDetalle(false)}
        title={detalleTitle || "Detalle"}
        subtitle={detalleSub}
        rows={detalleRows}
      />
    </div>
  );
}
