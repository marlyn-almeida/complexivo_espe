import type { Carrera } from "../../types/carrera";
import type { Departamento } from "../../types/departamento";
import { X, Save } from "lucide-react";

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

    // limpia error del campo
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
            {editingCarrera ? "Editar carrera" : "Agregar Nueva Carrera"}
          </div>

          <button className="modalClose" onClick={onClose} disabled={loading} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modalDivider" />

        <div className="modalBody">
          <div className="formGrid">
            {/* NOMBRE */}
            <div className="formField">
              <label className="label">
                Nombre de la carrera <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.nombre_carrera ? "inputError" : ""}`}
                value={form.nombre_carrera}
                onChange={(e) => setField("nombre_carrera", e.target.value)}
                placeholder="Ej: Tecnologías de la Información"
                disabled={loading}
              />
              {errors.nombre_carrera ? <div className="fieldError">{errors.nombre_carrera}</div> : null}
            </div>

            {/* CÓDIGO */}
            <div className="formField">
              <label className="label">
                Código <span className="req">*</span>
              </label>
              <input
                className={`input ${errors.codigo_carrera ? "inputError" : ""}`}
                value={form.codigo_carrera}
                onChange={(e) => setField("codigo_carrera", normalizeCodigo(e.target.value))}
                placeholder="Ej: TI_EN_LINEA"
                disabled={loading}
              />
              {errors.codigo_carrera ? <div className="fieldError">{errors.codigo_carrera}</div> : null}
              {!errors.codigo_carrera ? <div className="helperText">Tip: se normaliza automáticamente (mayúsculas y “_”).</div> : null}
            </div>

            {/* DEPARTAMENTO */}
            <div className="formField">
              <label className="label">
                Departamento <span className="req">*</span>
              </label>
              <select
                className={`select ${errors.id_departamento ? "inputError" : ""}`}
                value={form.id_departamento}
                onChange={(e) => setField("id_departamento", e.target.value)}
                disabled={loading}
              >
                <option value="">--Seleccione un Departamento--</option>
                {departamentos.map((d) => (
                  <option key={d.id_departamento} value={String(d.id_departamento)}>
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
              {errors.id_departamento ? <div className="fieldError">{errors.id_departamento}</div> : null}
            </div>

            {/* MODALIDAD */}
            <div className="formField">
              <label className="label">
                Modalidad <span className="req">*</span>
              </label>
              <select
                className={`select ${errors.modalidad ? "inputError" : ""}`}
                value={form.modalidad}
                onChange={(e) => setField("modalidad", e.target.value)}
                disabled={loading}
              >
                <option value="">--Seleccione Modalidad--</option>
                {modalidades.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {errors.modalidad ? <div className="fieldError">{errors.modalidad}</div> : null}
            </div>

            {/* SEDE */}
            <div className="formField">
              <label className="label">
                Sede <span className="req">*</span>
              </label>
              <select
                className={`select ${errors.sede ? "inputError" : ""}`}
                value={form.sede}
                onChange={(e) => setField("sede", e.target.value)}
                disabled={loading}
              >
                <option value="">--Seleccione Sede--</option>
                {sedes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.sede ? <div className="fieldError">{errors.sede}</div> : null}
            </div>

            {/* DESCRIPCIÓN */}
            <div className="formField formFieldFull">
              <label className="label">Descripción</label>
              <textarea
                className={`textarea ${errors.descripcion_carrera ? "inputError" : ""}`}
                value={form.descripcion_carrera}
                onChange={(e) => setField("descripcion_carrera", e.target.value)}
                placeholder="Breve descripción (opcional)"
                disabled={loading}
              />
              {errors.descripcion_carrera ? <div className="fieldError">{errors.descripcion_carrera}</div> : null}
            </div>
          </div>

          <div className="modalActions">
            <button className="btnSecondary" onClick={onClose} disabled={loading}>
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
              title="Guardar"
            >
              <Save size={18} /> {editingCarrera ? "Actualizar Carrera" : "Guardar Carrera"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
