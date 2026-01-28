import { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "../../api/axiosClient"; // ✅ ajusta si tu ruta es otra
import styles from "./PlantillasActaWordPage.module.css";

// ✅ Escudo (RECOMENDADO con alias @)
// Si NO tienes alias "@", cambia a: ../../assets/escudo.png (dos niveles arriba)
// import escudoESPE from "../../assets/escudo.png";
import escudoESPE from "../../assets/escudo.png";


type EstadoPlantilla = "ACTIVA" | "INACTIVA";

type PlantillaActa = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  archivoNombre: string;
  estado: EstadoPlantilla;
  createdAt: string; // "2026-01-28" o ISO
};

function formatFechaEC(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/** ICONOS SVG (currentColor) */
function IconList(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M8 6h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 12h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 18h13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconUpload(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
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

function IconFile(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
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

function IconToggle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
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

function IconSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconBoxEmpty(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
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
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setNombre("");
      setDescripcion("");
      setFile(null);
      setSubmitting(false);
      setErrorMsg(null);
    }
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg("El nombre de la plantilla es obligatorio.");
      return;
    }
    if (!file) {
      setErrorMsg("Debe seleccionar un archivo Word (.docx).");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setErrorMsg("Formato no válido. Solo se admite .docx");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({ nombre: nombre.trim(), descripcion: descripcion.trim(), file });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.userMessage || err?.message || "No se pudo subir la plantilla. Intente nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onMouseDown={onClose} aria-hidden="true">
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-label="Subir plantilla de Word"
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
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
            <input
              className={styles.input}
              placeholder="Ej: Acta Tribunal 2025"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.label}>Descripción (Opcional)</label>
            <textarea
              className={styles.textarea}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
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

  const [loading, setLoading] = useState(true);
  const [errorTop, setErrorTop] = useState<string | null>(null);

  const [plantillas, setPlantillas] = useState<PlantillaActa[]>([]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return plantillas;
    return plantillas.filter((p) => p.nombre.toLowerCase().includes(s));
  }, [plantillas, q]);

  async function fetchPlantillas() {
    try {
      setErrorTop(null);
      setLoading(true);

      // ✅ tu backend debe devolver { ok:true, data:[...] }
      const { data } = await axiosClient.get("/plantillas-acta");

      const list: PlantillaActa[] = (data?.data ?? []).map((x: any) => ({
        id: x.id_plantilla ?? x.id ?? x.idPlantilla,
        nombre: x.nombre,
        descripcion: x.descripcion ?? null,
        archivoNombre: x.archivo_nombre ?? x.archivoNombre,
        estado: (x.estado_activa ?? x.estadoActiva) ? "ACTIVA" : "INACTIVA",
        createdAt: x.created_at ?? x.createdAt ?? new Date().toISOString(),
      }));

      // ✅ orden: activa primero, luego por fecha desc
      list.sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "ACTIVA" ? -1 : 1;
        return String(b.createdAt).localeCompare(String(a.createdAt));
      });

      setPlantillas(list);
    } catch (err: any) {
      setErrorTop(err?.userMessage || "No se pudieron cargar las plantillas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlantillas();
  }, []);

  async function handleUpload(payload: { nombre: string; descripcion: string; file: File }) {
    const form = new FormData();
    form.append("nombre", payload.nombre);
    form.append("descripcion", payload.descripcion);
    form.append("file", payload.file);

    // ✅ multipart (NO JSON)
    await axiosClient.post("/plantillas-acta", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    await fetchPlantillas();
  }

  async function handleDelete(p: PlantillaActa) {
    if (!confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) return;
    await axiosClient.delete(`/plantillas-acta/${p.id}`);
    await fetchPlantillas();
  }

  async function handleActivar(p: PlantillaActa) {
    await axiosClient.patch(`/plantillas-acta/${p.id}/activar`);
    await fetchPlantillas();
  }

  async function handleDesactivar(p: PlantillaActa) {
    await axiosClient.patch(`/plantillas-acta/${p.id}/desactivar`);
    await fetchPlantillas();
  }

  async function handleDownload(p: PlantillaActa) {
    // ✅ descarga binaria
    const res = await axiosClient.get(`/plantillas-acta/${p.id}/download`, {
      responseType: "blob",
    });

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = p.archivoNombre || "plantilla.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.wrap}>
      {/* ✅ para que NO quede “en medio” con espacio gigante:
          tu layout padre probablemente centra. Esto fuerza ancho completo. */}
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
              <input
                className={styles.search}
                placeholder="Buscar por nombre..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {errorTop && <div className={styles.formError}>{errorTop}</div>}

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thNum}>#</th>
                  <th className={styles.thName}>
                    <span className={styles.thInline}>
                      <IconFile className={styles.iconSm} /> Nombre
                    </span>
                  </th>
                  <th className={styles.thFile}>
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
                      <div className={styles.empty}>
                        <div className={styles.emptyText}>Cargando...</div>
                      </div>
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

                      <td className={styles.tdName}>
                        <div className={styles.nameMain}>{p.nombre}</div>
                        <div className={styles.nameSub}>Registrada: {formatFechaEC(p.createdAt)}</div>
                      </td>

                      <td className={styles.tdFile}>{p.archivoNombre}</td>

                      <td className={styles.tdState}>
                        <span className={p.estado === "ACTIVA" ? styles.badgeActive : styles.badgeInactive}>
                          {p.estado}
                        </span>
                      </td>

                      <td className={styles.tdActions}>
                        <button className={styles.btnSoft} onClick={() => handleDownload(p)}>
                          Descargar
                        </button>

                        {p.estado === "ACTIVA" ? (
                          <button className={styles.btnGhost} onClick={() => handleDesactivar(p)}>
                            Desactivar
                          </button>
                        ) : (
                          <button className={styles.btnPrimary} onClick={() => handleActivar(p)}>
                            Activar
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
