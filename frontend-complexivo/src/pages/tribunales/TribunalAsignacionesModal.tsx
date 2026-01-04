import { ToggleLeft, ToggleRight } from "lucide-react";
import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";

type AsignacionFormState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
};

type Props = {
  showAsignModal: boolean;
  setShowAsignModal: (v: boolean) => void;

  activeTribunalForAsign: Tribunal | null;

  asignForm: AsignacionFormState;
  setAsignForm: React.Dispatch<React.SetStateAction<AsignacionFormState>>;

  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  asignaciones: TribunalEstudiante[];

  errors: Record<string, string>;
  loading: boolean;

  onCreateAsignacion: () => void;
  onToggleAsignEstado: (row: TribunalEstudiante) => void;

  // helper para mantener exactamente la misma lógica de estado
  isActivo: (v: any) => boolean;
};

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
  if (!showAsignModal || !activeTribunalForAsign) return null;

  return (
    <div className="modalOverlay" onMouseDown={() => setShowAsignModal(false)}>
      <div className="modalCard modalWide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h3 className="modalTitle">Asignaciones: {activeTribunalForAsign.nombre_tribunal}</h3>
          <button className="btnClose" onClick={() => setShowAsignModal(false)}>
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="grid2">
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
                {estudiantes.map((e) => (
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
                {franjas.map((f) => (
                  <option key={f.id_franja_horario} value={f.id_franja_horario}>
                    {`${f.fecha} ${f.hora_inicio}-${f.hora_fin} (${f.laboratorio})`}
                  </option>
                ))}
              </select>
              {errors.id_franja_horario ? <p className="error">{errors.id_franja_horario}</p> : null}
            </div>

            <div className="field full">
              <button className="btnPrimary" onClick={onCreateAsignacion} disabled={loading}>
                {loading ? "Asignando..." : "Crear asignación"}
              </button>
            </div>
          </div>

          <div className="separator" />

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Franja</th>
                  <th>Estado</th>
                  <th style={{ width: 140 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      No hay asignaciones.
                    </td>
                  </tr>
                ) : (
                  asignaciones.map((row) => {
                    const activo = isActivo(row.estado);
                    return (
                      <tr key={row.id_tribunal_estudiante}>
                        <td>
                          <div className="tdTitle">
                            {(row.apellidos_estudiante ?? "") + " " + (row.nombres_estudiante ?? "")}
                          </div>
                          <div className="tdSub">{row.id_institucional_estudiante ?? "—"}</div>
                        </td>
                        <td>
                          {row.fecha ? (
                            <div>
                              <div className="tdTitle">{row.fecha}</div>
                              <div className="tdSub">
                                {row.hora_inicio}-{row.hora_fin} · {row.laboratorio}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>
                            {activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <button
                              className="btnIcon"
                              onClick={() => onToggleAsignEstado(row)}
                              title="Activar/Desactivar"
                              disabled={loading}
                            >
                              {activo ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
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
        </div>

        <div className="modalFooter">
          <button className="btnPrimary" onClick={() => setShowAsignModal(false)}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
