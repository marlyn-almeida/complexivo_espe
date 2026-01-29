// src/components/carreras/CarreraViewModal.tsx
import type { Carrera } from "../../types/carrera";
import { Eye, X } from "lucide-react";

export default function CarreraViewModal(props: {
  open: boolean;
  carrera: Carrera | null;
  onClose: () => void;
  getDepartamentoNombre: (id: number) => string;
  modalidadLabel: (m?: string | null) => string;
}) {
  const { open, carrera, onClose, getDepartamentoNombre, modalidadLabel } = props;

  if (!open || !carrera) return null;

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <div className="modalHead">
          <div className="modalTitle">
            <span className="modalTitleIcon">
              <Eye className="iconSm" />
            </span>
            Detalle de carrera
          </div>

          <button className="modalClose" onClick={onClose} aria-label="Cerrar">
            <X className="iconSm" />
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          <div className="viewGrid">
            <div className="viewItem">
              <div className="viewKey">Carrera</div>
              <div className="viewVal">{carrera.nombre_carrera || "-"}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Código</div>
              <div className="viewVal">{carrera.codigo_carrera || "-"}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Departamento</div>
              <div className="viewVal">{getDepartamentoNombre(carrera.id_departamento)}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Modalidad</div>
              <div className="viewVal">{modalidadLabel(carrera.modalidad ?? null)}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Sede</div>
              <div className="viewVal">{carrera.sede || "-"}</div>
            </div>

            <div className="viewItem">
              <div className="viewKey">Estado</div>
              <div className="viewVal">{carrera.estado ? "Activo" : "Inactivo"}</div>
            </div>

            <div className="viewItem viewItemFull">
              <div className="viewKey">Descripción</div>
              <div className="viewVal">
                {carrera.descripcion_carrera?.trim() ? carrera.descripcion_carrera : "No se registró descripción."}
              </div>
            </div>
          </div>

          <div className="modalActions">
            <button className="btnGhost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
