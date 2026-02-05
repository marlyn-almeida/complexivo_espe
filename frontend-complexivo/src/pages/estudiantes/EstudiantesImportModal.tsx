// ✅ src/pages/estudiantes/EstudiantesImportModal.tsx
import { useEffect, useMemo, useRef, useState } from "react";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import { estudiantesService } from "../../services/estudiantes.service";

import {
  downloadPlantillaEstudiantesCSV,
  downloadPlantillaEstudiantesXLSX,
  parseExcelEstudiantes,
} from "../../services/estudiantesImport.service";

import { Download, FileSpreadsheet, Info, Upload, GraduationCap, X, AlertTriangle } from "lucide-react";

// ✅ REUSA el mismo CSS de Docentes
import "../docentes/DocentesImportModal.css";

type ToastType = "success" | "error" | "info";
type Issue = { rowNum: number; label: string; reason: string };

function onlyDigits(v: any) {
  return String(v ?? "").replace(/\D+/g, "");
}

function isValidCedulaMin(ced: string) {
  const d = onlyDigits(ced);
  return d.length >= 10;
}

function isValidUsuario(u: string) {
  const v = String(u ?? "").trim();
  if (!v) return false;
  if (/\s/.test(v)) return false;
  if (v.length < 4) return false;
  return true;
}

export default function EstudiantesImportModal({
  open,
  carreraPeriodos,
  loadingCarreraPeriodos = false,
  importingExternal = false,
  setImportingExternal,
  onClose,
  onToast,
  onImported,
}: {
  open: boolean;
  carreraPeriodos: CarreraPeriodo[];
  loadingCarreraPeriodos?: boolean;
  importingExternal?: boolean;
  setImportingExternal: (v: boolean) => void;
  onClose: () => void;
  onToast: (msg: string, type?: ToastType) => void;
  onImported?: () => void | Promise<void>;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [cpId, setCpId] = useState<number | "">("");
  const [importing, setImporting] = useState(false);

  const [stats, setStats] = useState<{ total: number; ok: number; omitidos: number } | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);

  const busy = importing || importingExternal;

  // ✅ NO filtrar por estado: si tu API no manda "estado" esto quedaba vacío.
  const cps = useMemo(() => (carreraPeriodos ?? []).slice(), [carreraPeriodos]);

  useEffect(() => {
    if (!open) return;

    setIssues([]);
    setStats(null);

    // ✅ setear el primero disponible
    if (cps.length) {
      setCpId((prev) => (prev ? prev : Number((cps[0] as any).id_carrera_periodo)));
    } else {
      setCpId("");
    }
  }, [open, cps]);

  if (!open) return null;

  function close() {
    if (!busy) onClose();
  }

  function labelCP(cp: any) {
    const carrera = (cp.nombre_carrera ?? cp.codigo_carrera) || "Carrera";
    const periodo = (cp.codigo_periodo ?? cp.descripcion_periodo) || "Período";
    return `${carrera} — ${periodo}`;
  }

  function extractBackendMsg(err: any) {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length && list[0]?.msg) return String(list[0].msg);
    if (typeof msg === "string" && msg.trim()) return msg;
    return err?.message || "Error al crear el estudiante.";
  }

  function onDownloadCSV() {
    downloadPlantillaEstudiantesCSV();
    onToast("Plantilla descargada (CSV).", "success");
  }

  function onDownloadXLSX() {
    downloadPlantillaEstudiantesXLSX();
    onToast("Plantilla descargada (Excel).", "success");
  }

  function onClickImport() {
    if (!cpId) {
      onToast("Selecciona un Carrera–Período antes de importar.", "info");
      return;
    }
    fileRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIssues([]);
    setStats(null);

    try {
      setImporting(true);
      setImportingExternal(true);

      const rows = await parseExcelEstudiantes(file);

      if (!rows.length) {
        onToast("No hay filas válidas para importar.", "info");
        return;
      }

      let ok = 0;
      const om: Issue[] = [];

      for (const r of rows as any[]) {
        const rowNum = Number(r.__rowNumber ?? 0) || 0;

        const idInst = String(r.id_institucional_estudiante ?? "").trim();
        const usuario = String(r.nombre_usuario ?? "").trim(); // ✅ CLAVE
        const cedulaRaw = String(r.cedula ?? "").trim();
        const cedula = onlyDigits(cedulaRaw);

        const nombres = String(r.nombres_estudiante ?? "").trim();
        const apellidos = String(r.apellidos_estudiante ?? "").trim();

        const correo = r.correo_estudiante ?? null;
        const telefono = r.telefono_estudiante ?? null;

        const labelBase =
          `${idInst || "SIN-ID"} — ${nombres} ${apellidos}`.trim() || `Fila ${rowNum || ""}`;

        // ✅ VALIDACIONES
        if (!idInst || !nombres || !apellidos) {
          om.push({
            rowNum,
            label: labelBase,
            reason: "Faltan datos obligatorios (identificación y nombres).",
          });
          continue;
        }

        if (!isValidUsuario(usuario)) {
          om.push({
            rowNum,
            label: labelBase,
            reason: "Usuario inválido (obligatorio, sin espacios y mínimo 4 caracteres).",
          });
          continue;
        }

        if (!cedula) {
          om.push({ rowNum, label: labelBase, reason: "La cédula es obligatoria." });
          continue;
        }

        if (!isValidCedulaMin(cedula)) {
          om.push({ rowNum, label: labelBase, reason: "Cédula inválida (mínimo 10 dígitos)." });
          continue;
        }

        try {
          await estudiantesService.create({
            id_carrera_periodo: Number(cpId),
            id_institucional_estudiante: idInst,
            nombre_usuario: usuario, // ✅ FIX REAL: enviar al backend
            cedula,
            nombres_estudiante: nombres,
            apellidos_estudiante: apellidos,
            correo_estudiante: correo,
            telefono_estudiante: telefono,
          } as any);

          ok++;
        } catch (err: any) {
          om.push({ rowNum, label: labelBase, reason: extractBackendMsg(err) });
        }
      }

      setIssues(om);
      setStats({ total: rows.length, ok, omitidos: om.length });

      if (om.length === 0) onToast(`Importación completa: ${ok} importados.`, "success");
      else onToast(`Importación terminada: ${ok} importados, ${om.length} omitidos.`, "info");

      await onImported?.();
    } catch (err: any) {
      onToast(err?.message || "Error al importar estudiantes", "error");
    } finally {
      setImporting(false);
      setImportingExternal(false);
    }
  }

  return (
    <div className="dmOverlay" onMouseDown={close}>
      <div className="dmCard dmWide" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
          onChange={onFileSelected}
        />

        {/* Header */}
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <FileSpreadsheet size={18} />
            </div>
            <div className="dmHeaderText">
              <div className="dmTitle">Importar estudiantes</div>
              <div className="dmSub">Carga masiva desde Excel/CSV</div>
            </div>
          </div>

          <button className="dmClose" onClick={close} aria-label="Cerrar" disabled={busy}>
            <X size={18} />
          </button>
        </div>

        <div className="dmBody">
          {/* ✅ TOP GRID: Carrera–Período | Plantillas */}
          <div className="dimTopGrid">
            {/* Carrera–Período */}
            <div className="dimCard">
              <div className="dimCardHead">
                <div className="dimCardTitle">
                  <GraduationCap size={16} /> Carrera–Período <span className="dimReq">*</span>
                </div>
              </div>

              <div className="dimRow">
                <select
                  className="select"
                  value={cpId}
                  onChange={(e) => setCpId(e.target.value ? Number(e.target.value) : "")}
                  disabled={busy || loadingCarreraPeriodos || !cps.length}
                >
                  {!cps.length ? (
                    <option value="">No hay Carrera–Período disponibles</option>
                  ) : (
                    cps.map((cp: any) => (
                      <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                        {labelCP(cp)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="dimHint">
                <Info size={16} />
                <span>Selecciona el Carrera–Período al que se asignará la importación.</span>
              </div>
            </div>

            {/* Plantillas */}
            <div className="dimCard">
              <div className="dimCardHead">
                <div className="dimCardTitle">
                  <Download size={16} /> Plantillas
                </div>
              </div>

              <div className="dimTemplateBtns" style={{ marginTop: 10 }}>
                <button className="dimTemplateBtn" onClick={onDownloadCSV} disabled={busy} title="Descargar CSV">
                  <Download size={16} />
                  <span>CSV</span>
                </button>

                <button className="dimTemplateBtn" onClick={onDownloadXLSX} disabled={busy} title="Descargar Excel">
                  <Download size={16} />
                  <span>EXCEL</span>
                </button>
              </div>

              <div className="dimHint" style={{ marginTop: 10 }}>
                <Info size={16} />
                <span>Descarga y llena la plantilla con el formato correcto.</span>
              </div>
            </div>
          </div>

          {/* Importar */}
          <div className="dimCard" style={{ marginTop: 12 }}>
            <div className="dimCardHead">
              <div className="dimCardTitle">
                <Upload size={16} /> Importar archivo
              </div>
            </div>

            <div className="dimRow" style={{ alignItems: "center" }}>
              <button className="btnPrimary" onClick={onClickImport} disabled={busy || !cpId}>
                <Upload size={16} />
                {busy ? "Importando..." : "Seleccionar archivo"}
              </button>

              <div className="dimSmall">
                Formatos: <b>Excel</b> o <b>CSV</b>
              </div>
            </div>

            <div className="dimNote">
              <Info size={16} />
              <span>El proceso continúa aunque algunas filas fallen.</span>
            </div>
          </div>

          {/* Resumen */}
          {stats && (
            <div className="dimSection">
              <div className="dimSectionTitle">Resumen de importación</div>
              <div className="dimChips">
                <span className="dimChip">
                  Total: <b>{stats.total}</b>
                </span>
                <span className="dimChip dimChipOk">
                  Importados: <b>{stats.ok}</b>
                </span>
                <span className="dimChip dimChipWarn">
                  Omitidos: <b>{stats.omitidos}</b>
                </span>
              </div>
            </div>
          )}

          {/* Omitidos */}
          {!!issues.length && (
            <div className="dimSection">
              <div className="dimSectionTitle">
                <AlertTriangle size={16} /> Filas omitidas (hasta 20)
              </div>

              <div className="dimTableWrap">
                <table className="dimTable">
                  <thead>
                    <tr>
                      <th style={{ width: 90 }}>Fila</th>
                      <th>Registro</th>
                      <th>Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.slice(0, 20).map((x, i) => (
                      <tr key={i}>
                        <td>{x.rowNum}</td>
                        <td>{x.label}</td>
                        <td>{x.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {issues.length > 20 && (
                <div className="dimSmall" style={{ marginTop: 8 }}>
                  Mostrando 20 de {issues.length} omitidos.
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
