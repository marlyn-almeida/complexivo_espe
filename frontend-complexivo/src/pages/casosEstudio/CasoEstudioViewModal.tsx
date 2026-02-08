// ✅ src/pages/casosEstudio/CasoEstudioViewModal.tsx
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Hash, AlignLeft, Eye, Download } from "lucide-react";

import type { CasoEstudio } from "../../types/casoEstudio";
import { resolveFileUrl } from "../../services/casosEstudio.service";

import "./CasoEstudioModal.css";
import "./CasoEstudioViewModal.css";

type Props = {
  caso: CasoEstudio;
  selectedCPLabel?: string;
  onClose: () => void;
};

export default function CasoEstudioViewModal({ caso, selectedCPLabel, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fileUrl = resolveFileUrl(caso.archivo_path);

  function onOpenPdf() {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  }

  function onDownloadPdf() {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = caso.archivo_nombre || `caso_${caso.numero_caso}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return createPortal(
    <div className="dmOverlay" role="dialog" aria-modal="true">
      <div onClick={onClose} style={{ position: "fixed", inset: 0 }} />

      <div className="dmCard dmCardWide" style={{ position: "relative" }}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon dmAvatar">
              <FileText />
            </div>

            <div style={{ minWidth: 0 }}>
              <div className="dmTitle dmName">Detalle del Caso de Estudio</div>
              {selectedCPLabel ? (
                <div className="dmSub dmEllipsis" title={selectedCPLabel}>
                  Carrera–Período: <b>{selectedCPLabel}</b>
                </div>
              ) : (
                <div className="dmSub">—</div>
              )}
            </div>
          </div>

          <button className="dmClose" onClick={onClose} title="Cerrar">
            <X />
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
                <AlignLeft />
                <div className="dmWrap">{caso.titulo || "-"}</div>
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>Descripción</label>
              <div className="dmInputBox dmTextareaBox">
                <AlignLeft />
                <div className="dmWrap">{caso.descripcion || "-"}</div>
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>Archivo PDF</label>

              <div className="dmFileRow">
                <button className="dmFileBtn" onClick={onOpenPdf} disabled={!fileUrl}>
                  <Eye />
                  Ver PDF
                </button>

                <button className="dmFileBtn" onClick={onDownloadPdf} disabled={!fileUrl}>
                  <Download />
                  Descargar
                </button>

                <div className="dmFileHint" title={caso.archivo_nombre}>
                  {caso.archivo_nombre || (fileUrl ? "PDF" : "Sin archivo")}
                </div>
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
