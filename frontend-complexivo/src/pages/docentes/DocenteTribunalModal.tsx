import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";
import { RefreshCcw } from "lucide-react";
import "./DocenteTribunalModal.css";


export type DocenteTribunalModalProps = {
  tribunal: Tribunal;
  asignaciones: TribunalEstudiante[];
  loadingAsignaciones: boolean;
  onClose: () => void;
  onRefreshAsignaciones: () => void | Promise<void>;
  onCalificar: (a: TribunalEstudiante) => void;
};

export default function DocenteTribunalModal({
  tribunal,
  asignaciones,
  loadingAsignaciones,
  onClose,
  onRefreshAsignaciones,
  onCalificar,
}: DocenteTribunalModalProps) {
  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modal modalWide" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Detalle del tribunal</div>
            <div className="muted" style={{ marginTop: 6, fontWeight: 800 }}>
              <b>{tribunal.nombre_tribunal || "-"}</b> · {tribunal.nombre_carrera || "-"} ·{" "}
              {tribunal.codigo_periodo || "-"} {tribunal.caso ? `· Caso ${tribunal.caso}` : ""}
            </div>
          </div>

          <button className="modalClose" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="asignHeaderRow">
            <div className="asignTitleRow">
              <h3 className="asignTitle">Asignaciones (Estudiante + Franja)</h3>
              <p className="asignSubtitle">
                Aquí podrás ver el estudiante asignado con su franja horaria para calificar.
              </p>
            </div>

            <button className="btnSecondary" onClick={onRefreshAsignaciones} title="Actualizar">
              <RefreshCcw size={18} /> Actualizar
            </button>
          </div>

          <div className="asignTableWrap">
            <table className="asignTable">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Lab</th>
                  <th className="thActions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loadingAsignaciones ? (
                  <tr>
                    <td colSpan={6} className="asignEmpty">
                      Cargando asignaciones...
                    </td>
                  </tr>
                ) : asignaciones.length ? (
                  asignaciones.map((a) => (
                    <tr key={a.id_tribunal_estudiante}>
                      <td className="tdStrong">
                        {(a.apellidos_estudiante || "") + " " + (a.nombres_estudiante || "")}
                      </td>
                      <td className="tdCode">{a.id_institucional_estudiante || "-"}</td>
                      <td>{a.fecha || "-"}</td>
                      <td>
                        {a.hora_inicio || "-"} — {a.hora_fin || "-"}
                      </td>
                      <td>{a.laboratorio || "-"}</td>
                      <td className="asignActions">
                        <button className="btnPrimarySmall" onClick={() => onCalificar(a)}>
                          Calificar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="asignEmpty">
                      No hay asignaciones para este tribunal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="asignHint">
            <b>Nota:</b> cuando implementemos rúbrica/calificación, aquí mostraremos estado y habilitaremos Acta cuando
            estén las 3 calificaciones.
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
