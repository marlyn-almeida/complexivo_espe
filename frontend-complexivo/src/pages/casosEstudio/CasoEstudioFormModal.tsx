// src/pages/casosEstudio/CasoEstudioFormModal.tsx
import { useEffect, useState } from "react";
import { X, FileText, Hash, AlignLeft, Upload } from "lucide-react";

import type { CasoEstudio } from "../../types/casoEstudio";
import { casosEstudioService } from "../../services/casosEstudio.service";

import "./CasoEstudioModal.css";

type ToastType = "success" | "error" | "info";

type Props = {
  mode: "create" | "edit";
  caso: CasoEstudio | null;

  // ✅ mismo nombre que usas en Estudiantes
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
  // =========================
  // STATE
  // =========================
  const [numeroCaso, setNumeroCaso] = useState<number | "">("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivoFile, setArchivoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // =========================
  // INIT (edit)
  // =========================
  useEffect(() => {
    if (mode === "edit" && caso) {
      setNumeroCaso(caso.numero_caso);
      setTitulo(caso.titulo ?? "");
      setDescripcion(caso.descripcion ?? "");
      setArchivoFile(null); // ✅ no forzamos archivo en edit
    }
  }, [mode, caso]);

  // =========================
  // SUBMIT
  // =========================
  async function onSubmit() {
    if (!selectedCarreraPeriodoId) {
      onToast("Carrera–Período no disponible.", "error");
      return;
    }

    // ✅ importante: "" o 0 => inválido
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

      if (archivoFile) {
        // 👈 nombre debe coincidir con multer: "archivo"
        fd.append("archivo", archivoFile);
      }

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
      onToast(err?.userMessage || "Ocurrió un error", "error");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // RENDER
  // =========================
  return (
    <div className="ceOverlay">
      <div className="ceCard">
        {/* HEADER */}
        <div className="ceHeader">
          <div className="ceHeaderLeft">
            <div className="ceHeaderIcon">
              <FileText />
            </div>
            <div>
              <div className="ceTitle">
                {mode === "create" ? "Nuevo caso de estudio" : "Editar caso de estudio"}
              </div>
              <div className="ceSub">Asociado a una Carrera–Período</div>
            </div>
          </div>

          <button className="ceClose" onClick={onClose} disabled={saving}>
            <X />
          </button>
        </div>

        {/* BODY */}
        <div className="ceBody">
          <div className="ceFormGrid">
            {/* NÚMERO DE CASO */}
            <div className="ceInput">
              <label>
                Número de caso <span className="req">*</span>
              </label>
              <div className="ceInputBox">
                <Hash />
                <input
                  className="ceNoSpin"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  value={numeroCaso}
                  onChange={(e) => {
                    const v = e.target.value;
                    // ✅ permite borrar sin que se vuelva 0
                    if (v === "") return setNumeroCaso("");
                    const n = Number(v);
                    if (Number.isFinite(n)) setNumeroCaso(n);
                  }}
                />
              </div>
            </div>

            {/* TÍTULO */}
            <div className="ceInput">
              <label>Título</label>
              <div className="ceInputBox">
                <AlignLeft />
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
            </div>

            {/* DESCRIPCIÓN */}
            <div className="ceInput ceCol2">
              <label>Descripción</label>
              <div className="ceInputBox ceTextareaBox">
                <AlignLeft />
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
            </div>

            {/* ARCHIVO */}
            <div className="ceInput ceCol2">
              <label>
                Archivo PDF {mode === "create" && <span className="req">*</span>}
              </label>

              <div className="ceFileRow">
                <label className="ceFileBtn">
                  <Upload />
                  Seleccionar archivo
                  <input
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={(e) => setArchivoFile(e.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="ceFileHint">
                  {archivoFile?.name ||
                    (mode === "edit" ? "Puede reemplazar el archivo existente" : "Ningún archivo seleccionado")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="ceFooter">
          <button className="ceBtnGhost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>

          <button className="ceBtnPrimary" onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
