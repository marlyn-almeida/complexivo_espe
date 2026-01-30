import { useEffect, useMemo, useRef, useState } from "react";

import type { Departamento } from "../../types/departamento";

import { docentesService, type DocenteImportBulkResponse } from "../../services/docentes.service";

import {
  downloadPlantillaDocentesCSV,
  downloadPlantillaDocentesXLSX,
  parseFileDocentes,
} from "../../services/docentesImport.service";

import { Download, FileSpreadsheet, Info, Upload, User, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

export default function DocentesImportModal({
  open,
  departamentos,
  loadingDepartamentos,
  importingExternal = false,
  onClose,
  onToast,
  onImported,
}: {
  open: boolean;
  departamentos: Departamento[];
  loadingDepartamentos: boolean;
  importingExternal?: boolean; // por si luego quieres controlar import desde afuera
  onClose: () => void;
  onToast: (msg: string, type?: ToastType) => void;
  onImported?: () => void; // callback para refrescar listado al terminar
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [depId, setDepId] = useState<number | "">("");
  const [importing, setImporting] = useState(false);

  const [parseStats, setParseStats] = useState<{
    totalRows: number;
    valid: number;
    invalid: number;
    duplicatesInFile: number;
  } | null>(null);

  const [parseIssues, setParseIssues] = useState<Array<{ rowNum: number; docenteLabel: string; reason: string }>>([]);

  const [backendResult, setBackendResult] = useState<DocenteImportBulkResponse | null>(null);

  const busy = importing || importingExternal;

  const activeDeps = useMemo(() => (departamentos ?? []).filter((d) => d.estado === 1), [departamentos]);

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

  // ✅ Al abrir: setear un departamento por defecto
  useEffect(() => {
    if (!open) return;

    // reset visual
    setBackendResult(null);
    setParseStats(null);
    setParseIssues([]);

    // poner depto por defecto si existe
    if (activeDeps.length) {
      setDepId((prev) => (prev ? prev : Number(activeDeps[0].id_departamento)));
    } else {
      setDepId("");
    }
  }, [open, activeDeps]);

  if (!open) return null;

  function close() {
    if (!busy) onClose();
  }

  function onDownloadCSV() {
    downloadPlantillaDocentesCSV();
    onToast("Plantilla CSV descargada.", "success");
  }

  function onDownloadXLSX() {
    downloadPlantillaDocentesXLSX();
    onToast("Plantilla XLSX descargada.", "success");
  }

  function onClickImport() {
    if (!depId) {
      onToast("Selecciona un departamento antes de importar.", "info");
      return;
    }
    fileRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBackendResult(null);
    setParseStats(null);
    setParseIssues([]);

    try {
      setImporting(true);

      const report = await parseFileDocentes(file);

      setParseStats(report.stats);
      setParseIssues(report.issues);

      if (!report.rows.length) {
        onToast("No hay filas válidas para importar.", "info");
        return;
      }

      // ✅ IMPORT MASIVO (backend)
      const result = await docentesService.importBulk({
        id_departamento: Number(depId),
        rows: report.rows,
      });

      setBackendResult(result);

      const ok = result?.resumen?.importados ?? 0;
      const omitidos = result?.resumen?.omitidos ?? 0;

      if (omitidos === 0) onToast(`Importación completa: ${ok} importados.`, "success");
      else onToast(`Importación terminada: ${ok} importados, ${omitidos} omitidos.`, "info");

      onImported?.();
    } catch (err: any) {
      onToast(extractBackendError(err), "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={close}>
      <div className="modalCard modalPro" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: "none" }}
          onChange={onFileSelected}
        />

        <div className="modalHeader">
          <div className="modalHeaderLeft">
            <div className="modalHeaderIcon">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="modalHeaderTitle">Importar docentes</div>
              <div className="modalHeaderSub">Carga masiva desde Excel con validaciones y reporte final</div>
            </div>
          </div>

          <button className="modalClose" onClick={close} aria-label="Cerrar" disabled={busy}>
            <X />
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          {/* Departamento */}
          <div className="importTopRow">
            <div className="importTopLeft">
              <div className="importLabel">
                <User size={16} /> Departamento <span className="req">*</span>
              </div>

              <select
                className="select"
                value={depId}
                onChange={(e) => setDepId(Number(e.target.value))}
                disabled={busy || loadingDepartamentos || !activeDeps.length}
              >
                {activeDeps.length === 0 ? (
                  <option value="">Sin departamentos</option>
                ) : (
                  activeDeps.map((d) => (
                    <option key={d.id_departamento} value={d.id_departamento}>
                      {d.nombre_departamento}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="importTopRight">
              <div className="importLabel">
                <Download size={16} /> Plantillas
              </div>
              <div className="importBtnRow">
                <button className="btnGhost" onClick={onDownloadCSV} disabled={busy}>
                  <Download size={16} />
                  CSV
                </button>
                <button className="btnGhost" onClick={onDownloadXLSX} disabled={busy}>
                  <Download size={16} />
                  XLSX
                </button>
              </div>
            </div>
          </div>

          {/* Paso importar */}
          <div className="importStepBox">
            <div className="importStepHead">
              <div className="importStepTitle">
                <Upload size={18} />
                Importar Excel
              </div>
              <button className="btnPrimary" onClick={onClickImport} disabled={busy || !depId}>
                <Upload size={16} />
                {busy ? "Importando..." : "Seleccionar archivo"}
              </button>
            </div>

            <div className="importHint">
              Formatos permitidos: <b>.xlsx</b> y <b>.xls</b>. Se validan correos, duplicados dentro del archivo y
              duplicados en BD (se omiten).
            </div>
          </div>

          <div className="infoBox" style={{ marginTop: 12 }}>
            <Info />
            <div className="infoText">
              El import continúa aunque algunas filas fallen. Al final verás un resumen y los motivos de omitidos.
            </div>
          </div>

          {/* Stats del archivo */}
          {parseStats && (
            <div className="importBlock">
              <h4 className="importH4">Resumen del archivo</h4>
              <div className="chipRow">
                <div className="chip">
                  Total filas: <b>{parseStats.totalRows}</b>
                </div>
                <div className="chip">
                  Válidas: <b>{parseStats.valid}</b>
                </div>
                <div className="chip">
                  Inválidas: <b>{parseStats.invalid}</b>
                </div>
                <div className="chip">
                  Duplicadas en Excel: <b>{parseStats.duplicatesInFile}</b>
                </div>
              </div>
            </div>
          )}

          {/* Issues */}
          {!!parseIssues.length && (
            <div className="importBlock">
              <h4 className="importH4">Problemas detectados en el archivo</h4>

              <div className="tableBox">
                <table className="table importTableMini">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Docente</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseIssues.slice(0, 20).map((x, i) => (
                      <tr key={i}>
                        <td>{x.rowNum}</td>
                        <td>{x.docenteLabel}</td>
                        <td>{x.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parseIssues.length > 20 && (
                <div className="mutedSmall">Mostrando 20 de {parseIssues.length} errores del archivo.</div>
              )}
            </div>
          )}

          {/* Resultado backend */}
          {backendResult && (
            <div className="importBlock">
              <h4 className="importH4">Resultado de importación</h4>
              <div className="chipRow">
                <div className="chip">
                  Total enviado: <b>{backendResult.resumen.total}</b>
                </div>
                <div className="chip">
                  Importados: <b>{backendResult.resumen.importados}</b>
                </div>
                <div className="chip">
                  Omitidos: <b>{backendResult.resumen.omitidos}</b>
                </div>
              </div>
            </div>
          )}

          <div className="modalFooter">
            <button className="btnGhost" onClick={close} disabled={busy}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
