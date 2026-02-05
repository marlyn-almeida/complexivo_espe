import type { CasoEstudio } from "../../types/casoEstudio";

type Props = {
  caso: CasoEstudio;
  selectedCPLabel?: string;
  onClose: () => void;
};

export default function CasoEstudioViewModal({
  caso,
  selectedCPLabel,
  onClose,
}: Props) {
  return (
    <div className="modalOverlay">
      <div className="modal modalLarge">
        <h2>Detalle del Caso de Estudio</h2>

        {selectedCPLabel && (
          <div className="hint">
            Carrera–Período: <b>{selectedCPLabel}</b>
          </div>
        )}

        <div className="viewGrid">
          <div>
            <span className="label">Número de caso</span>
            <div className="value">CASO {caso.numero_caso}</div>
          </div>

          <div>
            <span className="label">Título</span>
            <div className="value">{caso.titulo || "-"}</div>
          </div>

          <div className="full">
            <span className="label">Descripción</span>
            <div className="value">{caso.descripcion || "-"}</div>
          </div>

          <div className="full">
            <span className="label">Archivo PDF</span>
            <div className="value">
              <a
                href={caso.archivo_path}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                {caso.archivo_nombre}
              </a>
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
  );
}
