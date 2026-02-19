// src/pages/tribunales/TribunalAsignacionesModal.tsx
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

import type { AsignacionFormState } from "./tribunales.types";

type Props = {
  showAsignModal: boolean;
  setShowAsignModal: (v: boolean) => void;
  activeTribunalForAsign: Tribunal | null;

  asignForm: AsignacionFormState;
  setAsignForm: Dispatch<SetStateAction<AsignacionFormState>>;

  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  casos: CasoEstudio[];

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

  const selectedCaso = useMemo(() => {
    if (!asignForm.id_caso_estudio) return null;
    return casos.find(
      (c) => Number(c.id_caso_estudio) === Number(asignForm.id_caso_estudio)
    ) ?? null;
  }, [asignForm.id_caso_estudio, casos]);

  if (!showAsignModal || !activeTribunalForAsign) return null;

  async function onDownloadCasoBase(row: TribunalEstudiante) {
    const idCaso = Number((row as any).id_caso_estudio) || 0;
    if (!idCaso) return;

    const key = `caso_${(row as any).id_tribunal_estudiante}`;
    try {
      setDownloadingKey(key);
      const res = await (casosEstudioService as any).download(idCaso);
      const blob = res?.data as Blob;

      const nombre =
        row.numero_caso
          ? `Caso_${row.numero_caso}`
          : `Caso_${idCaso}`;

      downloadBlob(blob, `${nombre}.pdf`);
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

      const res = await (entregasCasoService as any).downloadPreferente({
        id_estudiante: idEst,
      });

      const blob = res?.data as Blob;

      const nombre =
        row.apellidos_estudiante && row.nombres_estudiante
          ? `${row.apellidos_estudiante}_${row.nombres_estudiante}`
          : `Est_${idEst}`;

      downloadBlob(blob, `Entrega_${safeFileName(nombre)}.pdf`);
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
            <h3 className="asignTitle">
              Asignaciones — {activeTribunalForAsign.nombre_tribunal}
            </h3>
            <p className="asignSubtitle">
              Asigna estudiante + franja + caso. Luego puedes descargar caso base y entrega.
            </p>
          </div>

          <button
            className="btnClose"
            onClick={() => setShowAsignModal(false)}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="asignModalBody">

          {/* FORM */}
          <div className="asignGrid">

            {/* ESTUDIANTE */}
            <div className="field">
              <label className="fieldLabel">Estudiante</label>
              <select
                className="select"
                value={asignForm.id_estudiante}
                onChange={(e) =>
                  setAsignForm((prev) => ({
                    ...prev,
                    id_estudiante: e.target.value
                      ? Number(e.target.value)
                      : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {estudiantes.map((e) => (
                  <option key={e.id_estudiante} value={e.id_estudiante}>
                    {`${e.id_institucional_estudiante} — ${e.apellidos_estudiante} ${e.nombres_estudiante}`}
                  </option>
                ))}
              </select>
              {errors.id_estudiante && <p className="error">{errors.id_estudiante}</p>}
            </div>

            {/* FRANJA */}
            <div className="field">
              <label className="fieldLabel">Franja horaria</label>
              <select
                className="select"
                value={asignForm.id_franja_horario}
                onChange={(e) =>
                  setAsignForm((prev) => ({
                    ...prev,
                    id_franja_horario: e.target.value
                      ? Number(e.target.value)
                      : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {franjas.map((f) => (
                  <option key={f.id_franja_horario} value={f.id_franja_horario}>
                    {`${f.fecha} ${f.hora_inicio}-${f.hora_fin} (${f.laboratorio})`}
                  </option>
                ))}
              </select>
              {errors.id_franja_horario && <p className="error">{errors.id_franja_horario}</p>}
            </div>

            {/* CASO */}
            <div className="field">
              <label className="fieldLabel">Caso de estudio</label>
              <select
                className="select"
                value={asignForm.id_caso_estudio}
                onChange={(e) =>
                  setAsignForm((prev) => ({
                    ...prev,
                    id_caso_estudio: e.target.value
                      ? Number(e.target.value)
                      : "",
                  }))
                }
              >
                <option value="">Seleccione...</option>
                {casos.map((c) => (
                  <option key={c.id_caso_estudio} value={c.id_caso_estudio}>
                    {`Caso ${c.numero_caso} — ${c.titulo ?? "Sin título"}`}
                  </option>
                ))}
              </select>

              {errors.id_caso_estudio && <p className="error">{errors.id_caso_estudio}</p>}

              <div className="asignMiniCard">
                <div className="asignMiniTitle">Caso seleccionado</div>
                {!selectedCaso ? (
                  <div className="asignMiniMuted">Seleccione un caso.</div>
                ) : (
                  <div className="asignMiniText">
                    Caso <b>{selectedCaso.numero_caso}</b>
                    {selectedCaso.titulo ? ` — ${selectedCaso.titulo}` : ""}
                  </div>
                )}
              </div>
            </div>

            {/* BOTÓN */}
            <div className="field fieldBtn">
              <label className="fieldLabel">&nbsp;</label>
              <button
                className="btnPrimary"
                onClick={onCreateAsignacion}
                disabled={loading}
                type="button"
              >
                {loading ? "Asignando..." : "Crear"}
              </button>
            </div>

          </div>

          {/* TABLA */}
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

                    return (
                      <tr key={row.id_tribunal_estudiante}>
                        <td>
                          <div style={{ fontWeight: 800 }}>
                            {row.apellidos_estudiante} {row.nombres_estudiante}
                          </div>
                        </td>

                        <td>
                          {row.fecha} {row.hora_inicio}–{row.hora_fin}
                        </td>

                        <td>
                          {row.numero_caso
                            ? `Caso ${row.numero_caso}`
                            : "—"}
                        </td>

                        <td>
                          <span className={`asignBadge ${activo ? "ok" : "off"}`}>
                            {activo ? "Activa" : "Inactiva"}
                          </span>
                        </td>

                        <td>
                          <div className="asignActions">

                            <button
                              className="asignBtnIcon"
                              onClick={() => onToggleAsignEstado(row)}
                              disabled={loading}
                              type="button"
                            >
                              {activo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>

                            <button
                              className="asignBtnIcon"
                              onClick={() => onDownloadCasoBase(row)}
                              disabled={loading}
                              type="button"
                            >
                              <FileText size={18} />
                            </button>

                            <button
                              className="asignBtnIcon"
                              onClick={() => onDownloadEntrega(row)}
                              disabled={loading}
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
            Caso base: usa <b>id_caso_estudio</b>. Entrega: se descarga por <b>id_estudiante</b>.
          </div>
        </div>

        <div className="modalFooter">
          <button
            className="btnPrimary"
            onClick={() => setShowAsignModal(false)}
            type="button"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
