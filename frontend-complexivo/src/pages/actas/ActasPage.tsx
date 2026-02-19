// src/pages/actas/ActasPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Download, UploadCloud, RefreshCcw, BadgeCheck } from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./ActasPage.css";

import { actasService } from "../../services/acta.service";

// ✅ si ya tienes un servicio que devuelve cerrado/mi_designacion/id_rubrica, úsalo.
// Aquí reaprovechamos el que ya usas en CalificarTribunalPage:
import { misCalificacionesDocenteService } from "../../services/misCalificacionesDocente.service";

type ToastType = "success" | "error" | "info";

function extractMsg(e: any) {
  const msg = e?.response?.data?.message || e?.userMessage;
  if (typeof msg === "string" && msg.trim()) return msg;
  return e?.message || "Ocurrió un error.";
}

export default function ActasPage() {
  const nav = useNavigate();
  const { idTribunalEstudiante } = useParams();
  const id_te = Number(idTribunalEstudiante || 0);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);

  const [cerrado, setCerrado] = useState(false);
  const [miDesignacion, setMiDesignacion] = useState<string | null>(null);

  const [idRubrica, setIdRubrica] = useState<number | null>(null);
  const [idActa, setIdActa] = useState<number | null>(null);

  const [archivos, setArchivos] = useState<{ docx?: string | null; pdf?: string | null } | null>(null);

  const puedoSubirFirmada = useMemo(() => {
    return cerrado && String(miDesignacion || "").toUpperCase() === "PRESIDENTE" && !!idActa;
  }, [cerrado, miDesignacion, idActa]);

  async function loadContext() {
    if (!id_te) {
      setToast({ type: "error", msg: "ID inválido de tribunal-estudiante." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // ✅ Usamos tu endpoint existente para obtener:
      // - cerrado
      // - mi_designacion
      // - estructura (para sacar id_rubrica)
      const resp = await misCalificacionesDocenteService.get(id_te);

      const c = Number(resp?.data?.cerrado ?? 0) === 1;
      setCerrado(c);

      const mi = (resp as any)?.data?.mi_designacion ?? null;
      setMiDesignacion(mi ? String(mi) : null);

      // ✅ sacar id_rubrica desde la estructura (primer item tribunal)
      const estructura = (resp as any)?.data?.estructura ?? [];
      const firstRubrica = Number(estructura?.[0]?.id_rubrica ?? 0) || null;
      setIdRubrica(firstRubrica);

      // opcional: si tu backend ya devuelve id_acta aquí, lo tomas
      const actaIdFromBackend = Number((resp as any)?.data?.id_acta ?? 0) || null;
      if (actaIdFromBackend) setIdActa(actaIdFromBackend);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id_te]);

  async function onGenerarActa() {
    if (!cerrado) {
      setToast({ type: "info", msg: "El tribunal debe estar CERRADO para generar el acta." });
      return;
    }
    if (!idRubrica) {
      setToast({
        type: "info",
        msg: "No se pudo determinar la rúbrica. Asegura que el backend devuelva id_rubrica en la estructura.",
      });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const res = await actasService.generar({
        id_tribunal_estudiante: id_te,
        id_rubrica: idRubrica,
      });

      setIdActa(res?.acta?.id_acta ?? null);
      setArchivos({ docx: res?.archivos?.docx ?? null, pdf: res?.archivos?.pdf ?? null });

      setToast({ type: "success", msg: "Acta generada correctamente." });
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  async function onDownloadDocx() {
    if (!idActa) return;
    try {
      setLoading(true);
      await actasService.downloadDocx(idActa);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  async function onDownloadPdf() {
    if (!idActa) return;
    try {
      setLoading(true);
      await actasService.downloadPdf(idActa);
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  async function onUploadFirmada(file: File) {
    if (!idActa) return;

    setLoading(true);
    setToast(null);

    try {
      await actasService.subirFirmada(idActa, file);
      setToast({ type: "success", msg: "Acta firmada subida correctamente." });
    } catch (e: any) {
      setToast({ type: "error", msg: extractMsg(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="actasPage wrap containerFull">
      {/* HERO */}
      <div className="hero">
        <div className="heroLeft">
          <img className="heroLogo" src={escudoESPE} alt="ESPE" />
          <div className="heroText">
            <h1 className="heroTitle">ACTAS DEL TRIBUNAL</h1>
            <p className="heroSubtitle">
              Tribunal-Estudiante: <b>{id_te || "—"}</b>
            </p>
          </div>
        </div>

        <div className="heroActions">
          <button className="heroBtn ghost" onClick={loadContext} disabled={loading} title="Actualizar">
            <RefreshCcw className="heroBtnIcon" />
            Actualizar
          </button>

          <button className="heroBtn ghost" onClick={() => nav(-1)} disabled={loading} title="Volver">
            <ArrowLeft className="heroBtnIcon" />
            Volver
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="toastClose" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* Estado / Rol */}
      <div className="crumbRow">
        <div className="rolePill">
          <BadgeCheck size={16} />
          <span>
            Estado: <b>{cerrado ? "CERRADO" : "ABIERTO"}</b>
            {"  "}•{"  "}
            Tu designación: <b>{miDesignacion || "—"}</b>
          </span>
        </div>
      </div>

      {/* Caja principal */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <FileText />
            </span>
            <span>Generación y Descarga</span>
          </div>
        </div>

        <div className="actasGrid">
          <div className="actaCard">
            <div className="actaTitle">Generar Acta</div>
            <div className="actaSub">
              Disponible solo cuando el tribunal está <b>CERRADO</b>.
            </div>

            <button className="btnPrimary" onClick={onGenerarActa} disabled={loading || !cerrado}>
              <FileText size={16} /> {loading ? "Procesando..." : "Generar Acta"}
            </button>
          </div>

          <div className="actaCard">
            <div className="actaTitle">Descargas</div>
            <div className="actaSub">
              {idActa ? (
                <>
                  Acta ID: <b>{idActa}</b>
                </>
              ) : (
                "Aún no hay acta generada."
              )}
            </div>

            <div className="actaBtns">
              <button className="btnGhost" onClick={onDownloadDocx} disabled={loading || !idActa}>
                <Download size={16} /> DOCX
              </button>
              <button className="btnGhost" onClick={onDownloadPdf} disabled={loading || !idActa}>
                <Download size={16} /> PDF
              </button>
            </div>

            {archivos?.docx || archivos?.pdf ? (
              <div className="muted" style={{ marginTop: 8 }}>
                Archivos generados: {archivos?.docx ? "DOCX" : ""} {archivos?.pdf ? "PDF" : ""}
              </div>
            ) : null}
          </div>

          <div className="actaCard">
            <div className="actaTitle">Subir Acta Firmada (PDF)</div>
            <div className="actaSub">
              Solo el <b>PRESIDENTE</b> puede subirla y cuando el tribunal esté <b>CERRADO</b>.
            </div>

            <label className={`uploadBox ${puedoSubirFirmada ? "" : "disabled"}`}>
              <input
                type="file"
                accept="application/pdf"
                disabled={!puedoSubirFirmada || loading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUploadFirmada(f);
                  e.currentTarget.value = "";
                }}
              />
              <div className="uploadInner">
                <UploadCloud size={18} />
                <span>{puedoSubirFirmada ? "Seleccionar PDF firmado" : "No disponible"}</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
