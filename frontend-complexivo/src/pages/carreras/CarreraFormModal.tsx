import type { Carrera } from "../../types/carrera";
import type { Departamento } from "../../types/departamento";

const MODALIDADES = ["EN LÍNEA", "PRESENCIAL"];
const SEDES = [
  "Sangolquí (Matriz)",
  "Latacunga",
  "Santo Domingo",
  "IASA Sangolquí",
];

interface Props {
  open: boolean;
  editingCarrera: Carrera | null;
  departamentos: Departamento[];
  form: any;
  setForm: (v: any) => void;
  errors: Record<string, string>;
  setErrors: (e: any) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
}

export default function CarreraFormModal({
  open,
  editingCarrera,
  departamentos,
  form,
  setForm,
  errors,
  setErrors,
  onClose,
  onSave,
}: Props) {
  if (!open) return null;

  return (
    <div className="modalOverlay">
      <div className="modal">
        <div className="modalHeader">
          <div className="modalTitle">
            {editingCarrera ? "Editar carrera" : "Nueva carrera"}
          </div>
          <button className="modalClose" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modalBody">
          <label className="label">Nombre *</label>
          <input
            className={`input ${errors.nombre_carrera ? "input-error" : ""}`}
            value={form.nombre_carrera}
            onChange={(e) =>
              setForm({ ...form, nombre_carrera: e.target.value })
            }
          />

          <label className="label">Código *</label>
          <input
            className={`input ${errors.codigo_carrera ? "input-error" : ""}`}
            value={form.codigo_carrera}
            onChange={(e) =>
              setForm({ ...form, codigo_carrera: e.target.value })
            }
          />

          <label className="label">Departamento *</label>
          <select
            className="select"
            value={form.id_departamento}
            onChange={(e) =>
              setForm({ ...form, id_departamento: e.target.value })
            }
          >
            <option value="">Seleccione</option>
            {departamentos.map((d) => (
              <option key={d.id_departamento} value={d.id_departamento}>
                {d.nombre_departamento}
              </option>
            ))}
          </select>

          <label className="label">Modalidad *</label>
          <select
            className="select"
            value={form.modalidad}
            onChange={(e) =>
              setForm({ ...form, modalidad: e.target.value })
            }
          >
            <option value="">Seleccione</option>
            {MODALIDADES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <label className="label">Sede *</label>
          <select
            className="select"
            value={form.sede}
            onChange={(e) => setForm({ ...form, sede: e.target.value })}
          >
            <option value="">Seleccione</option>
            {SEDES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <label className="label">Descripción</label>
          <textarea
            className="textarea"
            value={form.descripcion_carrera}
            onChange={(e) =>
              setForm({
                ...form,
                descripcion_carrera: e.target.value,
              })
            }
          />
        </div>

        <div className="modalFooter">
          <button className="btnGhost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btnPrimary" onClick={onSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
