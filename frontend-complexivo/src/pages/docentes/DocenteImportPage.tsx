// src/pages/docentes/DocenteImportPage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Carrera } from "../../types/carrera";

import { carrerasService } from "../../services/carreras.service";
import { docentesService } from "../../services/docentes.service";

// ✅ IMPORT REAL (tu servicio existente)
import {
  downloadPlantillaDocentesCSV,
  parseExcelDocentes,
  resolveCarreraIdByNombre,
} from "../../services/docentesImport.service";

import { ArrowLeft, Upload, Download, Info, FileSpreadsheet } from "lucide-react";
import escudoESPE from "../../assets/escudo.png";
import "./DocenteImportPage.css";

type ToastType = "success" | "error" | "info";

export default function DocenteImportPage() {
  const navigate = useNavigate();

  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Error al importar docentes";
  }

  useEffect(() => {
    loadCarreras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCarreras() {
    try {
      setLoadingCarreras(true);
      const data = await carrerasService.list(false);
      setCarreras((data ?? []).filter((c) => c.estado === 1));
    } catch {
      showToast("Error al cargar carreras", "error");
    } finally {
      setLoadingCarreras(false);
    }
  }

  function onDownloadPlantilla() {
    downloadPlantillaDocentesCSV();
    showToast("Plantilla descargada.", "success");
  }

  function onClickImport() {
    if (loadingCarreras) {
      showToast("Espera a que carguen las carreras.", "info");
      return;
    }
    if (!carreras.length) {
      showToast("No hay carreras activas para importar.", "error");
      return;
    }
    fileRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite re-seleccionar el mismo archivo
    if (!file) return;

    try {
      setImporting(true);

      const { rows, errors: parseErrors } = await parseExcelDocentes(file);

      if (parseErrors.length) {
        showToast(parseErrors[0], "error");
        return;
      }
      if (!rows.length) {
        showToast("El archivo no tiene filas válidas.", "info");
        return;
      }

      // ✅ validar carrera por nombre antes de importar
      const resolved = rows.map((r, idx) => {
        const idCarrera = resolveCarreraIdByNombre(r.nombre_carrera, carreras);
        return { r, idx, idCarrera };
      });

      const firstMissing = resolved.find((x) => !x.idCarrera);
      if (firstMissing) {
        showToast(
          `Fila ${firstMissing.idx + 2}: carrera no encontrada: "${firstMissing.r.nombre_carrera}"`,
          "error"
        );
        return;
      }

      // ✅ IMPORT REAL: crear docentes uno a uno
      let ok = 0;
      let fail = 0;

      for (const item of resolved) {
        try {
          await docentesService.create({
            id_institucional_docente: item.r.id_institucional_docente,
            cedula: item.r.cedula,
            nombres_docente: item.r.nombres_docente,
            apellidos_docente: item.r.apellidos_docente,
            correo_docente: item.r.correo_docente,
            telefono_docente: item.r.telefono_docente,
            nombre_usuario: item.r.nombre_usuario,
            id_carrera: item.idCarrera!,
          });
          ok++;
        } catch {
          fail++;
        }
      }

      if (fail === 0) showToast(`Importación completa: ${ok} creados.`, "success");
      else showToast(`Importación parcial: ${ok} ok, ${fail} fallaron.`, "info");
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="docenteImportPage">
      {/* Input oculto */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        style={{ display: "none" }}
        onChange={onFileSelected}
      />

      <div className="wrap">
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Importar docentes</h1>
              <p className="heroSubtitle">Carga masiva desde Excel con validación de carrera.</p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn" onClick={() => navigate("/docentes")} disabled={importing}>
              <ArrowLeft /> Volver
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead">
            <div>
              <h3 className="panelTitle">Panel de importación</h3>
              <p className="panelSub">1) Descarga la plantilla • 2) Llena el Excel • 3) Importa el archivo</p>
            </div>
          </div>

          <div className="panelBody">
            <div className="steps">
              <div className="step">
                <div className="stepTop">
                  <div className="stepLabel">
                    <Download /> Descargar plantilla
                  </div>
                  <button className="btnGhost" onClick={onDownloadPlantilla} disabled={importing}>
                    <Download /> Plantilla CSV
                  </button>
                </div>
                <div className="stepHint">
                  Usa la plantilla para asegurar el formato correcto. La columna <b>nombre_carrera</b> debe coincidir con
                  el nombre de la carrera activa en el sistema.
                </div>
              </div>

              <div className="step">
                <div className="stepTop">
                  <div className="stepLabel">
                    <FileSpreadsheet /> Importar Excel
                  </div>
                  <button
                    className="btnPrimary"
                    onClick={onClickImport}
                    disabled={importing || loadingCarreras || !carreras.length}
                  >
                    <Upload /> {importing ? "Importando..." : "Seleccionar archivo"}
                  </button>
                </div>
                <div className="stepHint">
                  Formatos permitidos: <b>.xlsx</b> y <b>.xls</b>. Se validará la carrera por nombre antes de crear
                  registros.
                </div>
              </div>
            </div>

            <div className="infoBox">
              <Info />
              <div className="infoText">
                Si alguna fila falla, el proceso continúa con las demás. Al final verás un resumen (ok / fallidos).
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
