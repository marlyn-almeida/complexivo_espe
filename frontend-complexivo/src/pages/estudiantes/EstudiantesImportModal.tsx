import { useEffect, useMemo, useRef, useState } from "react";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";

import { estudiantesService } from "../../services/estudiantes.service";

import {
  downloadPlantillaEstudiantesCSV,
  parseExcelEstudiantes,
  resolveCarreraPeriodoIdByNombreCarreraCodigoPeriodo,
} from "../../services/estudiantesImport.service";

import { Download, FileSpreadsheet, Info, Upload, GraduationCap, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

export default function EstudiantesImportModal({
  open,
  carreraPeriodos,
  loadingCarreraPeriodos,
  importingExternal = false,
  onClose,
  onToast,
  onImported,
}: {
  open: boolean;
  carreraPeriodos: CarreraPeriodo[];
  loadingCarreraPeriodos: boolean;
  importingExternal?: boolean;
  onClose: () => void;
  onToast: (msg: string, type?: ToastType) => void;
  onImported?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [importing, setImporting] = useState(false);

  const [parseStats, setParseStats] = useState<{
    totalRows: number;
    valid: number;
    invalid: number;
  } | null>(null);

  const [parseIssues, setParseIssues] = useState<Array<{ rowNum: number; label: string; reason: string }>>([]);

  const busy = importing || importingExternal;

  const cps = useMemo(() => (carreraPeriodos ?? []).slice(), [carreraPeriodos]);

  useEffect(() => {
    if (!open) return;
    setParseStats(null);
    setParseIssues([]);
  }, [open]);

  if (!open) return null;

  function close() {
    if (!busy) onClose();
  }

  function onDownloadCSV() {
    downloadPlantillaEstudiantesCSV();
    onToast("Plantilla CSV descargada.", "success");
  }

  function onClickImport() {
    if (!cps.length) {
      onToast("Primero carga Carrera–Período.", "info");
      return;
    }
    fileRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setParseStats(null);
    setParseIssues([]);

    try {
      setImporting(true);

      const rows = await parseExcelEstudiantes(file);

      // stats simples
      setParseStats({
        totalRows: rows.length,
        valid: rows.length,
        invalid: 0,
      });

      if (!rows.length) {
        onToast("No hay filas válidas para importar.", "info");
        return;
      }

      let ok = 0;
      const issues: Array<{ rowNum: number; label: string; reason: string }> = [];

      for (const r of rows) {
        const idCP = resolveCarreraPeriodoIdByNombreCarreraCodigoPeriodo(r.__nombre_carrera, r.__codigo_periodo, cps);

        if (!idCP) {
          issues.push({
            rowNum: r.__rowNumber,
            label: `${r.id_institucional_estudiante} — ${r.__nombre_carrera} / ${r.__codigo_periodo}`,
            reason: "No existe Carrera–Período para la carrera y período indicados.",
          });
          continue;
        }

        try {
          await estudiantesService.create({
            id_carrera_periodo: idCP,
            id_institucional_estudiante: r.id_institucional_estudiante,
            nombres_estudiante: r.nombres_estudiante,
            apellidos_estudiante: r.apellidos_estudiante,
            correo_estudiante: r.correo_estudiante,
            telefono_estudiante: r.telefono_estudiante,
          } as any);
          ok++;
        } catch (err: any) {
          issues.push({
            rowNum: r.__rowNumber,
            label: `${r.id_institucional_estudiante} — ${r.nombres_estudiante} ${r.apellidos_estudiante}`,
            reason: err?.response?.data?.message || "Error al crear el estudiante en el backend.",
          });
        }
      }

      setParseIssues(issues);

      if (issues.length === 0) onToast(`Importación completa: ${ok} importados.`, "success");
      else onToast(`Importación terminada: ${ok} importados, ${issues.length} omitidos.`, "info");

      onImported?.();
    } catch (err: any) {
      onToast(err?.message || "Error al importar estudiantes", "error");
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
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={onFileSelected}
        />

        <div className="modalHeader">
          <div className="modalHeaderLeft">
            <div className="modalHeaderIcon">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <div className="modalHeaderTitle">Importar estudiantes</div>
              <div className="modalHeaderSub">Carga masiva desde Excel/CSV con validaciones</div>
            </div>
          </div>

          <button className="modalClose" onClick={close} aria-label="Cerrar" disabled={busy}>
            <X />
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          <div className="importTopRow">
            <div className="importTopLeft">
              <div className="importLabel">
                <GraduationCap size={16} /> Carrera–Período (referencia)
              </div>

              <div className="mutedSmall">
                El archivo debe traer <b>nombre_carrera</b> y <b>codigo_periodo</b>. Con eso se resuelve el ID.
              </div>
            </div>

            <div className="importTopRight">
              <div className="importLabel">
                <Download size={16} /> Plantilla
              </div>
              <div className="importBtnRow">
                <button className="btnGhost" onClick={onDownloadCSV} disabled={busy}>
                  <Download size={16} />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="importStepBox">
            <div className="importStepHead">
              <div className="importStepTitle">
                <Upload size={18} />
                Importar archivo
              </div>
              <button className="btnPrimary" onClick={onClickImport} disabled={busy || loadingCarreraPeriodos}>
                <Upload size={16} />
                {busy ? "Importando..." : "Seleccionar archivo"}
              </button>
            </div>

            <div className="importHint">
              Formatos permitidos: <b>.xlsx</b>, <b>.xls</b>, <b>.csv</b>. Se valida correo y que exista Carrera–Período.
            </div>
          </div>

          <div className="infoBox" style={{ marginTop: 12 }}>
            <Info />
            <div className="infoText">
              El import continúa aunque algunas filas fallen. Al final verás un resumen y los motivos de omitidos.
            </div>
          </div>

          {parseStats && (
            <div className="importBlock">
              <h4 className="importH4">Resumen del archivo</h4>
              <div className="chipRow">
                <div className="chip">
                  Filas procesadas: <b>{parseStats.totalRows}</b>
                </div>
                <div className="chip">
                  Importadas: <b>{parseStats.valid - parseIssues.length}</b>
                </div>
                <div className="chip">
                  Omitidas: <b>{parseIssues.length}</b>
                </div>
              </div>
            </div>
          )}

          {!!parseIssues.length && (
            <div className="importBlock">
              <h4 className="importH4">Filas omitidas (hasta 20)</h4>

              <div className="tableBox">
                <table className="table importTableMini">
                  <thead>
                    <tr>
                      <th>Fila</th>
                      <th>Registro</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseIssues.slice(0, 20).map((x, i) => (
                      <tr key={i}>
                        <td>{x.rowNum}</td>
                        <td>{x.label}</td>
                        <td>{x.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parseIssues.length > 20 && <div className="mutedSmall">Mostrando 20 de {parseIssues.length} omitidos.</div>}
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
