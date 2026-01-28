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
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHead">
          <div className="modalTitle">Detalle de carrera</div>
          <button className="modalClose" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          <div className="viewGrid">
            <div className="viewItem">
              <div className="viewKey">Carrera</div>
              <div className="viewVal">{carrera.nombre_carrera}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Código</div>
              <div className="viewVal mono">{carrera.codigo_carrera}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Departamento</div>
              <div className="viewVal">{getDepartamentoNombre(carrera.id_departamento)}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Estado</div>
              <div className="viewVal">
                <span className={`pill ${carrera.estado ? "pillOk" : "pillBad"}`}>
                  {carrera.estado ? "ACTIVA" : "INACTIVA"}
                </span>
              </div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Modalidad</div>
              <div className="viewVal">{carrera.modalidad || "-"}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Sede</div>
              <div className="viewVal">{carrera.sede || "-"}</div>
            </div>

            <div className="viewItem viewItemFull">
              <div className="viewKey">Descripción</div>
              <div className="viewVal">
                {carrera.descripcion_carrera?.trim() ? carrera.descripcion_carrera : "No se registró descripción."}
              </div>
            </div>
          </div>

          <div className="modalActions">
            <button className="btnPrimary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
