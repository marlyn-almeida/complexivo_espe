// src/components/carreras/CarreraFormModal.tsx
import type { Carrera } from "../../types/carrera";
import type { Departamento } from "../../types/departamento";
import { GraduationCap, Save, X } from "lucide-react";

type CarreraFormState = {
  nombre_carrera: string;
  codigo_carrera: string;
  descripcion_carrera: string;
  id_departamento: string;
  modalidad: string;
  sede: string;
};

export default function CarreraFormModal(props: {
  open: boolean;
  loading: boolean;
  departamentos: Departamento[];
  form: CarreraFormState;
  setForm: (v: CarreraFormState) => void;
  errors: Record<string, string>;
  setErrors: (v: Record<string, string>) => void;
  editingCarrera: Carrera | null;
  onClose: () => void;
  onSave: () => void;
  showToast: (msg: string, type?: "success" | "error" | "info") => void;
  modalidades: string[];
  sedes: string[];
}) {
  const {
    open,
    loading,
    departamentos,
    form,
    setForm,
    errors,
    setErrors,
    editingCarrera,
    onClose,
    onSave,
    showToast,
    modalidades,
    sedes,
  } = props;

  if (!open) return null;

  function setField<K extends keyof CarreraFormState>(k: K, value: CarreraFormState[K]) {
    setForm({ ...form, [k]: value });
    if (errors[k]) {
      const copy = { ...errors };
      delete copy[k];
      setErrors(copy);
    }
  }

  function normalizeCodigo(raw: string) {
    return raw
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
      .slice(0, 30);
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modalCard">
        <div className="modalHead">
          <div className="modalTitle">
            <span className="modalTitleIcon">
              <GraduationCap className="iconSm" />
            </span>
            {editingCarrera ? "Editar carrera" : "Nueva carrera"}
          </div>

          <button className="modalClose" onClick={onClose} disabled={loading} aria-label="Cerrar">
            <X className="iconSm" />
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          <div className="formRow">
            <label className="label">
              Nombre de la carrera <span className="req">*</span>
            </label>
            <input
              className="input"
              value={form.nombre_carrera}
              onChange={(e) => setField("nombre_carrera", e.target.value)}
              placeholder="Ej: Tecnologías de la Información"
              disabled={loading}
              style={errors.nombre_carrera ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
            />
            {errors.nombre_carrera && <div className="fieldError">{errors.nombre_carrera}</div>}
          </div>

          <div className="formRow">
            <label className="label">
              Código <span className="req">*</span>
            </label>
            <input
              className="input"
              value={form.codigo_carrera}
              onChange={(e) => setField("codigo_carrera", normalizeCodigo(e.target.value))}
              placeholder="Ej: TI_EN_LINEA"
              disabled={loading}
              style={errors.codigo_carrera ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
            />
            <div className="helperText">Tip: se normaliza automáticamente (mayúsculas y “_”).</div>
            {errors.codigo_carrera && <div className="fieldError">{errors.codigo_carrera}</div>}
          </div>

          <div className="formRow">
            <label className="label">
              Departamento <span className="req">*</span>
            </label>
            <select
              className="input"
              value={form.id_departamento}
              onChange={(e) => setField("id_departamento", e.target.value)}
              disabled={loading}
              style={errors.id_departamento ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
            >
              <option value="">Seleccione</option>
              {departamentos.map((d) => (
                <option key={d.id_departamento} value={d.id_departamento}>
                  {d.nombre_departamento}
                </option>
              ))}
            </select>
            {errors.id_departamento && <div className="fieldError">{errors.id_departamento}</div>}
          </div>

          <div className="formRow">
            <label className="label">
              Modalidad <span className="req">*</span>
            </label>
            <select
              className="input"
              value={form.modalidad}
              onChange={(e) => setField("modalidad", e.target.value)}
              disabled={loading}
              style={errors.modalidad ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
            >
              <option value="">Seleccione</option>
              {modalidades.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.modalidad && <div className="fieldError">{errors.modalidad}</div>}
          </div>

          <div className="formRow">
            <label className="label">
              Sede <span className="req">*</span>
            </label>
            <select
              className="input"
              value={form.sede}
              onChange={(e) => setField("sede", e.target.value)}
              disabled={loading}
              style={errors.sede ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
            >
              <option value="">Seleccione</option>
              {sedes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.sede && <div className="fieldError">{errors.sede}</div>}
          </div>

          <div className="formRow">
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              value={form.descripcion_carrera}
              onChange={(e) => setField("descripcion_carrera", e.target.value)}
              placeholder="Breve descripción (opcional)"
              disabled={loading}
            />
          </div>

          <div className="modalActions">
            <button className="btnGhost" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            <button
              className="btnPrimary"
              onClick={() => {
                if (!form.nombre_carrera.trim() || !form.codigo_carrera.trim() || !form.id_departamento || !form.modalidad || !form.sede) {
                  showToast("Completa los campos obligatorios.", "error");
                }
                onSave();
              }}
              disabled={loading}
            >
              <Save className="iconSm" /> Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
