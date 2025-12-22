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
  getDepartamentoNombre: (id: number) => string;
  modalidades: string[];
  sedes: string[];
}) {
  const {
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

  function setField<K extends keyof CarreraFormState>(k: K, value: CarreraFormState[K]) {
    setForm({ ...form, [k]: value });
    if (errors[k]) {
      const copy = { ...errors };
      delete copy[k];
      setErrors(copy);
    }
  }

  // ✅ Normaliza el código sin forzarte un texto feo:
  // - convierte a MAYÚSCULAS
  // - cambia espacios por _
  // - elimina caracteres raros
  function normalizeCodigo(raw: string) {
    return raw
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "")
      .slice(0, 30);
  }

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true">
      <div className="modal modalPro">
        <div className="modalHeader">
          <div className="modalTitle">
            {editingCarrera ? "Editar carrera" : "Nueva carrera"}
          </div>

          <button className="modalClose" onClick={onClose} disabled={loading} title="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="modalBody modalGrid">
          {/* NOMBRE */}
          <div className="field">
            <label className="label">Nombre de la carrera *</label>
            <input
              className={`input ${errors.nombre_carrera ? "input-error" : ""}`}
              value={form.nombre_carrera}
              onChange={(e) => setField("nombre_carrera", e.target.value)}
              placeholder="Ej: Tecnologías de la Información"
              disabled={loading}
            />
            {errors.nombre_carrera ? <div className="field-error">{errors.nombre_carrera}</div> : null}
          </div>

          {/* CÓDIGO */}
          <div className="field">
            <label className="label">Código *</label>
            <input
              className={`input ${errors.codigo_carrera ? "input-error" : ""}`}
              value={form.codigo_carrera}
              onChange={(e) => setField("codigo_carrera", normalizeCodigo(e.target.value))}
              placeholder="Ej: TI_EN_LINEA"
              disabled={loading}
            />
            {errors.codigo_carrera ? <div className="field-error">{errors.codigo_carrera}</div> : null}
            {!errors.codigo_carrera ? (
              <div className="field-help">
                Tip: se normaliza automáticamente (mayúsculas y “_”).
              </div>
            ) : null}
          </div>

          {/* DEPARTAMENTO */}
          <div className="field">
            <label className="label">Departamento *</label>
            <select
              className={`select ${errors.id_departamento ? "input-error" : ""}`}
              value={form.id_departamento}
              onChange={(e) => setField("id_departamento", e.target.value)}
              disabled={loading}
            >
              <option value="">Seleccione</option>
              {departamentos.map((d) => (
                <option key={d.id_departamento} value={d.id_departamento}>
                  {d.nombre_departamento}
                </option>
              ))}
            </select>
            {errors.id_departamento ? <div className="field-error">{errors.id_departamento}</div> : null}
          </div>

          {/* MODALIDAD */}
          <div className="field">
            <label className="label">Modalidad *</label>
            <select
              className={`select ${errors.modalidad ? "input-error" : ""}`}
              value={form.modalidad}
              onChange={(e) => setField("modalidad", e.target.value)}
              disabled={loading}
            >
              <option value="">Seleccione</option>
              {modalidades.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.modalidad ? <div className="field-error">{errors.modalidad}</div> : null}
          </div>

          {/* SEDE */}
          <div className="field">
            <label className="label">Sede *</label>
            <select
              className={`select ${errors.sede ? "input-error" : ""}`}
              value={form.sede}
              onChange={(e) => setField("sede", e.target.value)}
              disabled={loading}
            >
              <option value="">Seleccione</option>
              {sedes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.sede ? <div className="field-error">{errors.sede}</div> : null}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="field fieldFull">
            <label className="label">Descripción</label>
            <textarea
              className={`textarea ${errors.descripcion_carrera ? "input-error" : ""}`}
              value={form.descripcion_carrera}
              onChange={(e) => setField("descripcion_carrera", e.target.value)}
              placeholder="Breve descripción (opcional)"
              disabled={loading}
            />
            {errors.descripcion_carrera ? (
              <div className="field-error">{errors.descripcion_carrera}</div>
            ) : null}
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          <button
            className="btnPrimary"
            onClick={() => {
              // UX: si falta algo, avisa con toast rápido además del rojo
              if (!form.nombre_carrera.trim() || !form.codigo_carrera.trim() || !form.id_departamento || !form.modalidad || !form.sede) {
                showToast("Completa los campos obligatorios.", "error");
              }
              onSave();
            }}
            disabled={loading}
            title="Guardar"
          >
            <Save size={18} /> Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
