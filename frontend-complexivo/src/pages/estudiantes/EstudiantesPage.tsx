import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { Estudiante, Estado01 } from "../../types/estudiante";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { estudiantesService } from "../../services/estudiantes.service";
import "./EstudiantesPage.css";

type FormState = {
  id_institucional_estudiante: string;
  nombres_estudiante: string;
  apellidos_estudiante: string;
  correo_estudiante?: string;
  telefono_estudiante?: string;
};

export default function EstudiantesPage() {
  const [cpList, setCpList] = useState<CarreraPeriodo[]>([]);
  const [cpId, setCpId] = useState<number | null>(null);

  const [items, setItems] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Estudiante | null>(null);
  const [form, setForm] = useState<FormState>({
    id_institucional_estudiante: "",
    nombres_estudiante: "",
    apellidos_estudiante: "",
    correo_estudiante: "",
    telefono_estudiante: "",
  });

  const isActive = (e: Estudiante) => Number(e.estado) === 1;

  const loadCarreraPeriodos = async () => {
    setLoading(true);
    try {
      const data = await carreraPeriodoService.list();
      setCpList(data);

      const first = data.find((x) => Boolean(x.estado)) ?? data[0];
      if (first) setCpId(first.id_carrera_periodo);
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async (idCarreraPeriodo: number) => {
    setLoading(true);
    try {
      const data = await estudiantesService.list({
        carreraPeriodoId: idCarreraPeriodo,
        includeInactive: mostrarInactivos,
        q: q.trim() || undefined,
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpId, mostrarInactivos]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((e) => {
      const full = `${e.nombres_estudiante ?? ""} ${e.apellidos_estudiante ?? ""}`.toLowerCase();
      const inst = (e.id_institucional_estudiante ?? "").toLowerCase();
      const mail = (e.correo_estudiante ?? "").toLowerCase();
      return full.includes(query) || inst.includes(query) || mail.includes(query);
    });
  }, [items, q]);

  const metrics = useMemo(() => {
    const total = items.length;
    const activos = items.filter((x) => isActive(x)).length;
    const inactivos = total - activos;
    return { total, activos, inactivos };
  }, [items]);

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
    setForm({
      id_institucional_estudiante: "",
      nombres_estudiante: "",
      apellidos_estudiante: "",
      correo_estudiante: "",
      telefono_estudiante: "",
    });
    setOpen(true);
  };

  const openEdit = (e: Estudiante) => {
    setEditing(e);
    setForm({
      id_institucional_estudiante: e.id_institucional_estudiante ?? "",
      nombres_estudiante: e.nombres_estudiante ?? "",
      apellidos_estudiante: e.apellidos_estudiante ?? "",
      correo_estudiante: e.correo_estudiante ?? "",
      telefono_estudiante: e.telefono_estudiante ?? "",
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const validate = () => {
    if (!cpId) return "Selecciona una Carrera–Período.";
    if (!form.id_institucional_estudiante.trim()) return "El ID institucional es obligatorio.";
    if (!form.nombres_estudiante.trim()) return "Los nombres son obligatorios.";
    if (!form.apellidos_estudiante.trim()) return "Los apellidos son obligatorios.";
    return null;
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const err = validate();
    if (err) return alert(err);

    setLoading(true);
    try {
      const payload = {
        id_carrera_periodo: cpId!,
        id_institucional_estudiante: form.id_institucional_estudiante.trim(),
        nombres_estudiante: form.nombres_estudiante.trim(),
        apellidos_estudiante: form.apellidos_estudiante.trim(),
        correo_estudiante: form.correo_estudiante?.trim() || undefined,
        telefono_estudiante: form.telefono_estudiante?.trim() || undefined,
      };

      if (editing) {
        await estudiantesService.update(editing.id_estudiante, payload);
      } else {
        await estudiantesService.create(payload);
      }

      await loadEstudiantes(cpId!);
      closeModal();
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el estudiante. Revisa consola/servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (e: Estudiante) => {
    const action = isActive(e) ? "desactivar" : "activar";
    if (!confirm(`¿Seguro que deseas ${action} a "${e.nombres_estudiante} ${e.apellidos_estudiante}"?`)) return;

    setLoading(true);
    try {
      await estudiantesService.toggleEstado(e.id_estudiante, e.estado as Estado01);
      await loadEstudiantes(cpId!);
    } finally {
      setLoading(false);
    }
  };

  const onBuscar = async () => {
    if (!cpId) return;
    await loadEstudiantes(cpId);
  };

  return (
    <div className="est-page space-y-5">
      {/* Header */}
      <div className="est-header">
        <div>
          <h1 className="text-lg font-semibold text-espeDark">Estudiantes</h1>
          <p className="text-xs text-slate-500">
            Gestión de estudiantes habilitados por Carrera–Período.
          </p>
        </div>

        <div className="est-controls">
          {/* Selector Carrera-Periodo */}
          <select
            value={cpId ?? ""}
            onChange={(e) => setCpId(e.target.value ? Number(e.target.value) : null)}
            className="est-input"
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
            placeholder="Buscar por ID institucional, nombre o correo..."
            className="est-input"
          />

          <button onClick={onBuscar} className="est-btn est-btn-ghost" disabled={loading || !cpId}>
            Buscar
          </button>

          <label className="est-switch">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            <span>Mostrar inactivos</span>
          </label>

          <button onClick={openCreate} className="btn-primary whitespace-nowrap" disabled={!cpId}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div className="est-metrics">
        <div className="est-metric">
          <div className="est-metric-label">Total</div>
          <div className="est-metric-value">{metrics.total}</div>
        </div>
        <div className="est-metric">
          <div className="est-metric-label">Activos</div>
          <div className="est-metric-value">{metrics.activos}</div>
        </div>
        <div className="est-metric">
          <div className="est-metric-label">Inactivos</div>
          <div className="est-metric-value">{metrics.inactivos}</div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-lg bg-white shadow-espeSoft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ID Institucional</th>
                <th className="px-4 py-3 text-left">Nombres</th>
                <th className="px-4 py-3 text-left">Apellidos</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    No hay estudiantes para mostrar.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((e) => (
                  <tr key={e.id_estudiante} className="border-t">
                    <td className="px-4 py-3 font-medium text-espeDark">
                      {e.id_institucional_estudiante}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{e.nombres_estudiante}</td>
                    <td className="px-4 py-3 text-slate-600">{e.apellidos_estudiante}</td>
                    <td className="px-4 py-3 text-slate-600">{e.correo_estudiante ?? "—"}</td>
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
          <div className="relative w-full max-w-lg rounded-lg bg-white p-5 shadow-espeSoft est-modal">
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
                <label className="block text-xs text-slate-700 mb-1">ID Institucional</label>
                <input
                  value={form.id_institucional_estudiante}
                  onChange={(e) => setForm((p) => ({ ...p, id_institucional_estudiante: e.target.value }))}
                  className="est-input"
                  placeholder="Ej: TI-2023-0001"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Nombres</label>
                  <input
                    value={form.nombres_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, nombres_estudiante: e.target.value }))}
                    className="est-input"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Apellidos</label>
                  <input
                    value={form.apellidos_estudiante}
                    onChange={(e) => setForm((p) => ({ ...p, apellidos_estudiante: e.target.value }))}
                    className="est-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Correo (opcional)</label>
                  <input
                    value={form.correo_estudiante ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, correo_estudiante: e.target.value }))}
                    className="est-input"
                    placeholder="correo@espe.edu.ec"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-700 mb-1">Teléfono (opcional)</label>
                  <input
                    value={form.telefono_estudiante ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, telefono_estudiante: e.target.value }))}
                    className="est-input"
                    placeholder="0999999999"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeModal} className="est-btn est-btn-ghost">
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
