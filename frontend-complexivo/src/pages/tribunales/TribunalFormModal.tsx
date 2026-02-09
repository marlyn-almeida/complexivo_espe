// ✅ src/pages/tribunales/TribunalFormModal.tsx
import { useEffect, useMemo } from "react";
import { X, Users, ToggleLeft, ToggleRight, Info, Save } from "lucide-react";

import type { Tribunal } from "../../types/tribunal";
import type { Estudiante } from "../../types/estudiante";
import type { FranjaHorario } from "../../types/franjaHoraria";
import type { CasoEstudio } from "../../types/casoEstudio";
import type { CarreraDocente } from "../../types/carreraDocente";

import "./TribunalFormModal.css";

type ToastType = "success" | "error" | "info";

/** ✅ Docentes del tribunal */
export type TribunalFormState = {
  nombre_tribunal: string;
  descripcion_tribunal: string;
  presidente: number | "";
  integrante1: number | "";
  integrante2: number | "";
};

/** ✅ Modo Individual: asignación obligatoria (estudiante + franja + caso) */
export type TribunalIndividualState = {
  id_estudiante: number | "";
  id_franja_horario: number | "";
  id_caso_estudio: number | "";
};

type CompatProps = {
  open: boolean;
  onClose: () => void;

  // desde TribunalesPage
  editing: Tribunal | null;
  docentes: CarreraDocente[];
  selectedCPLabel: string;

  tribunalForm: TribunalFormState;
  setTribunalForm: React.Dispatch<React.SetStateAction<TribunalFormState>>;

  // ✅ modo + form individual desde el Page
  modoIndividual: boolean;
  setModoIndividual: React.Dispatch<React.SetStateAction<boolean>>;

  individualForm: TribunalIndividualState;
  setIndividualForm: React.Dispatch<React.SetStateAction<TribunalIndividualState>>;

  // ✅ listas obligatorias
  estudiantes: Estudiante[];
  franjas: FranjaHorario[];
  casos: CasoEstudio[];

  // errores desde el Page
  formErrors: Record<string, string>;
  saving: boolean;

  onSave: () => Promise<void>;

  // (opcional) toast lo maneja page
  showToast?: (msg: string, type?: ToastType) => void;
};

type Props = CompatProps;

export default function TribunalFormModal(props: Props) {
  const {
    open,
    onClose,
    saving,

    editing,
    docentes,
    selectedCPLabel,

    tribunalForm,
    setTribunalForm,

    modoIndividual,
    setModoIndividual,

    individualForm,
    setIndividualForm,

    estudiantes,
    franjas,
    casos,

    formErrors,
    onSave,
  } = props;

  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;

    // cuando abres en CREATE, limpia individuales (pero deja el modo como esté)
    if (!isEdit) {
      setIndividualForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
    }
  }, [open, isEdit, setIndividualForm]);

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
      numero: c.numero_caso ?? c.caso_numero ?? "",
      titulo: c.titulo ?? c.titulo_caso ?? "",
      label: `Caso ${c.numero_caso ?? c.caso_numero ?? "?"}${(c.titulo ?? c.titulo_caso) ? ` — ${c.titulo ?? c.titulo_caso}` : ""}`,
    }));
  }, [casos]);

  const selectedDocenteLabels = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of docentesOptions) map.set(d.id, d.label);

    return {
      p: tribunalForm.presidente ? map.get(Number(tribunalForm.presidente)) ?? "—" : "—",
      i1: tribunalForm.integrante1 ? map.get(Number(tribunalForm.integrante1)) ?? "—" : "—",
      i2: tribunalForm.integrante2 ? map.get(Number(tribunalForm.integrante2)) ?? "—" : "—",
    };
  }, [docentesOptions, tribunalForm.presidente, tribunalForm.integrante1, tribunalForm.integrante2]);

  if (!open) return null;

  const toggleMode = () => {
    setModoIndividual((v) => {
      const next = !v;

      // ✅ si cambias a plantilla, limpiamos el form individual para que no quede “guardado”
      if (!next) {
        setIndividualForm({ id_estudiante: "", id_franja_horario: "", id_caso_estudio: "" });
      }

      return next;
    });
  };

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard tribunalFormCard" onMouseDown={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modalHeader">
          <div>
            <h3 className="modalTitle">{isEdit ? "Editar Tribunal" : "Crear Tribunal"}</h3>
            <p className="tfSub">
              {selectedCPLabel ? (
                <>
                  <b>{selectedCPLabel}</b> — Define docentes y (opcionalmente) crea en modo individual.
                </>
              ) : (
                <>Define docentes y (opcionalmente) crea en modo individual.</>
              )}
            </p>
          </div>

          <button className="btnClose" onClick={onClose} type="button" aria-label="Cerrar" disabled={saving}>
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="modalBody">
          {/* ✅ MODO */}
          {!isEdit ? (
            <div className="tfModeCard">
              <button
                type="button"
                className="tfModeSwitch"
                onClick={toggleMode}
                disabled={saving}
                aria-label="Cambiar modo"
                title="Cambiar modo"
              >
                {modoIndividual ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>

              <div className="tfModeText">
                <div className="tfModeTitle">
                  <Users size={16} />
                  {modoIndividual
                    ? "Modo Individual: Crear tribunal para un estudiante específico"
                    : "Modo Plantilla: Crear tribunal base para asignar múltiples estudiantes"}
                </div>

                <div className="tfModeSub">
                  {modoIndividual
                    ? "Selecciona estudiante, franja y caso (obligatorio)."
                    : "Crea el tribunal con docentes. Luego asigna estudiantes en el módulo de Asignaciones."}
                </div>

                {!modoIndividual ? (
                  <div className="tfModeHint">
                    <Info size={16} />
                    En modo plantilla, podrás asignar múltiples estudiantes desde “Asignaciones”.
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="tfGrid">
            {/* Nombre */}
            <div className="field tfFull">
              <label className="fieldLabel">Nombre del tribunal</label>
              <input
                className="input"
                value={tribunalForm.nombre_tribunal}
                onChange={(e) => setTribunalForm((p) => ({ ...p, nombre_tribunal: e.target.value }))}
                placeholder="Ej: Tribunal 1"
                disabled={saving}
              />
              {formErrors.nombre_tribunal ? <p className="error">{formErrors.nombre_tribunal}</p> : null}
            </div>

            {/* Descripción */}
            <div className="field tfFull">
              <label className="fieldLabel">Descripción (opcional)</label>
              <textarea
                className="textarea"
                rows={3}
                value={tribunalForm.descripcion_tribunal}
                onChange={(e) => setTribunalForm((p) => ({ ...p, descripcion_tribunal: e.target.value }))}
                placeholder="Descripción del tribunal..."
                disabled={saving}
              />
            </div>

            {/* Docentes */}
            <div className="tfSection tfFull">
              <div className="tfSectionHead">
                <div className="tfSectionTitleRow">
                  <Users size={18} />
                  <div>
                    <div className="tfSectionTitle">Miembros del Tribunal</div>
                    <div className="tfSectionSub">Seleccione Presidente e Integrantes (sin repetir).</div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 12 }}>
                <div className="tfGrid3">
                  <div className="field">
                    <label className="fieldLabel">Presidente</label>
                    <select
                      className="select"
                      value={tribunalForm.presidente}
                      onChange={(e) =>
                        setTribunalForm((p) => ({ ...p, presidente: e.target.value ? Number(e.target.value) : "" }))
                      }
                      disabled={saving}
                    >
                      <option value="">Seleccione...</option>
                      {docentesOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.presidente ? <p className="error">{formErrors.presidente}</p> : null}
                  </div>

                  <div className="field">
                    <label className="fieldLabel">Integrante 1</label>
                    <select
                      className="select"
                      value={tribunalForm.integrante1}
                      onChange={(e) =>
                        setTribunalForm((p) => ({ ...p, integrante1: e.target.value ? Number(e.target.value) : "" }))
                      }
                      disabled={saving}
                    >
                      <option value="">Seleccione...</option>
                      {docentesOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.integrante1 ? <p className="error">{formErrors.integrante1}</p> : null}
                  </div>

                  <div className="field">
                    <label className="fieldLabel">Integrante 2</label>
                    <select
                      className="select"
                      value={tribunalForm.integrante2}
                      onChange={(e) =>
                        setTribunalForm((p) => ({ ...p, integrante2: e.target.value ? Number(e.target.value) : "" }))
                      }
                      disabled={saving}
                    >
                      <option value="">Seleccione...</option>
                      {docentesOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                    {formErrors.integrante2 ? <p className="error">{formErrors.integrante2}</p> : null}
                  </div>
                </div>

                {formErrors.docentes ? <p className="error" style={{ marginTop: 8 }}>{formErrors.docentes}</p> : null}

                {/* Resumen */}
                <div className="tfResume" style={{ marginTop: 12 }}>
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
              </div>
            </div>

            {/* ✅ MODO INDIVIDUAL */}
            {!isEdit && modoIndividual ? (
              <div className="tfSection tfFull">
                <div className="tfSectionHead">
                  <div className="tfSectionTitleRow">
                    <Info size={18} />
                    <div>
                      <div className="tfSectionTitle">Datos del Tribunal (Modo Individual)</div>
                      <div className="tfSectionSub">Aquí el caso es obligatorio.</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: 12 }}>
                  <div className="tfGrid2">
                    <div className="field">
                      <label className="fieldLabel">Estudiante</label>
                      <select
                        className="select"
                        value={individualForm.id_estudiante}
                        onChange={(e) =>
                          setIndividualForm((p) => ({
                            ...p,
                            id_estudiante: e.target.value ? Number(e.target.value) : "",
                          }))
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
                      {formErrors.id_estudiante ? <p className="error">{formErrors.id_estudiante}</p> : null}
                    </div>

                    <div className="field">
                      <label className="fieldLabel">Caso de estudio</label>
                      <select
                        className="select"
                        value={individualForm.id_caso_estudio}
                        onChange={(e) =>
                          setIndividualForm((p) => ({
                            ...p,
                            id_caso_estudio: e.target.value ? Number(e.target.value) : "",
                          }))
                        }
                        disabled={saving}
                      >
                        <option value="">Seleccione...</option>
                        {casosOptions.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {formErrors.id_caso_estudio ? <p className="error">{formErrors.id_caso_estudio}</p> : null}
                    </div>

                    <div className="field tfFull">
                      <label className="fieldLabel">Franja horaria</label>
                      <select
                        className="select"
                        value={individualForm.id_franja_horario}
                        onChange={(e) =>
                          setIndividualForm((p) => ({
                            ...p,
                            id_franja_horario: e.target.value ? Number(e.target.value) : "",
                          }))
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
                      {formErrors.id_franja_horario ? <p className="error">{formErrors.id_franja_horario}</p> : null}
                    </div>
                  </div>

                  <div className="tfInfoBox" style={{ marginTop: 12 }}>
                    <Info size={18} />
                    Importante: Los horarios no pueden solaparse en el mismo laboratorio y fecha. Puede haber múltiples
                    tribunales a la misma hora si son laboratorios diferentes.
                  </div>
                </div>
              </div>
            ) : null}

            {/* GUARDAR */}
            <div className="tfFull">
              <button className="tfBtnSave" type="button" onClick={onSave} disabled={saving}>
                <Save size={18} /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Guardar Tribunal"}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose} disabled={saving} type="button">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
