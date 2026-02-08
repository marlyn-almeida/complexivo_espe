// ✅ src/pages/casosEstudio/CasoEstudioViewModal.tsx
import { createPortal } from "react-dom";
import type { CasoEstudio } from "../../types/casoEstudio";
import { casosEstudioService } from "../../services/casosEstudio.service";

import { Eye, FileText, Hash, AlignLeft } from "lucide-react";
import "./CasoEstudioModal.css";
import "./CasoEstudioViewModal.css";

type Props = {
  caso: CasoEstudio;
  selectedCPLabel?: string;
  onClose: () => void;
};

export default function CasoEstudioViewModal({ caso, selectedCPLabel, onClose }: Props) {
  async function openPdf() {
    const res = await casosEstudioService.download(Number(caso.id_caso_estudio));
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return createPortal(
    <div className="dmOverlay" role="dialog" aria-modal="true">
      {/* overlay click */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0 }} />

      {/* card */}
      <div className="dmCard dmCardWide" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon dmAvatar">
              <FileText />
            </div>
            <div>
              <div className="dmTitle dmName">Detalle del Caso de Estudio</div>
              <div className="dmSub">
                {selectedCPLabel ? (
                  <>
                    Carrera–Período: <b>{selectedCPLabel}</b>
                  </>
                ) : (
                  "Información del caso"
                )}
              </div>
            </div>
          </div>

          <button className="dmClose" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="dmBody">
          <div className="dmFormGrid dmGrid">
            <div className="dmInput">
              <label>Número de caso</label>
              <div className="dmInputBox">
                <Hash />
                <div className="dmWrap">
                  <b>CASO {caso.numero_caso}</b>
                </div>
              </div>
            </div>

            <div className="dmInput">
              <label>Título</label>
              <div className="dmInputBox">
                <FileText />
                <div className="dmWrap">{caso.titulo || "-"}</div>
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>Descripción</label>
              <div className="dmInputBox">
                <AlignLeft />
                <div className="dmWrap">{caso.descripcion || "-"}</div>
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>Archivo PDF</label>
              <div className="dmInputBox" style={{ justifyContent: "space-between", gap: 12 }}>
                <div className="dmWrap">
                  {caso.archivo_nombre || "archivo.pdf"}
                </div>

                <button className="dmBtnPrimary" onClick={openPdf} title="Ver PDF">
                  <Eye size={18} />
                  Ver PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="dmFooter">
          <button className="dmBtnGhost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
