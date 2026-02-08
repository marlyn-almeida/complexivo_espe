// ✅ src/pages/casosEstudio/CasoEstudioFormModal.tsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText, Hash, AlignLeft, Upload } from "lucide-react";

import type { CasoEstudio } from "../../types/casoEstudio";
import { casosEstudioService } from "../../services/casosEstudio.service";

import "./CasoEstudioModal.css";

type ToastType = "success" | "error" | "info";

type Props = {
  mode: "create" | "edit";
  caso: CasoEstudio | null;
  selectedCarreraPeriodoId?: number;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onToast: (msg: string, type?: ToastType) => void;
};

export default function CasoEstudioFormModal({
  mode,
  caso,
  selectedCarreraPeriodoId,
  onClose,
  onSaved,
  onToast,
}: Props) {
  const [numeroCaso, setNumeroCaso] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && caso) {
      setNumeroCaso(caso.numero_caso);
      setTitulo(caso.titulo ?? "");
      setDescripcion(caso.descripcion ?? "");
      setArchivoFile(null);
    }

    if (mode === "create") {
      setNumeroCaso("");
      setTitulo("");
      setDescripcion("");
      setArchivoFile(null);
    }
  }, [mode, caso]);

  // ✅ bloquear scroll + ESC
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, saving]);

  async function onSubmit() {
    if (!selectedCarreraPeriodoId) {
      onToast("Carrera–Período no disponible.", "error");
      return;
    }

    if (numeroCaso === "" || Number(numeroCaso) <= 0) {
      onToast("Ingrese el número de caso (mayor a 0).", "error");
      return;
    }

    if (mode === "create" && !archivoFile) {
      onToast("Debe adjuntar el PDF del caso de estudio.", "error");
      return;
    }

    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("id_carrera_periodo", String(selectedCarreraPeriodoId));
      fd.append("numero_caso", String(numeroCaso));
      fd.append("titulo", titulo.trim());
      fd.append("descripcion", descripcion.trim());

      if (archivoFile) fd.append("archivo", archivoFile);

      if (mode === "create") {
        await casosEstudioService.create(fd);
        onToast("Caso de estudio creado.", "success");
      } else if (caso) {
        await casosEstudioService.update(caso.id_caso_estudio, fd);
        onToast("Caso de estudio actualizado.", "success");
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      onToast(err?.userMessage || err?.response?.data?.message || "Ocurrió un error", "error");
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div className="dmOverlay" role="dialog" aria-modal="true">
      {/* ✅ click fuera para cerrar */}
      <div
        onClick={() => {
          if (!saving) onClose();
        }}
        style={{ position: "fixed", inset: 0 }}
      />

      {/* ✅ card (stopPropagation para NO cerrar al tocar dentro) */}
      <div className="dmCard" style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <FileText />
            </div>
            <div>
              <div className="dmTitle">{mode === "create" ? "Nuevo caso de estudio" : "Editar caso de estudio"}</div>
              <div className="dmSub">Asociado a una Carrera–Período</div>
            </div>
          </div>

          <button className="dmClose" onClick={onClose} disabled={saving} title="Cerrar">
            <X />
          </button>
        </div>

        <div className="dmBody">
          <div className="dmFormGrid">
            <div className="dmInput">
              <label>
                Número de caso <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <Hash />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={numeroCaso}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") return setNumeroCaso("");
                    const n = Number(v);
                    if (Number.isFinite(n)) setNumeroCaso(n);
                  }}
                />
              </div>
            </div>

            <div className="dmInput">
              <label>Título</label>
              <div className="dmInputBox">
                <AlignLeft />
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>Descripción</label>
              <div className="dmInputBox dmTextareaBox">
                <AlignLeft />
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
            </div>

            <div className="dmInput dmCol2">
              <label>
                Archivo PDF {mode === "create" && <span className="req">*</span>}
              </label>

              <div className="dmFileRow">
                <label className="dmFileBtn">
                  <Upload />
                  Seleccionar archivo
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => setArchivoFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="dmFileHint" title={archivoFile?.name || ""}>
                  {archivoFile?.name ||
                    (mode === "edit" ? "Puede reemplazar el archivo existente" : "Ningún archivo seleccionado")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="dmFooter">
          <button className="dmBtnGhost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>

          <button className="dmBtnPrimary" onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
