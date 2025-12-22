import type { Carrera } from "../../types/carrera";

export default function CarreraViewModal(props: {
  open: boolean;
  carrera: Carrera | null;
  onClose: () => void;
  getDepartamentoNombre: (id: number) => string;
}) {
  const { open, carrera, onClose, getDepartamentoNombre } = props;

  if (!open || !carrera) return null;

  return (
    <div className="modalOverlay">
      <div className="modal modalPro">
        <div className="modalHeader">
          <div className="modalTitle">Detalle de carrera</div>
          <button className="modalClose" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modalBody">
          <div className="viewGrid">
            <div className="viewCard">
              <div className="viewLabel">Nombre</div>
              <div className="viewValue">{carrera.nombre_carrera}</div>
            </div>

            <div className="viewCard">
              <div className="viewLabel">Código</div>
              <div className="viewValue tdCode">{carrera.codigo_carrera}</div>
            </div>

            <div className="viewCard">
              <div className="viewLabel">Departamento</div>
              <div className="viewValue">
                {getDepartamentoNombre(carrera.id_departamento)}
              </div>
            </div>

            <div className="viewCard">
              <div className="viewLabel">Estado</div>
              <div className="viewValue">
                <span
                  className={`badge ${
                    carrera.estado ? "badge-success" : "badge-danger"
                  }`}
                >
                  {carrera.estado ? "ACTIVA" : "INACTIVA"}
                </span>
              </div>
            </div>

            <div className="viewCard">
              <div className="viewLabel">Modalidad</div>
              <div className="viewValue">{carrera.modalidad || "-"}</div>
            </div>

            <div className="viewCard">
              <div className="viewLabel">Sede</div>
              <div className="viewValue">{carrera.sede || "-"}</div>
            </div>

            <div className="viewCard viewCardFull">
              <div className="viewLabel">Descripción</div>
              <div className="viewValue">
                <div className="viewDescription">
                  {carrera.descripcion_carrera || "No se registró descripción."}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnPrimary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
