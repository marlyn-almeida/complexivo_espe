import { useEffect, useMemo, useState, type FormEvent } from "react";
import { rolesService } from "../../services/roles.service";
import type { Role } from "../../types/role";

type FormState = {
  nombre_rol: string;
  descripcion_rol: string;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);
  const [form, setForm] = useState<FormState>({ nombre_rol: "", descripcion_rol: "" });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await rolesService.list();
      setRoles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((r) => {
      const name = (r.nombre_rol ?? "").toLowerCase();
      const desc = (r.descripcion_rol ?? "").toLowerCase();
      return name.includes(query) || desc.includes(query);
    });
  }, [roles, q]);

  const isActive = (r: Role) => Boolean(r.estado);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre_rol: "", descripcion_rol: "" });
    setOpen(true);
  };

  const openEdit = (r: Role) => {
    setEditing(r);
    setForm({
      nombre_rol: r.nombre_rol ?? "",
      descripcion_rol: (r.descripcion_rol ?? "") as string,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditing(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      nombre_rol: form.nombre_rol.trim(),
      descripcion_rol: form.descripcion_rol.trim() || undefined,
    };

    if (!payload.nombre_rol) {
      alert("El nombre del rol es obligatorio.");
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await rolesService.update(editing.id_rol, payload);
      } else {
        await rolesService.create(payload);
      }
      await fetchRoles();
      closeModal();
    } catch (err: any) {
      // si tu backend manda message, se verá en consola por interceptor
      alert("No se pudo guardar el rol. Revisa consola/servidor.");
    } finally {
      setLoading(false);
    }
  };

  const toggleEstado = async (r: Role) => {
    const action = isActive(r) ? "desactivar" : "activar";
    const ok = confirm(`¿Seguro que deseas ${action} el rol "${r.nombre_rol}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await rolesService.toggleEstado(r.id_rol);
      await fetchRoles();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-espeDark">Roles</h1>
          <p className="text-xs text-slate-500">
            Gestión de roles del sistema (crear, editar y activar/desactivar).
          </p>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar rol..."
            className="w-full md:w-64 rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
          />
          <button onClick={openCreate} className="btn-primary whitespace-nowrap">
            + Nuevo
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-espeSoft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Descripción</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    Cargando...
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    No hay roles para mostrar.
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((r) => (
                  <tr key={r.id_rol} className="border-t">
                    <td className="px-4 py-3 font-medium text-espeDark">
                      {r.nombre_rol}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {r.descripcion_rol || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                          isActive(r)
                            ? "bg-emerald-50 text-espeGreen"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isActive(r) ? "ACTIVO" : "INACTIVO"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-full border border-espeGray bg-white px-3 py-1.5 text-xs text-espeDark hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleEstado(r)}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isActive(r)
                              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                              : "bg-emerald-50 text-espeGreen hover:bg-emerald-100"
                          }`}
                        >
                          {isActive(r) ? "Desactivar" : "Activar"}
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
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-white p-5 shadow-espeSoft">
            <div className="mb-3">
              <h2 className="text-base font-semibold text-espeDark">
                {editing ? "Editar rol" : "Nuevo rol"}
              </h2>
              <p className="text-xs text-slate-500">
                Completa la información y guarda.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-700 mb-1">Nombre</label>
                <input
                  value={form.nombre_rol}
                  onChange={(e) => setForm((p) => ({ ...p, nombre_rol: e.target.value }))}
                  className="w-full rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
                  placeholder="Ej: SUPER_ADMIN"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1">Descripción</label>
                <input
                  value={form.descripcion_rol}
                  onChange={(e) => setForm((p) => ({ ...p, descripcion_rol: e.target.value }))}
                  className="w-full rounded-full border border-espeGray bg-white px-3 py-2 text-sm outline-none focus:border-espeGreen focus:ring-1 focus:ring-espeGreen"
                  placeholder="Descripción opcional"
                />
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
