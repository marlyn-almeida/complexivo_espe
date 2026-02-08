import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { estudiantesService } from "../../services/estudiantes.service";
import { notaTeoricoService } from "../../services/notaTeorico.service";
import { entregasCasoService } from "../../services/entregasCaso.service";
import { casosEstudioService } from "../../services/casosEstudio.service"; // ✅ NUEVO: para descargar el PDF base del caso

import {
  ArrowLeft,
  FileUp,
  Save,
  UserRound,
  FileText,
  BadgeCheck,
  AlertTriangle,
  Download,
  FileDown,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./EstudianteAsignacionesPage.css";

type ToastType = "success" | "error" | "info";

function toNumberSafe(v: any) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}
function clamp20(n: number) {
  if (Number.isNaN(n)) return NaN;
  return Math.max(0, Math.min(20, n));
}

function safeDateLabel(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

export default function EstudianteAsignacionesPage() {
  const navigate = useNavigate();
  const { idEstudiante } = useParams();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const id = useMemo(() => Number(idEstudiante), [idEstudiante]);

  const [loading, setLoading] = useState(false);

  // Cabecera
  const [estudiante, setEstudiante] = useState<any>(null);

  // Nota teórica
  const [notaValue, setNotaValue] = useState("");
  const [notaObs, setNotaObs] = useState("");
  const [notaLoaded, setNotaLoaded] = useState<number | null>(null);

  // Caso asignado
  const [caso, setCaso] = useState<any>(null);
  const idCasoEstudio = useMemo(
    () => (caso?.id_caso_estudio ? Number(caso.id_caso_estudio) : null),
    [caso]
  );

  // Entrega existente (tabla estudiante_caso_entrega)
  const [entrega, setEntrega] = useState<any>(null);

  // Upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendMsg(err: any) {
    // ✅ si viene desde axiosClient (tu interceptor)
    if (typeof err?.userMessage === "string" && err.userMessage.trim()) return err.userMessage;

    // normal
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length && list[0]?.msg) return String(list[0].msg);
    if (typeof msg === "string" && msg.trim()) return msg;

    return err?.message || "Ocurrió un error.";
  }

  const estudianteLabel = useMemo(() => {
    if (!estudiante) return "";
    const nom = `${estudiante.apellidos_estudiante || ""} ${estudiante.nombres_estudiante || ""}`.trim();
    const inst = String(estudiante.id_institucional_estudiante || "").trim();
    const user = String(estudiante.nombre_usuario || "").trim();
    const extra = [inst, user].filter(Boolean).join(" • ");
    return `${nom}${extra ? ` — ${extra}` : ""}`.trim();
  }, [estudiante]);

  useEffect(() => {
    if (!id || Number.isNaN(id)) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadAll() {
    try {
      setLoading(true);

      // ✅ soporta ambas respuestas:
      // a) { ok:true, data:{...} }
      // b) {...} directo
      const res: any = await estudiantesService.getAsignaciones(id);
      const payload = res?.data ?? res;

      setEstudiante(payload?.estudiante ?? null);
      setCaso(payload?.caso ?? null);
      setEntrega(payload?.entrega ?? null);

      if (payload?.nota_teorico?.nota_teorico_20 != null) {
        const v = Number(payload.nota_teorico.nota_teorico_20);
        setNotaLoaded(v);
        setNotaValue(String(v).replace(".", ","));
        setNotaObs(String(payload.nota_teorico.observacion ?? ""));
      } else {
        setNotaLoaded(null);
        setNotaValue("");
        setNotaObs("");
      }
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveNota() {
    const n = clamp20(toNumberSafe(notaValue));
    if (Number.isNaN(n)) {
      showToast("Ingresa una nota válida (0–20).", "info");
      return;
    }

    try {
      setLoading(true);

      await notaTeoricoService.upsert({
        id_estudiante: id,
        nota_teorico_20: n,
        observacion: notaObs?.trim() || null,
      } as any);

      showToast("Nota teórica guardada.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function pickFile() {
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    e.target.value = "";
    if (!f) return;

    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      showToast("Solo se permite PDF.", "info");
      return;
    }
    setSelectedFile(f);
  }

  async function onUploadEntrega() {
    if (!selectedFile) {
      showToast("Selecciona un PDF primero.", "info");
      return;
    }
    if (!idCasoEstudio) {
      showToast("Aún no hay un caso asignado para este estudiante.", "info");
      return;
    }

    try {
      setLoading(true);

      await entregasCasoService.subir({
        id_estudiante: id,
        id_caso_estudio: idCasoEstudio,
        archivo: selectedFile,
        observacion: `Entrega del estudiante ${id}`,
      } as any);

      setSelectedFile(null);
      showToast("Entrega subida correctamente.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // ✅ PDF HELPERS (blob -> abrir / descargar)
  // =========================================================
  function openBlobInNewTab(blob: Blob) {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "archivo.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  // ✅ Caso base (usa endpoint protegido /api/casos-estudio/:id/download)
  async function openCasoPdfInline() {
    if (!idCasoEstudio) {
      showToast("Aún no hay un caso asignado para este estudiante.", "info");
      return;
    }
    try {
      setLoading(true);
      const res = await casosEstudioService.download(idCasoEstudio);
      const blob = new Blob([res.data], { type: "application/pdf" });
      openBlobInNewTab(blob);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function downloadCasoPdf() {
    if (!idCasoEstudio) {
      showToast("Aún no hay un caso asignado para este estudiante.", "info");
      return;
    }
    try {
      setLoading(true);
      const res = await casosEstudioService.download(idCasoEstudio);
      const blob = new Blob([res.data], { type: "application/pdf" });

      const name =
        (caso?.archivo_nombre as string) ||
        (caso?.numero_caso ? `caso_${caso.numero_caso}.pdf` : `caso_${idCasoEstudio}.pdf`);

      downloadBlob(blob, name);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Entrega (usa endpoint real: /api/entregas-caso/:id_estudiante/:id_caso_estudio/download)
  async function openEntregaPdfInline() {
    if (!idCasoEstudio) {
      showToast("Aún no hay un caso asignado para este estudiante.", "info");
      return;
    }
    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudianteCaso(id, idCasoEstudio);
      const blob = new Blob([res.data], { type: "application/pdf" });
      openBlobInNewTab(blob);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  async function downloadEntregaPdf() {
    if (!idCasoEstudio) {
      showToast("Aún no hay un caso asignado para este estudiante.", "info");
      return;
    }
    try {
      setLoading(true);
      const res = await entregasCasoService.downloadByEstudianteCaso(id, idCasoEstudio);
      const blob = new Blob([res.data], { type: "application/pdf" });

      const name =
        (entrega?.archivo_nombre as string) ||
        `entrega_${id}_${idCasoEstudio}.pdf`;

      downloadBlob(blob, name);
    } catch (err: any) {
      showToast(extractBackendMsg(err), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="asgPage">
      <div className="wrap">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Asignaciones</h1>
              <p className="heroSubtitle">Gestión de nota teórica y entrega del caso del estudiante.</p>

              <div className="heroChips">
                <span className="chip">
                  <UserRound size={16} />
                  {estudianteLabel || "Cargando estudiante..."}
                </span>
                <span className="chip chipSoft">
                  <BadgeCheck size={16} />
                  Rango permitido: 0–20
                </span>
              </div>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={() => navigate(-1)} disabled={loading}>
              <ArrowLeft className="heroBtnIcon" />
              Volver
            </button>
          </div>
        </div>

        {/* ✅ 2 COLUMNAS */}
        <div className="asgGrid">
          {/* NOTA TEÓRICA */}
          <div className="card">
            <div className="cardHead">
              <div className="cardTitle">
                <FileText size={18} /> Nota teórica
              </div>
              <div className="cardMeta">
                {notaLoaded != null ? `Registrada: ${String(notaLoaded).replace(".", ",")}` : "Sin registro"}
              </div>
            </div>

            <div className="cardBody">
              <label className="fieldLabel">Nota (0–20)</label>
              <div className="row">
                <input
                  className="input"
                  placeholder="Ej: 18,50"
                  value={notaValue}
                  onChange={(e) => setNotaValue(e.target.value)}
                  disabled={loading}
                />
                <button className="btnPrimary" onClick={onSaveNota} disabled={loading}>
                  <Save size={16} />
                  Guardar
                </button>
              </div>

              <label className="fieldLabel" style={{ marginTop: 10 }}>
                Observación (opcional)
              </label>
              <textarea
                className="textarea"
                placeholder="Ej: Revisión de contenido teórico."
                value={notaObs}
                onChange={(e) => setNotaObs(e.target.value)}
                disabled={loading}
              />

              <div className="hint">
                <AlertTriangle size={16} />
                <span>La nota teórica se registra desde esta pantalla.</span>
              </div>
            </div>
          </div>

          {/* ENTREGA DEL CASO */}
          <div className="card">
            <div className="cardHead">
              <div className="cardTitle">
                <FileUp size={18} /> Entrega del caso (PDF)
              </div>
              <div className="cardMeta">Solo PDF</div>
            </div>

            <div className="cardBody">
              {/* CASO ASIGNADO */}
              <div className="subBlock">
                <div className="subTitle">Caso asignado</div>

                {caso?.id_caso_estudio ? (
                  <div className="fileRow">
                    <div className="fileInfo">
                      <div className="fileName">
                        {caso.numero_caso ? `${caso.numero_caso} — ` : ""}
                        {caso.titulo || `Caso ID ${caso.id_caso_estudio}`}
                      </div>
                      <div className="fileMeta">{caso.descripcion ? caso.descripcion : "Caso disponible."}</div>
                      <div className="fileMeta">{caso.archivo_nombre ? `Archivo: ${caso.archivo_nombre}` : ""}</div>
                    </div>

                    {/* ✅ Antes abrías archivo_path directo. Ahora usamos endpoint protegido + blob */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button className="btnGhost" onClick={openCasoPdfInline} disabled={loading}>
                        <Download size={16} />
                        Ver PDF
                      </button>
                      <button className="btnGhost" onClick={downloadCasoPdf} disabled={loading}>
                        <FileDown size={16} />
                        Descargar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="muted">Aún no hay caso asignado para este estudiante.</div>
                )}
              </div>

              {/* ENTREGA EXISTENTE */}
              <div className="subBlock" style={{ marginTop: 12 }}>
                <div className="subTitle">Entrega registrada</div>

                {entrega?.archivo_nombre || entrega?.archivo_path ? (
                  <div className="fileRow">
                    <div className="fileInfo">
                      <div className="fileName">{entrega.archivo_nombre || "Entrega PDF registrada"}</div>
                      <div className="fileMeta">
                        {entrega.fecha_entrega
                          ? `Entregada: ${safeDateLabel(entrega.fecha_entrega)}`
                          : entrega.created_at
                          ? `Subida: ${safeDateLabel(entrega.created_at)}`
                          : "Fecha no disponible"}
                      </div>
                    </div>

                    {/* ✅ Antes abrías archivo_path directo. Ahora usamos endpoint protegido + blob */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button className="btnGhost" onClick={openEntregaPdfInline} disabled={loading || !idCasoEstudio}>
                        <FileDown size={16} />
                        Ver PDF
                      </button>
                      <button className="btnGhost" onClick={downloadEntregaPdf} disabled={loading || !idCasoEstudio}>
                        <Download size={16} />
                        Descargar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="muted">Sin entrega registrada.</div>
                )}
              </div>

              {/* SUBIR NUEVO PDF */}
              <div className="subBlock" style={{ marginTop: 12 }}>
                <div className="subTitle">Subir PDF resuelto</div>

                <div className="uploadRow">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    style={{ display: "none" }}
                    onChange={onFileChange}
                  />

                  <button className="btnGhost" onClick={pickFile} disabled={loading}>
                    Seleccionar PDF
                  </button>

                  <div className="filePicked">{selectedFile ? selectedFile.name : "Ningún archivo seleccionado"}</div>

                  <button
                    className="btnPrimary"
                    onClick={onUploadEntrega}
                    disabled={loading || !selectedFile || !idCasoEstudio}
                    title={!idCasoEstudio ? "Primero debe existir un caso asignado" : ""}
                  >
                    <FileUp size={16} />
                    Subir
                  </button>
                </div>

                <div className="hint">
                  <AlertTriangle size={16} />
                  <span>La entrega se guarda asociada al caso asignado del estudiante.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
