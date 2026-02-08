// ✅ src/pages/tribunales/TribunalFormModal.tsx
import { useEffect, useMemo, useState } from "react";
import { X, Plus, Trash2, Save, FileText } from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CasoEstudio } from "../../types/casoEstudio";
import type { CarreraDocente } from "../../types/carreraDocente";

import type { TribunalCreateDTO, TribunalUpdateDTO } from "../../services/tribunales.service";

import "./TribunalFormModal.css";

type ToastType = "success" | "error" | "info";

export type TribunalFormState = {
  nombre_tribunal: string;
  descripcion_tribunal: string;
  presidente: number | "";
  integrante1: number | "";
  integrante2: number | "";
};

export type AsigRow = {
  key: string;
  id_estudiante: number | "";
  id_franja_horario: number | "";
  /**
   * ✅ IMPORTANTE:
   * El caso NO es del estudiante; es de tribunal_estudiante.
   * Esto es SOLO "plantilla opcional" (si tu backend lo soporta).
   */
  id_caso_estudio?: number | "";
};

// ==============================
// ✅ 1) Props "compat" (TU PAGE)
// ==============================
type CompatProps = {
  open: boolean;
  onClose: () => void;

  // lo que tu TribunalesPage envía
  editing: Tribunal | null;
  docentes: CarreraDocente[];
  selectedCPLabel: string;

  tribunalForm: TribunalFormState;
  setTribunalForm: React.Dispatch<React.SetStateAction<TribunalFormState>>;

  formErrors: Record<string, string>;
  saving: boolean;

  onSave: () => Promise<void>;

  // opcional por si luego quieres la plantilla desde aquí
  estudiantes?: Estudiante[];
  franjas?: FranjaHorario[];
  casos?: CasoEstudio[];
};

// =====================================
// ✅ 2) Props "nuevo" (modo alternativo)
// =====================================
type NewProps = {
  open: boolean;
  onClose: () => void;

  mode: "create" | "edit";
  editingTribunal?: Tribunal | null;

  selectedCP: number;

  docentes: CarreraDocente[];
  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  casos: CasoEstudio[];

  saving: boolean;

  onSubmit: (payload: TribunalCreateDTO | TribunalUpdateDTO, plantilla: AsigRow[]) => Promise<void>;
  showToast: (msg: string, type?: ToastType) => void;
};

// ✅ union (acepta ambos)
type Props = CompatProps | NewProps;

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// helpers para detectar qué props llegaron
function isCompat(p: Props): p is CompatProps {
  return (p as any).onSave !== undefined;
}

export default function TribunalFormModal(props: Props) {
  const open = props.open;
  const onClose = props.onClose;
  const saving = props.saving;

  // ✅ si vienes desde TU page:
  const compat = isCompat(props);

  // ===== fuente de datos (docentes/estudiantes/franjas/casos) =====
  const docentes = compat ? props.docentes : props.docentes;

  const estudiantes = compat ? props.estudiantes ?? [] : props.estudiantes;
  const franjas = compat ? props.franjas ?? [] : props.franjas;
  const casos = compat ? props.casos ?? [] : props.casos;

  // ===== modo/tribunal edit =====
  const isEdit = compat ? !!props.editing : props.mode === "edit";
  const editingTribunal: Tribunal | null = compat ? props.editing : props.editingTribunal ?? null;

  // ===== Toast =====
  const showToast = compat ? (() => {}) : props.showToast;

  // ============================================================
  // ✅ FORM CONTROLADO (si viene desde TU Page) o interno (nuevo)
  // ============================================================
  const [internalForm, setInternalForm] = useState<TribunalFormState>({
    nombre_tribunal: "",
    descripcion_tribunal: "",
    presidente: "",
    integrante1: "",
    integrante2: "",
  });

  const form = compat ? props.tribunalForm : internalForm;
  const setForm = compat ? props.setTribunalForm : setInternalForm;

  // errors: si vienes del page, usas formErrors del page
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const errors = compat ? props.formErrors : internalErrors;
  const setErrors = compat ? (() => {}) : setInternalErrors;

  // plantilla (opcional)
  const [rows, setRows] = useState<AsigRow[]>([]);

  useEffect(() => {
    if (!open) return;

    // ✅ cuando abres modal, precarga (si edit) o limpia (si create)
    if (isEdit && editingTribunal) {
      // si vienes del page, tu Page YA SETEA tribunalForm al abrir editar
      // aquí solo limpiamos plantilla + errores internos
      if (!compat) {
        setForm({
          nombre_tribunal: String((editingTribunal as any).nombre_tribunal || ""),
          descripcion_tribunal: String((editingTribunal as any).descripcion_tribunal || ""),
          presidente: "",
          integrante1: "",
          integrante2: "",
        });
      }
      setRows([]);
      if (!compat) setInternalErrors({});
      return;
    }

    // create
    if (!compat) {
      setForm({
        nombre_tribunal: "",
        descripcion_tribunal: "",
        presidente: "",
        integrante1: "",
        integrante2: "",
      });
    }
    setRows([]);
    if (!compat) setInternalErrors({});
  }, [open, isEdit, editingTribunal, compat, setForm]);

  const docentesOptions = useMemo(() => {
    return (docentes ?? []).map((d: any) => ({
      id: Number(d.id_carrera_docente),
      label: `${d.apellidos_docente ?? ""} ${d.nombres_docente ?? ""}`.trim(),
    }));
  }, [docentes]);

  const estudiantesOptions = useMemo(() => {
    return (estudiantes ?? []).map((e: any) => ({
      id: Number(e.id_estudiante),
      label: `${e.id_institucional_estudiante} — ${e.apellidos_estudiante} ${e.nombres_estudiante}`.trim(),
    }));
  }, [estudiantes]);

  const franjasOptions = useMemo(() => {
    return (franjas ?? []).map((f: any) => ({
      id: Number(f.id_franja_horario),
      label: `${f.fecha} ${f.hora_inicio}-${f.hora_fin} (${f.laboratorio})`,
    }));
  }, [franjas]);

  const casosOptions = useMemo(() => {
    return (casos ?? []).map((c: any) => ({
      id: Number(c.id_caso_estudio),
      label: `Caso ${c.numero_caso}${c.titulo ? ` — ${c.titulo}` : ""}`,
    }));
  }, [casos]);

  function validateNewPropsOnly(): Record<string, string> {
    // ✅ SOLO se usa si estás en modo "nuevo" (onSubmit)
    const e: Record<string, string> = {};
    if (!compat) {
      if (!props.selectedCP) e.id_carrera_periodo = "Seleccione Carrera–Período.";
      if (!form.nombre_tribunal.trim()) e.nombre_tribunal = "Ingrese el nombre del tribunal.";
      if (!form.presidente) e.presidente = "Seleccione Presidente.";
      if (!form.integrante1) e.integrante1 = "Seleccione Integrante 1.";
      if (!form.integrante2) e.integrante2 = "Seleccione Integrante 2.";

      const ids = [form.presidente, form.integrante1, form.integrante2].filter(Boolean) as number[];
      const uniq = new Set(ids);
      if (ids.length && uniq.size !== ids.length) e.docentes = "No repitas el mismo docente en el tribunal.";

      rows.forEach((r, idx) => {
        if (!r.id_estudiante) e[`row_${idx}_id_estudiante`] = "Seleccione estudiante.";
        if (!r.id_franja_horario) e[`row_${idx}_id_franja_horario`] = "Seleccione franja.";
      });
    }
    return e;
  }

  function addRow() {
    setRows((prev) => [...prev, { key: uid(), id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" }]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((x) => x.key !== key));
  }

  function updateRow(key: string, patch: Partial<AsigRow>) {
    setRows((prev) => prev.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  }

  const selectedDocenteLabels = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of docentesOptions) map.set(d.id, d.label);

    return {
      p: form.presidente ? map.get(Number(form.presidente)) ?? "—" : "—",
      i1: form.integrante1 ? map.get(Number(form.integrante1)) ?? "—" : "—",
      i2: form.integrante2 ? map.get(Number(form.integrante2)) ?? "—" : "—",
    };
  }, [docentesOptions, form.presidente, form.integrante1, form.integrante2]);

  async function handleSubmit() {
    // ✅ SI VIENES DE TU PAGE: NO REVALIDAMOS AQUÍ, tu Page ya valida y guarda con onSaveTribunal()
    if (compat) {
      await props.onSave();
      return;
    }

    // ✅ MODO NUEVO
    const e = validateNewPropsOnly();
    setErrors(e);
    if (Object.keys(e).length) {
      showToast("Revisa el formulario.", "error");
      return;
    }

    const base = {
      id_carrera_periodo: Number(props.selectedCP),
      nombre_tribunal: form.nombre_tribunal.trim(),
      descripcion_tribunal: form.descripcion_tribunal.trim() || undefined,
      docentes: {
        presidente: Number(form.presidente),
        integrante1: Number(form.integrante1),
        integrante2: Number(form.integrante2),
      },
    };

    const payload = (isEdit ? (base as TribunalUpdateDTO) : (base as TribunalCreateDTO)) as
      | TribunalCreateDTO
      | TribunalUpdateDTO;

    await props.onSubmit(payload, rows);
  }

  if (!open) return null;

  const cpLabel = compat ? props.selectedCPLabel : "";

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard tribunalFormCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <h3 className="modalTitle">{isEdit ? "Editar Tribunal" : "Crear Tribunal"}</h3>
            <p className="tfSub">
              {cpLabel ? (
                <>
                  <b>{cpLabel}</b> — Docentes del tribunal + plantilla opcional (estudiante/franja).
                </>
              ) : (
                <>Docentes del tribunal + plantilla opcional de asignaciones (estudiante/franja).</>
              )}
            </p>
          </div>

          <button className="btnClose" onClick={onClose} type="button" aria-label="Cerrar" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        <div className="modalBody">
          <div className="tfGrid">
            <div className="field tfFull">
              <label className="fieldLabel">Nombre del tribunal</label>
              <input
                className="input"
                value={form.nombre_tribunal}
                onChange={(e) => setForm((p) => ({ ...p, nombre_tribunal: e.target.value }))}
                placeholder="Ej: Tribunal 1"
                disabled={saving}
              />
              {errors.nombre_tribunal ? <p className="error">{errors.nombre_tribunal}</p> : null}
            </div>

            <div className="field tfFull">
              <label className="fieldLabel">Descripción (opcional)</label>
              <textarea
                className="textarea"
                rows={3}
                value={form.descripcion_tribunal}
                onChange={(e) => setForm((p) => ({ ...p, descripcion_tribunal: e.target.value }))}
                placeholder="Descripción del tribunal..."
                disabled={saving}
              />
            </div>

            <div className="field">
              <label className="fieldLabel">Presidente</label>
              <select
                className="select"
                value={form.presidente}
                onChange={(e) => setForm((p) => ({ ...p, presidente: e.target.value ? Number(e.target.value) : "" }))}
                disabled={saving}
              >
                <option value="">Seleccione...</option>
                {docentesOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.presidente ? <p className="error">{errors.presidente}</p> : null}
            </div>

            <div className="field">
              <label className="fieldLabel">Integrante 1</label>
              <select
                className="select"
                value={form.integrante1}
                onChange={(e) => setForm((p) => ({ ...p, integrante1: e.target.value ? Number(e.target.value) : "" }))}
                disabled={saving}
              >
                <option value="">Seleccione...</option>
                {docentesOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.integrante1 ? <p className="error">{errors.integrante1}</p> : null}
            </div>

            <div className="field">
              <label className="fieldLabel">Integrante 2</label>
              <select
                className="select"
                value={form.integrante2}
                onChange={(e) => setForm((p) => ({ ...p, integrante2: e.target.value ? Number(e.target.value) : "" }))}
                disabled={saving}
              >
                <option value="">Seleccione...</option>
                {docentesOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              {errors.integrante2 ? <p className="error">{errors.integrante2}</p> : null}
            </div>

            {errors.docentes ? <p className="error tfFull">{errors.docentes}</p> : null}

            <div className="tfResume tfFull">
              <div className="tfResumeTitle">Resumen de docentes</div>
              <div className="tfResumeRow">
                <span>Presidente:</span> <b>{selectedDocenteLabels.p}</b>
              </div>
              <div className="tfResumeRow">
                <span>Integrante 1:</span> <b>{selectedDocenteLabels.i1}</b>
              </div>
              <div className="tfResumeRow">
                <span>Integrante 2:</span> <b>{selectedDocenteLabels.i2}</b>
              </div>
            </div>

            {/* PLANTILLA */}
            <div className="tfSection tfFull">
              <div className="tfSectionHead">
                <div>
                  <div className="tfSectionTitle">Plantilla (opcional)</div>
                  <div className="tfSectionSub">
                    Listas vienen de módulos por Carrera–Período. Aquí solo pre-armas filas.
                  </div>
                </div>

                <button className="tfBtnAdd" type="button" onClick={addRow} disabled={saving}>
                  <Plus size={18} /> Añadir fila
                </button>
              </div>

              {rows.length === 0 ? (
                <div className="tfEmpty">No has agregado filas. Puedes guardar el tribunal solo con docentes.</div>
              ) : (
                <div className="tfTableWrap">
                  <table className="tfTable">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Franja</th>
                        <th>Caso (opcional)</th>
                        <th style={{ width: 70 }}></th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={r.key}>
                          <td>
                            <select
                              className="select"
                              value={r.id_estudiante}
                              onChange={(e) =>
                                updateRow(r.key, { id_estudiante: e.target.value ? Number(e.target.value) : "" })
                              }
                              disabled={saving}
                            >
                              <option value="">Seleccione...</option>
                              {estudiantesOptions.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {errors[`row_${idx}_id_estudiante`] ? (
                              <p className="error">{errors[`row_${idx}_id_estudiante`]}</p>
                            ) : null}
                          </td>

                          <td>
                            <select
                              className="select"
                              value={r.id_franja_horario}
                              onChange={(e) =>
                                updateRow(r.key, {
                                  id_franja_horario: e.target.value ? Number(e.target.value) : "",
                                })
                              }
                              disabled={saving}
                            >
                              <option value="">Seleccione...</option>
                              {franjasOptions.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {errors[`row_${idx}_id_franja_horario`] ? (
                              <p className="error">{errors[`row_${idx}_id_franja_horario`]}</p>
                            ) : null}
                          </td>

                          <td>
                            <select
                              className="select"
                              value={r.id_caso_estudio ?? ""}
                              onChange={(e) =>
                                updateRow(r.key, { id_caso_estudio: e.target.value ? Number(e.target.value) : "" })
                              }
                              disabled={saving}
                            >
                              <option value="">(Opcional) Seleccione caso...</option>
                              {casosOptions.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.label}
                                </option>
                              ))}
                            </select>

                            {r.id_caso_estudio ? (
                              <div className="tfHint">
                                <FileText size={14} /> Se verá/descargará en “Ver Tribunal” si el backend lo guarda en la
                                asignación.
                              </div>
                            ) : (
                              <div className="tfHint">
                                Caso no es del estudiante. Si tu backend lo asigna después, se mostrará igual en “Ver”.
                              </div>
                            )}
                          </td>

                          <td style={{ textAlign: "center" }}>
                            <button
                              className="tfBtnTrash"
                              type="button"
                              onClick={() => removeRow(r.key)}
                              disabled={saving}
                              title="Quitar fila"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="tfFoot">
                    * El caso aquí es solo plantilla. Lo real debe quedar en <b>tribunal_estudiante</b>.
                  </div>
                </div>
              )}

              {/* hint si no pasaste listas (tu page todavía no las pasa) */}
              {rows.length > 0 && (estudiantes.length === 0 || franjas.length === 0) ? (
                <div className="tfFoot" style={{ marginTop: 8, opacity: 0.8 }}>
                  Nota: aún no estás pasando <b>estudiantes/franjas/casos</b> al modal desde el Page; por eso los selects pueden salir vacíos.
                </div>
              ) : null}
            </div>

            <div className="tfFull">
              <button className="tfBtnSave" type="button" onClick={handleSubmit} disabled={saving}>
                <Save size={18} /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear tribunal"}
              </button>
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose} disabled={saving} type="button">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
