// src/pages/tribunales/TribunalViewModal.tsx
import { useEffect, useMemo, useState } from "react";
import { X, Users, CalendarPlus, FileText, Download } from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { tribunalesService } from "../../services/tribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

import "./TribunalViewModal.css";

type ToastType = "success" | "error" | "info";

type Props = {
  open: boolean;
  onClose: () => void;

  tribunal: Tribunal | null;
  cpLabel: string;

  isActivo: (v: any) => boolean;
  showToast: (msg: string, type?: ToastType) => void;

  onOpenAsignaciones: (t: Tribunal) => void;
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

function fmtDateTime(dt?: string | null) {
  if (!dt) return "—";
  // backend puede mandar "YYYY-MM-DD HH:mm:ss" o ISO. Mostramos “bonito” sin romper.
  return String(dt).replace("T", " ").slice(0, 19);
}

export default function TribunalViewModal({
  open,
  onClose,
  tribunal,
  cpLabel,
  isActivo,
  showToast,
  onOpenAsignaciones,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Tribunal | null>(null);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
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
        (x: any) =>
          !["PRESIDENTE", "INTEGRANTE_1", "INTEGRANTE_2"].includes(String(x.designacion || ""))
      ),
    };
  }, [detail]);

  useEffect(() => {
    if (!open || !activeId) return;

    (async () => {
      try {
        setLoading(true);

        // 1) detalle tribunal (para docentes)
        let t: Tribunal | null = null;
        try {
          t = await tribunalesService.get(activeId);
        } catch {
          // si el endpoint /tribunales/:id no existe o falla, usamos el objeto base
          t = tribunal ?? null;
        }
        setDetail(t);

        // 2) asignaciones tribunal_estudiante (incluye caso, franja, cerrado… si backend lo manda)
        const a = await tribunalEstudiantesService.list({
          tribunalId: activeId,
          includeInactive: true,
          page: 1,
          limit: 300,
        });
        setAsignaciones(a ?? []);
      } catch {
        showToast("No se pudo cargar el detalle del tribunal.", "error");
        setDetail(tribunal ?? null);
        setAsignaciones([]);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId]);

  if (!open || !tribunal) return null;

  const activo = isActivo((tribunal as any).estado);

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

      /**
       * ✅ IMPORTANTE (tu aclaración):
       * La entrega ES del estudiante y NO depende del caso.
       * Entonces intentamos descargar por estudiante.
       *
       * Si tu service aún no tiene downloadByEstudiante, abajo hay fallback.
       */
      const anySvc: any = entregasCasoService as any;

      let res: any = null;

      if (typeof anySvc.downloadByEstudiante === "function") {
        // recomendado: GET /entregas-caso/estudiante/:id/download (por ejemplo)
        res = await anySvc.downloadByEstudiante(idEst);
      } else if (typeof anySvc.download === "function") {
        // fallback: si tu service actual requiere 1 parámetro (id_entrega) o (id_estudiante, id_caso)
        // 1) si el backend te devuelve id_entrega en el row, lo usamos
        const idEntrega = Number((row as any).id_entrega || (row as any).id_estudiante_caso_entrega) || 0;

        if (idEntrega) {
          res = await anySvc.download(idEntrega);
        } else {
          // 2) último fallback: si tu endpoint de download usa (id_estudiante, id_caso_estudio)
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

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard tribunalViewCard" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modalHeader tribunalViewHeader">
          <div className="tvTitleWrap">
            <h3 className="tvTitle">Ver Tribunal</h3>
            <p className="tvSubtitle">
              {tribunal.nombre_tribunal} <span className="tvDot">•</span>{" "}
              {cpLabel || tribunal.nombre_carrera || "—"}
            </p>
          </div>

          <button className="btnClose" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="tvBody">
          {/* TOP INFO */}
          <div className="tvTopGrid">
            <div className="tvCard">
              <div className="tvCardTitle">Información</div>

              <div className="tvInfoRow">
                <span className="tvLabel">Estado:</span>
                <span className={`tvBadge ${activo ? "ok" : "off"}`}>
                  {activo ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>

              <div className="tvInfoRow">
                <span className="tvLabel">Descripción:</span>
                <span className="tvValue">
                  {(tribunal as any).descripcion_tribunal?.trim() ? (tribunal as any).descripcion_tribunal : "—"}
                </span>
              </div>

              <div className="tvInfoRow">
                <span className="tvLabel">ID:</span>
                <span className="tvValue">#{tribunal.id_tribunal}</span>
              </div>

              <div className="tvActionsTop">
                <button
                  className="tvBtnPrimary"
                  onClick={() => onOpenAsignaciones(tribunal)}
                  type="button"
                >
                  <CalendarPlus size={18} /> Asignaciones
                </button>
              </div>
            </div>

            <div className="tvCard">
              <div className="tvCardTitle">
                <span className="tvCardIcon">
                  <Users size={18} />
                </span>
                Docentes
              </div>

              <div className="tvDocGrid">
                <div className="tvDocRow">
                  <span className="tvDocRole">Presidente</span>
                  <span className="tvDocName">
                    {docentesOrdenados.presidente
                      ? `${docentesOrdenados.presidente.apellidos_docente ?? ""} ${docentesOrdenados.presidente.nombres_docente ?? ""}`.trim()
                      : "—"}
                  </span>
                </div>

                <div className="tvDocRow">
                  <span className="tvDocRole">Integrante 1</span>
                  <span className="tvDocName">
                    {docentesOrdenados.integrante1
                      ? `${docentesOrdenados.integrante1.apellidos_docente ?? ""} ${docentesOrdenados.integrante1.nombres_docente ?? ""}`.trim()
                      : "—"}
                  </span>
                </div>

                <div className="tvDocRow">
                  <span className="tvDocRole">Integrante 2</span>
                  <span className="tvDocName">
                    {docentesOrdenados.integrante2
                      ? `${docentesOrdenados.integrante2.apellidos_docente ?? ""} ${docentesOrdenados.integrante2.nombres_docente ?? ""}`.trim()
                      : "—"}
                  </span>
                </div>
              </div>

              {(docentesOrdenados.extra?.length ?? 0) > 0 ? (
                <div className="tvHint">
                  * Hay docentes adicionales devueltos por el backend (no estándar).
                </div>
              ) : null}
            </div>
          </div>

          {/* ASIGNACIONES TABLE */}
          <div className="tvCard tvCardTable">
            <div className="tvCardTitle">Estudiantes asignados</div>

            {loading ? (
              <div className="tvEmpty">Cargando...</div>
            ) : asignaciones.length === 0 ? (
              <div className="tvEmpty">No hay asignaciones aún.</div>
            ) : (
              <div className="tvTableWrap">
                <table className="tvTable">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Franja</th>
                      <th>Caso</th>
                      <th>Estado</th>
                      <th style={{ width: 190 }}>PDF</th>
                    </tr>
                  </thead>

                  <tbody>
                    {asignaciones.map((row: any) => {
                      const idRow = Number(row.id_tribunal_estudiante);
                      const keyCaso = `caso_${idRow}`;
                      const keyEntrega = `entrega_${idRow}`;

                      const estTxt =
                        row.apellidos_estudiante && row.nombres_estudiante
                          ? `${row.apellidos_estudiante} ${row.nombres_estudiante}`
                          : `ID estudiante: ${row.id_estudiante}`;

                      const frTxt =
                        row.fecha && row.hora_inicio && row.hora_fin
                          ? `${row.fecha} ${row.hora_inicio}–${row.hora_fin} • ${row.laboratorio ?? ""}`
                          : `ID franja: ${row.id_franja_horario}`;

                      const casoTxt = row.id_caso_estudio
                        ? `Caso ${row.numero_caso ?? row.id_caso_estudio}${row.titulo_caso ? ` — ${row.titulo_caso}` : ""}`
                        : "—";

                      // ✅ ABIERTO/CERRADO (nuevo)
                      const cerrado = Number(row.cerrado) === 1;
                      const badgeTxt = cerrado ? "CERRADO" : "ABIERTO";

                      return (
                        <tr key={idRow}>
                          <td>
                            <div className="tvStrong">{estTxt}</div>
                            <div className="tvSmall">{row.id_institucional_estudiante ?? "—"}</div>
                          </td>

                          <td>{frTxt}</td>

                          <td>
                            <div className="tvStrong">{casoTxt}</div>
                            {!row.id_caso_estudio ? (
                              <div className="tvSmall">Sin caso asociado</div>
                            ) : null}
                          </td>

                          <td>
                            <span className={`tvBadge ${cerrado ? "off" : "ok"}`}>{badgeTxt}</span>
                            <div className="tvSmall">
                              {cerrado ? (
                                <>
                                  {row.fecha_cierre ? `Cierre: ${fmtDateTime(row.fecha_cierre)}` : "Cierre: —"}
                                  {row.apellidos_docente_cierra || row.nombres_docente_cierra ? (
                                    <>
                                      <br />
                                      Por: {(row.apellidos_docente_cierra ?? "") + " " + (row.nombres_docente_cierra ?? "")}
                                    </>
                                  ) : null}
                                </>
                              ) : (
                                "Pendiente de cierre"
                              )}
                            </div>
                          </td>

                          <td>
                            <div className="tvPdfBtns">
                              <button
                                className="tvIconBtn"
                                title="Descargar Caso base (PDF)"
                                onClick={() => onDownloadCasoBase(row)}
                                disabled={!row.id_caso_estudio || downloadingKey === keyCaso}
                                type="button"
                              >
                                <FileText size={18} />
                              </button>

                              <button
                                className="tvIconBtn"
                                title="Descargar Entrega del estudiante (PDF)"
                                onClick={() => onDownloadEntrega(row)}
                                disabled={downloadingKey === keyEntrega}
                                type="button"
                              >
                                <Download size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="tvFootHint">
                  Los PDF del caso requieren <b>id_caso_estudio</b> en la asignación. El PDF de entrega se descarga por estudiante.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="modalFooter">
          <button className="tvBtnGhost" onClick={onClose} type="button">
            Cerrar
          </button>
          <button className="tvBtnPrimary" onClick={() => onOpenAsignaciones(tribunal)} type="button">
            <CalendarPlus size={18} /> Ir a Asignaciones
          </button>
        </div>
      </div>
    </div>
  );
}
