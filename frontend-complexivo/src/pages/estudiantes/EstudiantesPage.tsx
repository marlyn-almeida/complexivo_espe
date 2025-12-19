import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Estudiante } from "../../types/estudiante";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { estudiantesService } from "../../services/estudiantes.service";

type FormState = {
  cedula: string;
  nombres: string;
  apellidos: string;
};

export default function EstudiantesPage() {
  const [cpList, setCpList] = useState<CarreraPeriodo[]>([]);
  const [cpId, setCpId] = useState<number | null>(null);

  const [items, setItems] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Estudiante | null>(null);
  const [form, setForm] = useState<FormState>({ cedula: "", nombres: "", apellidos: "" });

  const isActive = (e: Estudiante) => Boolean(e.estado);

  const loadCarreraPeriodos = async () => {
    setLoading(true);
    try {
      const data = await carreraPeriodoService.list();
      setCpList(data);

      // Selecciona uno por defecto: primero activo, sino el primero
      const first = data.find((x) => Boolean(x.estado)) ?? data[0];
      if (first) setCpId(first.id_carrera_periodo);
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async (idCarreraPeriodo: number) => {
    setLoading(true);
    try {
      const data = await estudiantesService.listByCarreraPeriodo(idCarreraPeriodo);
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarreraPeriodos();
  }, []);

  useEffect(() => {
    if (cpId) loadEstudiantes(cpId);
  }, [cpId]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((e) => {
      const full = `${e.nombres ?? ""} ${e.apellidos ?? ""}`.toLowerCase();
      const ci = (e.cedula ?? "").toLowerCase();
      return full.includes(query) || ci.includes(query);
    });
  }, [items, q]);

  const currentCpLabel = useMemo(() => {
    const current = cpList.find((x) => x.id_carrera_periodo === cpId);
    if (!current) return "Seleccione Carrera – Período";

    const cn = current.carrera_nombre ?? "Carrera";
    const pn = current.periodo_nombre ?? "Período";
    return `${cn} – ${pn}`;
  }, [cpList, cpId]);

  const openCreate = () => {
    if (!cpId) return alert("Selecciona una Carrera–Período primero.");
    setEditing(null);
    setForm({ cedula: "", nombres: "", apellidos: "" });
    setOpen(true);
  };

  const openEdit = (e: Estudiante) => {
    setEditing(e);
    setForm({
      cedula: e.cedula ?? "",
      nombres: e.nombres ?? "",
      apellidos: e.apellidos ?? "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    if (!cpId) return "Selecciona una Carrera–Período.";
    if (!form.cedula.trim()) return "La cédula es obligatoria.";
    if (!form.nombres.trim()) return "Los nombres son obligatorios.";
    if (!form.apellidos.trim()) return "Los apellidos son obligatorios.";
    return null;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      const payload = {
        cedula: form.cedula.trim(),
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        id_carrera_periodo: cpId!,
      };

      if (editing) {
        await estudiantesService.update(editing.id_estudiante, payload);
      } else {
        await estudiantesService.create(payload);
      }

      await loadEstudiantes(cpId!);
      closeModal();
    } catch {
      alert("No se pudo guardar el estudiante. Revisa consola/servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (e: Estudiante) => {
    const action = isActive(e) ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que deseas ${action} a "${e.nombres} ${e.apellidos}"?`)) return;

    setLoading(true);
    try {
      await estudiantesService.toggleEstado(e.id_estudiante);
      await loadEstudiantes(cpId!);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-espeDark">Estudiantes</h1>
          <p className="text-xs text-slate-500">
            Gestión de estudiantes habilitados por Carrera–Período.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {/* Selector Carrera-Periodo */}
          <select
            value={cpId ?? ""}
            onChange={(e) => setCpId(e.target.value ? Number(e.target.value) : null)}
            className="w-full md:w-96 rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
          >
            <option value="">{currentCpLabel}</option>
            {cpList.map((cp) => (
              <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                {(cp.carrera_nombre ?? "Carrera")} – {(cp.periodo_nombre ?? "Período")}
              </option>
            ))}
          </select>

          {/* Buscar */}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cédula o nombre..."
            className="w-full md:w-72 rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
          />

          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            + Nuevo
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg bg-white shadow-espeSoft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Cédula</th>
                <th className="px-4 py-3 text-left">Nombres</th>
                <th className="px-4 py-3 text-left">Apellidos</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={5}>
                    No hay estudiantes para mostrar.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => (
                  <tr key={e.id_estudiante} className="border-t">
                    <td className="px-4 py-3 font-medium text-espeDark">{e.cedula}</td>
                    <td className="px-4 py-3 text-slate-600">{e.nombres}</td>
                    <td className="px-4 py-3 text-slate-600">{e.apellidos}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          isActive(e)
                            ? "bg-emerald-50 text-espeGreen"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isActive(e) ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(e)}
                          className="rounded-full border border-espeGray bg-white px-3 py-1.5 text-xs text-espeDark hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleEstado(e)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isActive(e)
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-50 text-espeGreen hover:bg-emerald-100"
                          }`}
                        >
                          {isActive(e) ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative w-full max-w-lg rounded-lg bg-white p-5 shadow-espeSoft">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-espeDark">
                {editing ? "Editar estudiante" : "Nuevo estudiante"}
              </h2>
              <p className="text-xs text-slate-500">
                Se registrará dentro de la Carrera–Período seleccionada.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 mb-1">Cédula</label>
                <input
                  value={form.cedula}
                  onChange={(e) => setForm((p) => ({ ...p, cedula: e.target.value }))}
                  className="w-full rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
                  placeholder="Ej: 1712345678"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Nombres</label>
                  <input
                    value={form.nombres}
                    onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))}
                    className="w-full rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Apellidos</label>
                  <input
                    value={form.apellidos}
                    onChange={(e) => setForm((p) => ({ ...p, apellidos: e.target.value }))}
                    className="w-full rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-espeGray bg-white px-4 py-2 text-sm text-espeDark hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {editing ? "Guardar cambios" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
