import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { ToggleLeft, ToggleRight, FileText, Download } from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CasoEstudio } from "../../types/casoEstudio";

import "./TribunalAsignacionesModal.css";

import { casosEstudioService } from "../../services/casosEstudio.service";
import { entregasCasoService } from "../../services/entregasCaso.service";

// ✅ IMPORTA EL MISMO TIPO QUE USA TribunalesPage.tsx
import type { AsignacionFormState } from "./tribunales.types";

type Props = {
  showAsignModal: boolean;
  setShowAsignModal: (v: boolean) => void;

  activeTribunalForAsign: Tribunal | null;

  asignForm: AsignacionFormState;
  setAsignForm: Dispatch<SetStateAction<AsignacionFormState>>;

  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  casos: CasoEstudio[]; // ✅ NUEVO

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
  casos,
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

  // ✅ caso seleccionado desde el select del modal
  const selectedCaso = useMemo(() => {
    if (!asignForm.id_caso_estudio) return null;
    return (casos ?? []).find((c: any) => Number(c.id_caso_estudio) === Number(asignForm.id_caso_estudio)) ?? null;
  }, [asignForm.id_caso_estudio, casos]);

  if (!showAsignModal || !activeTribunalForAsign) return null;

  async function onDownloadCasoBase(row: TribunalEstudiante) {
    const idCaso = Number((row as any).id_caso_estudio) || 0;
    if (!idCaso) return;

    const key = `caso_${(row as any).id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);

      // ⚠️ Aquí asumo que existe casosEstudioService.download(id)
      // Si no existe, dime tu función real y lo ajusto.
      const res = await (casosEstudioService as any).download(idCaso);
      const blob = res?.data as Blob;

      const n = (row as any).numero_caso ? `Caso_${(row as any).numero_caso}` : `Caso_${idCaso}`;
      downloadBlob(blob, `${n}.pdf`);
    } catch {
      // silencioso por ahora
    } finally {
      setDownloadingKey(null);
    }
  }

  /**
   * ✅ ENTREGA: 1 vigente por estudiante.
   * Descargamos por estudiante o por id_entrega si viene.
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

      const res = await (entregasCasoService as any).downloadPreferente({
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
      // silencioso por ahora
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
              Asignas estudiante + franja + caso. Luego puedes descargar caso base y entrega.
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

            {/* ✅ NUEVO: Caso a asignar */}
            <div className="field">
              <label className="fieldLabel">Caso de estudio</label>
              <select
                className="select"
                value={asignForm.id_caso_estudio}
                onChange={(e) =>
                  setAsignForm((p) => ({
                    ...p,
                    id_caso_estudio: e.target.value ? Number(e.target.value) : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {casos.map((c: any) => (
                  <option key={c.id_caso_estudio} value={c.id_caso_estudio}>
                    {`Caso ${c.numero_caso} — ${c.titulo ?? "Sin título"}`}
                  </option>
                ))}
              </select>
              {errors.id_caso_estudio ? <p className="error">{errors.id_caso_estudio}</p> : null}

              {/* mini preview */}
              <div className="asignMiniCard">
                <div className="asignMiniTitle">Caso seleccionado</div>
                {!asignForm.id_caso_estudio ? (
                  <div className="asignMiniMuted">Seleccione un caso.</div>
                ) : selectedCaso ? (
                  <div className="asignMiniText">
                    Caso <b>{selectedCaso.numero_caso}</b>
                    {selectedCaso.titulo ? ` — ${selectedCaso.titulo}` : ""}
                  </div>
                ) : (
                  <div className="asignMiniMuted">No encontrado.</div>
                )}
              </div>
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

                            {/* PDF Entrega */}
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
