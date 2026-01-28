import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient"; // ajusta si tu ruta es diferente
import escudoESPE from "../../assets/escudo.png";
import styles from "./PlantillasActaWordPage.module.css";

type EstadoPlantilla = "ACTIVA" | "INACTIVA";

type PlantillaActa = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  archivoNombre: string;
  estadoActiva: EstadoPlantilla;
  createdAt: string;
};

function formatFechaEC(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/** ICONOS SVG */
function IconList(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M8 6h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconUpload(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M20 16.5a4.5 4.5 0 0 0-4.35-4.49A5.5 5.5 0 0 0 5 13.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 21v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8.5 16.5 12 13l3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFile(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 13h8M8 17h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconToggle(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M7 17h10a4 4 0 0 0 0-8H7a4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
    </svg>
  );
}

function IconSearch(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBoxEmpty(p: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path
        d="M4 8.5 12 4l8 4.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M4 8.5h16" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { nombre: string; descripcion: string; file: File }) => Promise<void>;
};

function UploadModal({ open, onClose, onSubmit }: ModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setNombre("");
      setDescripcion("");
      setFile(null);
      setSubmitting(false);
      setErrorMsg(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) return setErrorMsg("El nombre de la plantilla es obligatorio.");
    if (!file) return setErrorMsg("Debe seleccionar un archivo Word (.docx).");
    if (!file.name.toLowerCase().endsWith(".docx")) return setErrorMsg("Formato no válido. Solo se admite .docx.");

    try {
      setSubmitting(true);
      await onSubmit({ nombre: nombre.trim(), descripcion: descripcion.trim(), file });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.userMessage || err?.message || "No se pudo subir la plantilla.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose} aria-hidden="true">
      <div className={styles.modalCard} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalTitle}>
            <span className={styles.modalTitleIcon}>
              <IconUpload className={styles.iconSm} />
            </span>
            Subir plantilla de Word
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        <div className={styles.modalDivider} />

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {errorMsg && <div className={styles.formError}>{errorMsg}</div>}

          <div className={styles.formRow}>
            <label className={styles.label}>
              Nombre de la Plantilla <span className={styles.req}>*</span>
            </label>
            <input className={styles.input} placeholder="Ej: Acta Tribunal 2025" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Descripción (Opcional)</label>
            <textarea className={styles.textarea} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>
              Archivo Word <span className={styles.req}>*</span>
            </label>

            <div className={styles.fileRow}>
              <label className={styles.fileBtn}>
                Seleccionar archivo
                <input
                  type="file"
                  accept=".docx"
                  className={styles.fileInput}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <div className={styles.fileName}>{file ? file.name : "Ningún archivo seleccionado"}</div>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={submitting}>
              {submitting ? "Subiendo..." : "Subir plantilla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PlantillasActaWordPage() {
  const [openModal, setOpenModal] = useState(false);
  const [q, setQ] = useState("");
  const [plantillas, setPlantillas] = useState<PlantillaActa[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchPlantillas() {
    setLoading(true);
    try {
      const res = await axiosClient.get("/plantillas-acta");
      setPlantillas(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlantillas();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return plantillas;
    return plantillas.filter((p) => p.nombre.toLowerCase().includes(s));
  }, [plantillas, q]);

  async function handleUpload(payload: { nombre: string; descripcion: string; file: File }) {
    const form = new FormData();
    form.append("nombre", payload.nombre);
    form.append("descripcion", payload.descripcion);
    form.append("file", payload.file);

    await axiosClient.post("/plantillas-acta", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fetchPlantillas();
  }

  async function handleActivar(p: PlantillaActa) {
    await axiosClient.patch(`/plantillas-acta/${p.id}/activar`);
    await fetchPlantillas();
  }

  async function handleDelete(p: PlantillaActa) {
    await axiosClient.delete(`/plantillas-acta/${p.id}`);
    await fetchPlantillas();
  }

  async function handleDownload(p: PlantillaActa) {
    const res = await axiosClient.get(`/plantillas-acta/${p.id}/download`, { responseType: "blob" });
    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.archivoNombre || "plantilla.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.page}>
      <div className={styles.containerFull}>
        {/* HERO */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <img src={escudoESPE} alt="ESPE" className={styles.heroLogo} />
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>PLANTILLAS DE ACTA</h1>
              <p className={styles.heroSubtitle}>Gestión de plantillas Word con variables dinámicas</p>
            </div>
          </div>

          <button className={styles.heroBtn} onClick={() => setOpenModal(true)}>
            <IconUpload className={styles.iconSm} />
            Subir Plantilla Word
          </button>
        </div>

        {/* BOX */}
        <div className={styles.box}>
          <div className={styles.boxHead}>
            <div className={styles.sectionTitle}>
              <span className={styles.sectionTitleIcon}>
                <IconList className={styles.iconSm} />
              </span>
              Listado de Plantillas
            </div>

            <div className={styles.searchWrap}>
              <IconSearch className={styles.searchIcon} />
              <input className={styles.search} placeholder="Buscar por nombre..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thNum}>#</th>
                  <th>
                    <span className={styles.thInline}>
                      <IconFile className={styles.iconSm} /> Nombre
                    </span>
                  </th>
                  <th>
                    <span className={styles.thInline}>
                      <IconFile className={styles.iconSm} /> Archivo
                    </span>
                  </th>
                  <th className={styles.thState}>
                    <span className={styles.thInline}>
                      <IconToggle className={styles.iconSm} /> Estado
                    </span>
                  </th>
                  <th className={styles.thActions}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      Cargando...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      <div className={styles.empty}>
                        <IconBoxEmpty className={styles.emptyIcon} />
                        <div className={styles.emptyText}>No hay plantillas registradas. Suba su primera plantilla Word.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id}>
                      <td className={styles.tdNum}>{idx + 1}</td>
                      <td>
                        <div className={styles.nameMain}>{p.nombre}</div>
                        <div className={styles.nameSub}>Registrada: {formatFechaEC(p.createdAt)}</div>
                      </td>
                      <td>{p.archivoNombre}</td>
                      <td>
                        <span className={p.estadoActiva === "ACTIVA" ? styles.badgeActive : styles.badgeInactive}>{p.estadoActiva}</span>
                      </td>
                      <td className={styles.tdActions}>
                        <button className={styles.btnSoft} onClick={() => handleDownload(p)}>
                          Descargar
                        </button>

                        {p.estadoActiva === "INACTIVA" ? (
                          <button className={styles.btnPrimaryMini} onClick={() => handleActivar(p)}>
                            Activar
                          </button>
                        ) : (
                          <button className={styles.btnPrimaryMiniDisabled} disabled>
                            En uso
                          </button>
                        )}

                        <button className={styles.btnDanger} onClick={() => handleDelete(p)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <UploadModal open={openModal} onClose={() => setOpenModal(false)} onSubmit={handleUpload} />
      </div>
    </div>
  );
}
