import { useEffect, useMemo, useState } from "react";
import "./TribunalViewModal.css";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";
import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

import { FileText, Download } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;

  tribunal: Tribunal | null;

  cpLabel: string;
  isActivo: (v: any) => boolean;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;

  onOpenAsignaciones?: (t: Tribunal) => void;
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
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [mostrarInactivas, setMostrarInactivas] = useState(true);
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !tribunal) return;

    (async () => {
      try {
        setLoading(true);
        const data = await tribunalEstudiantesService.list({
          tribunalId: tribunal.id_tribunal,
          includeInactive: true,
        });
        setAsignaciones(data ?? []);
      } catch {
        setAsignaciones([]);
        showToast?.("No se pudieron cargar las asignaciones del tribunal.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, tribunal, showToast]);

  const rows = useMemo(() => {
    const base = asignaciones ?? [];
    if (mostrarInactivas) return base;
    return base.filter((x) => isActivo(x.estado));
  }, [asignaciones, mostrarInactivas, isActivo]);

  if (!open || !tribunal) return null;

  const activo = isActivo(tribunal.estado);

  async function onDownloadCasoBase(a: any) {
    const idCaso = Number(a.id_caso_estudio) || 0;
    if (!idCaso) return;

    const key = `caso_${a.id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);
      const res = await casosEstudioService.download(idCaso);
      const blob = res?.data as Blob;
      const n = a.numero_caso ? `Caso_${a.numero_caso}` : `Caso_${idCaso}`;
      downloadBlob(blob, `${n}.pdf`);
    } catch {
      showToast?.("No se pudo descargar el caso base.", "error");
    } finally {
      setDownloadingKey(null);
    }
  }

  async function onDownloadEntrega(a: any) {
    const idCaso = Number(a.id_caso_estudio) || 0;
    if (!idCaso) return;

    const key = `entrega_${a.id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);
      const res = await entregasCasoService.download(Number(a.id_estudiante), idCaso);
      const blob = res?.data as Blob;

      const est =
        a.apellidos_estudiante && a.nombres_estudiante
          ? `${a.apellidos_estudiante}_${a.nombres_estudiante}`
          : `Est_${a.id_estudiante}`;

      const n = a.numero_caso ? `Caso_${a.numero_caso}` : `Caso_${idCaso}`;
      downloadBlob(blob, `Entrega_${safeFileName(est)}_${n}.pdf`);
    } catch {
      showToast?.("No se pudo descargar la entrega del estudiante.", "error");
    } finally {
      setDownloadingKey(null);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard modalWide tribunalViewCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="tvHeaderLeft">
            <h3 className="modalTitle">Detalle del tribunal</h3>
            <p className="tvSubtitle">
              {cpLabel ? (
                <>
                  Carrera–Período: <b>{cpLabel}</b>
                </>
              ) : (
                <span className="muted">Carrera–Período: —</span>
              )}
            </p>
          </div>

          <div className="tvHeaderRight">
            {onOpenAsignaciones ? (
              <button className="btnSecondary" onClick={() => onOpenAsignaciones(tribunal)} type="button">
                Ver / administrar asignaciones
              </button>
            ) : null}
            <button className="btnClose" onClick={onClose} type="button">
              ✕
            </button>
          </div>
        </div>

        <div className="modalBody tvBody">
          <div className="tvGrid">
            <div className="tvItem">
              <div className="tvKey">Nombre</div>
              <div className="tvVal">{tribunal.nombre_tribunal?.trim() ? tribunal.nombre_tribunal : "—"}</div>
            </div>

            <div className="tvItem tvItemFull">
              <div className="tvKey">Descripción</div>
              <div className="tvVal">{tribunal.descripcion_tribunal?.trim() ? tribunal.descripcion_tribunal : "—"}</div>
            </div>

            <div className="tvItem">
              <div className="tvKey">Estado</div>
              <div className="tvVal">
                <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>
                  {activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="tvItem">
              <div className="tvKey">ID Tribunal</div>
              <div className="tvVal">#{tribunal.id_tribunal}</div>
            </div>
          </div>

          <div className="separator" />

          <div className="tvAsignHeader">
            <div>
              <h4 className="tvSectionTitle">Asignaciones</h4>
              <p className="tvSectionSub">Estudiante + franja + caso (del estudiante) y PDFs.</p>
            </div>

            <label className="toggle tvToggle">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivas</span>
            </label>
          </div>

          <div className="tvTableWrap">
            <table className="table tvTable">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Franja</th>
                  <th>Caso</th>
                  <th style={{ width: 140 }}>PDFs</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      Cargando asignaciones...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      No hay asignaciones registradas para este tribunal.
                    </td>
                  </tr>
                ) : (
                  rows.map((a: any) => {
                    const ok = isActivo(a.estado);

                    const estudianteTxt =
                      a.apellidos_estudiante && a.nombres_estudiante
                        ? `${a.apellidos_estudiante} ${a.nombres_estudiante}`
                        : `ID estudiante: ${a.id_estudiante}`;

                    const franjaTxt =
                      a.fecha && a.hora_inicio && a.hora_fin
                        ? `${a.fecha} ${a.hora_inicio}–${a.hora_fin} • ${a.laboratorio ?? ""}`
                        : `ID franja: ${a.id_franja_horario}`;

                    const casoTxt = a.id_caso_estudio
                      ? `Caso ${a.numero_caso ?? a.id_caso_estudio}${a.titulo_caso ? ` — ${a.titulo_caso}` : ""}`
                      : "—";

                    const keyCaso = `caso_${a.id_tribunal_estudiante}`;
                    const keyEntrega = `entrega_${a.id_tribunal_estudiante}`;

                    return (
                      <tr key={a.id_tribunal_estudiante}>
                        <td>
                          <div className="tdTitle">{estudianteTxt}</div>
                          {a.id_institucional_estudiante ? (
                            <div className="tdSub">{a.id_institucional_estudiante}</div>
                          ) : null}
                        </td>

                        <td>{franjaTxt}</td>

                        <td>
                          <div className="tdTitle">{casoTxt}</div>
                          {!a.id_caso_estudio ? <div className="tdSub">Sin caso asignado</div> : null}
                        </td>

                        <td>
                          <div className="tvPdfBtns">
                            <button
                              className="iconBtn iconBtn_primary"
                              title="Descargar caso base"
                              type="button"
                              disabled={!a.id_caso_estudio || downloadingKey === keyCaso}
                              onClick={() => onDownloadCasoBase(a)}
                            >
                              <FileText className="iconAction" />
                            </button>

                            <button
                              className="iconBtn iconBtn_primary"
                              title="Descargar entrega del estudiante"
                              type="button"
                              disabled={!a.id_caso_estudio || downloadingKey === keyEntrega}
                              onClick={() => onDownloadEntrega(a)}
                            >
                              <Download className="iconAction" />
                            </button>
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${ok ? "badgeActive" : "badgeInactive"}`}>
                            {ok ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="hint tvHint">
            Tip: Puedes descargar el <b>caso base</b> y la <b>entrega del estudiante</b> desde los botones PDF.
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnPrimary" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
