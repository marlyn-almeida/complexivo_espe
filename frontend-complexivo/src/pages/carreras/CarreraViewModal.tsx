import type { Carrera } from "../../types/carrera";

interface Props {
  open: boolean;
  carrera: Carrera | null;
  getDepartamentoNombre: (id: number) => string;
  onClose: () => void;
}

export default function CarreraViewModal({
  open,
  carrera,
  getDepartamentoNombre,
  onClose,
}: Props) {
  if (!open || !carrera) return null;

  return (
    <div className="modalOverlay">
      <div className="modal modalViewClean">
        <div className="modalHeader">
          <div className="modalTitle">Detalle de la carrera</div>
          <button className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalBody viewGrid">
          <div className="viewCard">
            <span className="viewLabel">Carrera</span>
            <span className="viewValue strong">
              {carrera.nombre_carrera}
            </span>
          </div>

          <div className="viewCard">
            <span className="viewLabel">Código</span>
            <span className="viewValue code">
              {carrera.codigo_carrera}
            </span>
          </div>

          <div className="viewCard">
            <span className="viewLabel">Departamento</span>
            <span className="viewValue">
              {getDepartamentoNombre(carrera.id_departamento)}
            </span>
          </div>

          <div className="viewCard">
            <span className="viewLabel">Modalidad</span>
            <span className="viewValue">
              {carrera.modalidad || "-"}
            </span>
          </div>

          <div className="viewCard">
            <span className="viewLabel">Sede</span>
            <span className="viewValue">
              {carrera.sede || "-"}
            </span>
          </div>

          <div className="viewCard">
            <span className="viewLabel">Estado</span>
            <span
              className={`badge ${
                carrera.estado ? "badge-success" : "badge-danger"
              }`}
            >
              {carrera.estado ? "ACTIVA" : "INACTIVA"}
            </span>
          </div>

          <div className="viewCard full">
            <span className="viewLabel">Descripción</span>
            <p className="viewDescription">
              {carrera.descripcion_carrera || "No se registró descripción."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
