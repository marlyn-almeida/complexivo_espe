import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { ToggleLeft, ToggleRight, FileText, Download } from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";

import "./TribunalAsignacionesModal.css";
import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
};

type Props = {
  showAsignModal: boolean;
  setShowAsignModal: (v: boolean) => void;

  activeTribunalForAsign: Tribunal | null;

  asignForm: AsignacionFormState;
  setAsignForm: Dispatch<SetStateAction<AsignacionFormState>>;

  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  asignaciones: TribunalEstudiante[];

  errors: Record<string, string>;
  loading: boolean;

  onCreateAsignacion: () => void;
  onToggleAsignEstado: (row: TribunalEstudiante) => void;

  isActivo: (v: any) => boolean;
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

export default function TribunalAsignacionesModal({
  showAsignModal,
  setShowAsignModal,
  activeTribunalForAsign,
  asignForm,
  setAsignForm,
  estudiantes,
  franjas,
  asignaciones,
  errors,
  loading,
  onCreateAsignacion,
  onToggleAsignEstado,
  isActivo,
}: Props) {
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  const selectedEst = useMemo(() => {
    if (!asignForm.id_estudiante) return null;
    return (estudiantes ?? []).find((x: any) => Number(x.id_estudiante) === Number(asignForm.id_estudiante)) ?? null;
  }, [asignForm.id_estudiante, estudiantes]);

  // Info informativa del caso del estudiante (si el backend lo devuelve enriquecido)
  const selectedCaseInfo = useMemo(() => {
    const anyEst: any = selectedEst as any;
    if (!anyEst) return null;

    const id_caso_estudio = Number(anyEst.id_caso_estudio) || 0;
    const numero_caso = anyEst.numero_caso ?? anyEst.caso_numero ?? null;
    const titulo_caso = anyEst.titulo_caso ?? anyEst.titulo ?? null;

    return { id_caso_estudio, numero_caso, titulo_caso };
  }, [selectedEst]);

  if (!showAsignModal || !activeTribunalForAsign) return null;

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
      // si quieres toast, pásalo por props (por ahora silencioso)
    } finally {
      setDownloadingKey(null);
    }
  }

  /**
   * ✅ ENTREGA: por tu regla real, es 1 vigente por estudiante.
   * Entonces descargamos por estudiante.
   * Si la fila viene con id_entrega (id_estudiante_caso_entrega / id_entrega),
   * la usamos para descargar por ID (compatibilidad).
   */
  async function onDownloadEntrega(row: TribunalEstudiante) {
    const idEst = Number((row as any).id_estudiante) || 0;
    if (!idEst) return;

    const idEntrega =
      Number((row as any).id_estudiante_caso_entrega) ||
      Number((row as any).id_entrega) ||
      0;

    const key = `entrega_${(row as any).id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);

      const res = await entregasCasoService.downloadPreferente({
        id_entrega: idEntrega > 0 ? idEntrega : undefined,
        id_estudiante: idEst,
      });

      const blob = res?.data as Blob;

      const estName =
        (row as any).apellidos_estudiante && (row as any).nombres_estudiante
          ? `${(row as any).apellidos_estudiante}_${(row as any).nombres_estudiante}`
          : `Est_${idEst}`;

      downloadBlob(blob, `Entrega_${safeFileName(estName)}.pdf`);
    } catch {
      // si quieres toast, pásalo por props (por ahora silencioso)
    } finally {
      setDownloadingKey(null);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={() => setShowAsignModal(false)}>
      <div className="modalCard asignModalCard" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modalHeader asignHeaderRow">
          <div className="asignTitleRow">
            <h3 className="asignTitle">Asignaciones — {activeTribunalForAsign.nombre_tribunal}</h3>
            <p className="asignSubtitle">
              Asignas estudiante + franja. El caso base y la entrega se descargan desde la asignación.
            </p>
          </div>

          <button className="btnClose" onClick={() => setShowAsignModal(false)} type="button" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="asignModalBody">
          {/* FORM */}
          <div className="asignGrid">
            <div className="field">
              <label className="fieldLabel">Estudiante</label>
              <select
                className="select"
                value={asignForm.id_estudiante}
                onChange={(e) =>
                  setAsignForm((p) => ({
                    ...p,
                    id_estudiante: e.target.value ? Number(e.target.value) : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {estudiantes.map((e: any) => (
                  <option key={e.id_estudiante} value={e.id_estudiante}>
                    {`${e.id_institucional_estudiante} — ${e.apellidos_estudiante} ${e.nombres_estudiante}`}
                  </option>
                ))}
              </select>
              {errors.id_estudiante ? <p className="error">{errors.id_estudiante}</p> : null}

              {/* panel caso seleccionado */}
              <div className="asignMiniCard">
                <div className="asignMiniTitle">Caso del estudiante (referencia)</div>
                {!asignForm.id_estudiante ? (
                  <div className="asignMiniMuted">Seleccione un estudiante para ver referencia.</div>
                ) : selectedCaseInfo && (selectedCaseInfo.numero_caso || selectedCaseInfo.titulo_caso) ? (
                  <div className="asignMiniText">
                    Caso <b>{selectedCaseInfo.numero_caso ?? "—"}</b>
                    {selectedCaseInfo.titulo_caso ? ` — ${selectedCaseInfo.titulo_caso}` : ""}
                  </div>
                ) : (
                  <div className="asignMiniMuted">No disponible aquí (se verá en la tabla al crear asignación).</div>
                )}
              </div>
            </div>

            <div className="field">
              <label className="fieldLabel">Franja horaria</label>
              <select
                className="select"
                value={asignForm.id_franja_horario}
                onChange={(e) =>
                  setAsignForm((p) => ({
                    ...p,
                    id_franja_horario: e.target.value ? Number(e.target.value) : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {franjas.map((f: any) => (
                  <option key={f.id_franja_horario} value={f.id_franja_horario}>
                    {`${f.fecha} ${f.hora_inicio}-${f.hora_fin} (${f.laboratorio})`}
                  </option>
                ))}
              </select>
              {errors.id_franja_horario ? <p className="error">{errors.id_franja_horario}</p> : null}
            </div>

            <div className="field">
              <label className="fieldLabel">&nbsp;</label>
              <button className="btnPrimary" onClick={onCreateAsignacion} disabled={loading} type="button">
                {loading ? "Asignando..." : "Crear"}
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="asignTableWrap">
            <table className="asignTable">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Franja</th>
                  <th>Caso</th>
                  <th>Estado</th>
                  <th style={{ width: 210 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {asignaciones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="asignEmpty">
                      No hay asignaciones.
                    </td>
                  </tr>
                ) : (
                  asignaciones.map((row: any) => {
                    const activo = isActivo(row.estado);

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

                    const keyCaso = `caso_${row.id_tribunal_estudiante}`;
                    const keyEntrega = `entrega_${row.id_tribunal_estudiante}`;

                    return (
                      <tr key={row.id_tribunal_estudiante}>
                        <td>
                          <div style={{ fontWeight: 800 }}>{estTxt}</div>
                          <div style={{ opacity: 0.75, fontSize: 12 }}>{row.id_institucional_estudiante ?? "—"}</div>
                        </td>

                        <td>{frTxt}</td>

                        <td>
                          <div style={{ fontWeight: 800 }}>{casoTxt}</div>
                          {!row.id_caso_estudio ? <div style={{ opacity: 0.7, fontSize: 12 }}>Sin caso asignado</div> : null}
                        </td>

                        <td>
                          <span className={`asignBadge ${activo ? "ok" : "off"}`}>{activo ? "Activa" : "Inactiva"}</span>
                        </td>

                        <td>
                          <div className="asignActions">
                            {/* Toggle */}
                            <button
                              className="asignBtnIcon"
                              onClick={() => onToggleAsignEstado(row)}
                              title="Activar / Desactivar"
                              disabled={loading}
                              type="button"
                            >
                              {activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>

                            {/* PDF Caso base */}
                            <button
                              className="asignBtnIcon"
                              onClick={() => onDownloadCasoBase(row)}
                              title="Descargar caso base (PDF)"
                              disabled={loading || !row.id_caso_estudio || downloadingKey === keyCaso}
                              type="button"
                            >
                              <FileText size={18} />
                            </button>

                            {/* PDF Entrega (por estudiante) */}
                            <button
                              className="asignBtnIcon"
                              onClick={() => onDownloadEntrega(row)}
                              title="Descargar entrega del estudiante (PDF)"
                              disabled={loading || downloadingKey === keyEntrega}
                              type="button"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="asignFootHint">
            Caso base: usa <b>id_caso_estudio</b>. Entrega: se descarga por <b>id_estudiante</b> (una entrega vigente).
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnPrimary" onClick={() => setShowAsignModal(false)} type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
