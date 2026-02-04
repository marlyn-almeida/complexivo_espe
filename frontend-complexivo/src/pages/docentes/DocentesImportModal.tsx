import { useEffect, useMemo, useRef, useState } from "react";

import type { Departamento } from "../../types/departamento";
import { docentesService, type DocenteImportBulkResponse } from "../../services/docentes.service";

import {
  downloadPlantillaDocentesCSV,
  downloadPlantillaDocentesXLSX,
  parseFileDocentes,
} from "../../services/docentesImport.service";

import {
  Download,
  FileSpreadsheet,
  Info,
  Upload,
  User,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import "./DocentesImportModal.css";

type ToastType = "success" | "error" | "info";
type Issue = { rowNum: number; docenteLabel: string; reason: string };

function tryGetArray(obj: any, keys: string[]): any[] | null {
  for (const k of keys) {
    const v = obj?.[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

function normalizeBackendOmissions(result: any): Issue[] {
  const arr =
    tryGetArray(result, [
      "omitidos_detalle",
      "omitidosDetalle",
      "detalle_omitidos",
      "detalleOmitidos",
      "errors",
      "errores",
    ]) ||
    tryGetArray(result?.resumen, [
      "omitidos_detalle",
      "omitidosDetalle",
      "detalle_omitidos",
      "detalleOmitidos",
    ]) ||
    [];

  if (!Array.isArray(arr) || !arr.length) return [];

  return arr
    .map((x: any, idx: number) => ({
      rowNum: Number(x?.rowNum ?? x?.fila ?? x?.row ?? x?.index ?? idx + 1),
      docenteLabel:
        String(
          x?.docenteLabel ??
            x?.docente ??
            x?.nombre ??
            x?.label ??
            x?.correo_docente ??
            x?.nombre_usuario ??
            x?.cedula ??
            "Docente"
        ) || "Docente",
      reason: String(x?.reason ?? x?.motivo ?? x?.message ?? x?.msg ?? "Omitido"),
    }))
    .slice(0, 200);
}

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
  importingExternal?: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: ToastType) => void;
  onImported?: () => void;
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

  const [parseIssues, setParseIssues] = useState<Issue[]>([]);
  const [backendResult, setBackendResult] = useState<DocenteImportBulkResponse | null>(null);
  const [backendOmissions, setBackendOmissions] = useState<Issue[]>([]);

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

  useEffect(() => {
    if (!open) return;

    setBackendResult(null);
    setBackendOmissions([]);
    setParseStats(null);
    setParseIssues([]);

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
    setBackendOmissions([]);
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

      const result = await docentesService.importBulk({
        id_departamento: Number(depId),
        rows: report.rows,
      });

      setBackendResult(result);

      const om = normalizeBackendOmissions(result);
      setBackendOmissions(om);

      const ok = (result as any)?.resumen?.importados ?? 0;
      const omitidos = (result as any)?.resumen?.omitidos ?? 0;

      if (omitidos === 0) onToast(`Importación completa: ${ok} importados.`, "success");
      else onToast(`Importación terminada: ${ok} importados, ${omitidos} omitidos.`, "info");

      onImported?.();
    } catch (err: any) {
      onToast(extractBackendError(err), "error");
    } finally {
      setImporting(false);
    }
  }

  const omitidosCount = (backendResult as any)?.resumen?.omitidos ?? 0;
  const importadosCount = (backendResult as any)?.resumen?.importados ?? 0;

  return (
    <div className="dmOverlay" onMouseDown={close}>
      <div className="dmCard dmWide" onMouseDown={(e) => e.stopPropagation()}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={onFileSelected} />

        {/* Header */}
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <FileSpreadsheet size={18} />
            </div>
            <div className="dmHeaderText">
              <div className="dmTitle">Importar docentes</div>
              <div className="dmSub">Carga masiva desde Excel con validaciones y reporte final</div>
            </div>
          </div>

          <button className="dmClose" onClick={close} aria-label="Cerrar" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="dmBody">
          {/* ✅ GRID 2 columnas: Departamento | Plantillas */}
          <div className="dimTopGrid">
            {/* ===== Recuadro: Departamento ===== */}
            <div className="dimCard">
              <div className="dimCardHead">
                <div className="dimCardTitle">
                  <User size={16} /> Departamento <span className="dimReq">*</span>
                </div>
              </div>

              <div className="dimRow">
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

              <div className="dimHint">
                <Info size={16} />
                <span>Todos los docentes importados se asignarán a este departamento.</span>
              </div>
            </div>

            {/* ===== Recuadro: Plantillas ===== */}
            <div className="dimCard">
              <div className="dimCardHead">
                <div className="dimCardTitle">
                  <Download size={16} /> Plantillas
                </div>
              </div>

              <div className="dimTemplateBtns" style={{ marginTop: 10 }}>
                <button className="dimTemplateBtn" onClick={onDownloadCSV} disabled={busy} title="Descargar plantilla CSV">
                  <Download size={16} />
                  <span>CSV</span>
                </button>

                <button className="dimTemplateBtn" onClick={onDownloadXLSX} disabled={busy} title="Descargar plantilla XLSX">
                  <Download size={16} />
                  <span>XLSX</span>
                </button>
              </div>

              <div className="dimHint" style={{ marginTop: 10 }}>
                <Info size={16} />
                <span>
                  Estas son las <b>plantillas oficiales</b>. Descárgalas para llenar los datos con el formato correcto.
                </span>
              </div>
            </div>
          </div>

          {/* ===== Recuadro: Importar ===== */}
          <div className="dimCard" style={{ marginTop: 12 }}>
            <div className="dimCardHead">
              <div className="dimCardTitle">
                <Upload size={16} /> Importar Excel
              </div>
            </div>

            <div className="dimRow" style={{ alignItems: "center" }}>
              <button className="btnPrimary" onClick={onClickImport} disabled={busy || !depId}>
                <Upload size={16} />
                {busy ? "Importando..." : "Seleccionar archivo"}
              </button>

              <div className="dimSmall">
                Formatos permitidos: <b>.xlsx</b> y <b>.xls</b>
              </div>
            </div>

            <div className="dimNote">
              <Info size={16} />
              <span>La cédula será la contraseña inicial. Si una fila falla, el proceso continúa con los demás.</span>
            </div>
          </div>

          {/* Resumen del archivo */}
          {parseStats && (
            <div className="dimSection">
              <div className="dimSectionTitle">Resumen del archivo</div>
              <div className="dimChips">
                <span className="dimChip">
                  Total: <b>{parseStats.totalRows}</b>
                </span>
                <span className="dimChip dimChipOk">
                  Válidas: <b>{parseStats.valid}</b>
                </span>
                <span className="dimChip dimChipWarn">
                  Inválidas: <b>{parseStats.invalid}</b>
                </span>
                <span className="dimChip">
                  Duplicadas en Excel: <b>{parseStats.duplicatesInFile}</b>
                </span>
              </div>
            </div>
          )}

          {/* Issues parse */}
          {!!parseIssues.length && (
            <div className="dimSection">
              <div className="dimSectionTitle">
                <AlertTriangle size={16} /> Problemas detectados en el archivo
              </div>

              <div className="dimTableWrap">
                <table className="dimTable">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Fila</th>
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
                <div className="dimSmall" style={{ marginTop: 8 }}>
                  Mostrando 20 de {parseIssues.length} problemas del archivo.
                </div>
              )}
            </div>
          )}

          {/* Backend result */}
          {backendResult && (
            <div className="dimSection">
              <div className="dimSectionTitle">
                <CheckCircle2 size={16} /> Resultado de importación
              </div>

              <div className="dimChips">
                <span className="dimChip">
                  Importados: <b>{importadosCount}</b>
                </span>
                <span className="dimChip dimChipWarn">
                  Omitidos: <b>{omitidosCount}</b>
                </span>
              </div>

              {omitidosCount > 0 && backendOmissions.length === 0 && (
                <div className="dimNoDetail">
                  <Info size={16} />
                  <span>
                    El servidor omitió {omitidosCount} registro(s), pero <b>no devolvió el motivo por fila</b>.
                    Usualmente es por duplicados en BD (correo/usuario/cédula) o validaciones del backend.
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="dmFooter">
            <button className="dmBtnGhost" onClick={close} disabled={busy}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
