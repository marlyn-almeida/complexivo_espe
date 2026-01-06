// src/pages/docentes/DocentesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Docente } from "../../types/docente";
import { docentesService } from "../../services/docentes.service";

import { Plus, Pencil, Eye, ToggleLeft, ToggleRight, Search } from "lucide-react";
import "./DocentesPage.css";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type DocenteFormState = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente: string;
  telefono_docente: string;
  nombre_usuario: string;

  // ✅ NUEVO (Formato B)
  id_carrera: string;        // lo guardamos string para input
  codigo_carrera: string;
};

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const [page, setPage] = useState(1);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [viewDocente, setViewDocente] = useState<Docente | null>(null);

  const [form, setForm] = useState<DocenteFormState>({
    id_institucional_docente: "",
    cedula: "",
    nombres_docente: "",
    apellidos_docente: "",
    correo_docente: "",
    telefono_docente: "",
    nombre_usuario: "",

    // ✅ NUEVO
    id_carrera: "",
    codigo_carrera: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  useEffect(() => {
    loadAll();
  }, [mostrarInactivos]);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await docentesService.list(mostrarInactivos);
      setDocentes(data);
    } catch {
      showToast("Error al cargar docentes", "error");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function resetForm() {
    setEditingDocente(null);
    setForm({
      id_institucional_docente: "",
      cedula: "",
      nombres_docente: "",
      apellidos_docente: "",
      correo_docente: "",
      telefono_docente: "",
      nombre_usuario: "",

      id_carrera: "",
      codigo_carrera: "",
    });
    setErrors({});
  }

  function openCreate() {
    resetForm();
    setShowFormModal(true);
  }

  function openEdit(d: Docente) {
    setEditingDocente(d);
    setForm({
      id_institucional_docente: d.id_institucional_docente ?? "",
      cedula: d.cedula ?? "",
      nombres_docente: d.nombres_docente ?? "",
      apellidos_docente: d.apellidos_docente ?? "",
      correo_docente: d.correo_docente ?? "",
      telefono_docente: d.telefono_docente ?? "",
      nombre_usuario: d.nombre_usuario ?? "",

      // En editar NO tocamos asignación de carrera aquí
      id_carrera: "",
      codigo_carrera: "",
    });
    setErrors({});
    setShowFormModal(true);
  }

  function openView(d: Docente) {
    setViewDocente(d);
    setShowViewModal(true);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Error al guardar docente";
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return docentes
      .filter((d) => (mostrarInactivos ? true : d.estado === 1))
      .filter((d) => {
        if (!q) return true;
        return (
          (d.nombres_docente || "").toLowerCase().includes(q) ||
          (d.apellidos_docente || "").toLowerCase().includes(q) ||
          (d.cedula || "").toLowerCase().includes(q) ||
          (d.id_institucional_docente || "").toLowerCase().includes(q) ||
          (d.nombre_usuario || "").toLowerCase().includes(q) ||
          (d.correo_docente || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) =>
        `${a.apellidos_docente || ""} ${a.nombres_docente || ""}`.localeCompare(
          `${b.apellidos_docente || ""} ${b.nombres_docente || ""}`,
          "es"
        )
      );
  }, [docentes, search, mostrarInactivos]);

  useEffect(() => {
    setPage(1);
  }, [search, mostrarInactivos]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalDocentes = docentes.length;
  const activos = docentes.filter((d) => d.estado === 1).length;
  const inactivos = docentes.filter((d) => d.estado === 0).length;

  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.id_institucional_docente.trim()) e.id_institucional_docente = "ID institucional obligatorio.";
    if (!form.cedula.trim()) e.cedula = "La cédula es obligatoria.";

    if (!form.nombres_docente.trim()) e.nombres_docente = "Nombres obligatorios.";
    if (form.nombres_docente.trim().length < 3) e.nombres_docente = "Mínimo 3 caracteres.";

    if (!form.apellidos_docente.trim()) e.apellidos_docente = "Apellidos obligatorios.";
    if (form.apellidos_docente.trim().length < 3) e.apellidos_docente = "Mínimo 3 caracteres.";

    if (form.correo_docente.trim() && !/^\S+@\S+\.\S+$/.test(form.correo_docente.trim())) {
      e.correo_docente = "Correo no válido.";
    }

    if (!form.nombre_usuario.trim()) e.nombre_usuario = "Nombre de usuario obligatorio.";
    if (form.nombre_usuario.trim().length < 3) e.nombre_usuario = "Mínimo 3 caracteres.";

    // ✅ NUEVO (Formato B) - opcional, pero si se llena, validamos formato
    if (!editingDocente) {
      const idCarr = form.id_carrera.trim();
      if (idCarr) {
        const n = Number(idCarr);
        if (!Number.isFinite(n) || n < 1) e.id_carrera = "id_carrera debe ser un número mayor a 0.";
      }

      const cod = form.codigo_carrera.trim();
      if (cod && cod.length < 2) e.codigo_carrera = "Código de carrera muy corto.";
    }

    return e;
  }

  async function onSave() {
    const e = validateForm();
    setErrors(e);
    if (Object.keys(e).length) {
      showToast("Revisa los campos obligatorios.", "error");
      return;
    }

    try {
      const payloadBase: any = {
        id_institucional_docente: form.id_institucional_docente.trim(),
        cedula: form.cedula.trim(),
        nombres_docente: form.nombres_docente.trim(),
        apellidos_docente: form.apellidos_docente.trim(),
        correo_docente: form.correo_docente.trim() ? form.correo_docente.trim() : undefined,
        telefono_docente: form.telefono_docente.trim() ? form.telefono_docente.trim() : undefined,
        nombre_usuario: form.nombre_usuario.trim(),
        // ✅ NO mandamos password: backend usará username como password inicial
      };

      // ✅ NUEVO (Formato B): solo en CREAR
      if (!editingDocente) {
        const idCarr = form.id_carrera.trim();
        const cod = form.codigo_carrera.trim();

        if (idCarr) payloadBase.id_carrera = Number(idCarr);
        if (cod) payloadBase.codigo_carrera = cod;
      }

      if (editingDocente) {
        await docentesService.update(editingDocente.id_docente, payloadBase);
        showToast("Docente actualizado.", "success");
      } else {
        await docentesService.create(payloadBase);
        showToast("Docente creado. Password inicial = nombre de usuario.", "success");
      }

      setShowFormModal(false);
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");

      const list = err?.response?.data?.errors;
      if (Array.isArray(list)) {
        const mapped: Record<string, string> = {};
        for (const it of list) {
          if (it?.path && it?.msg) mapped[String(it.path)] = String(it.msg);
          if (it?.param && it?.msg) mapped[String(it.param)] = String(it.msg);
        }
        if (Object.keys(mapped).length) setErrors((prev) => ({ ...prev, ...mapped }));
      }
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Docentes</h2>
            <p className="subtitle">Gestión de docentes del sistema</p>
            <p className="docentes-sub">
              La contraseña inicial será el <b>nombre de usuario</b>. En el primer inicio de sesión el docente deberá cambiarla.
            </p>
          </div>

          <button className="btnPrimary" onClick={openCreate}>
            <Plus size={18} /> Nuevo docente
          </button>
        </div>

        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <span className="label">Total</span>
              <span className="value">{totalDocentes}</span>
            </div>

            <div className="summaryBox active">
              <span className="label">Activos</span>
              <span className="value">{activos}</span>
            </div>

            <div className="summaryBox inactive">
              <span className="label">Inactivos</span>
              <span className="value">{inactivos}</span>
            </div>
          </div>

          <div className="summaryActions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={mostrarInactivos}
                onChange={(e) => setMostrarInactivos(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivos</span>
            </label>

            <button className="btnSecondary" onClick={loadAll} title="Actualizar">
              ⟳ Actualizar
            </button>
          </div>
        </div>

        <div className="filtersRow">
          <div className="searchInline">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar docente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Docente</th>
              <th>Cédula</th>
              <th>ID institucional</th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Estado</th>
              <th className="thActions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 16 }}>
                  Cargando...
                </td>
              </tr>
            ) : pageData.length ? (
              pageData.map((d) => (
                <tr key={d.id_docente}>
                  <td className="tdStrong">
                    <div className="docentes-name">{d.apellidos_docente} {d.nombres_docente}</div>
                  </td>
                  <td>{d.cedula}</td>
                  <td className="tdCode">{d.id_institucional_docente}</td>
                  <td className="tdCode">{d.nombre_usuario}</td>
                  <td>{d.correo_docente || "-"}</td>
                  <td>
                    <span className={`badge ${d.estado ? "badge-success" : "badge-danger"}`}>
                      {d.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="actions">
                    <button className="btnIcon btnView" title="Ver" onClick={() => openView(d)}>
                      <Eye size={16} />
                    </button>

                    <button className="btnIcon btnEdit" title="Editar" onClick={() => openEdit(d)}>
                      <Pencil size={16} />
                    </button>

                    <button
                      className={`btnIcon ${d.estado ? "btnDeactivate" : "btnActivate"}`}
                      title={d.estado ? "Desactivar" : "Activar"}
                      onClick={async () => {
                        try {
                          await docentesService.toggleEstado(d.id_docente, d.estado);
                          showToast(d.estado ? "Docente desactivado." : "Docente activado.", "success");
                          await loadAll();
                        } catch {
                          showToast("No se pudo cambiar el estado.", "error");
                        }
                      }}
                    >
                      {d.estado ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 16 }}>
                  No hay docentes para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card paginationCard">
        <div className="paginationCenter">
          <button className="btnGhost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </button>

          <span className="muted">
            Página {page} de {totalPages}
          </span>

          <button className="btnGhost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente →
          </button>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showFormModal && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">{editingDocente ? "Editar docente" : "Nuevo docente"}</div>
              <button className="modalClose" onClick={() => setShowFormModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody formStack">
              <div className="formField">
                <label className="label">ID institucional *</label>
                <input
                  className={`fieldInput ${errors.id_institucional_docente ? "input-error" : ""}`}
                  value={form.id_institucional_docente}
                  onChange={(e) => setForm({ ...form, id_institucional_docente: e.target.value })}
                  placeholder="Ej: ESPE-12345"
                />
                {errors.id_institucional_docente && <div className="field-error">{errors.id_institucional_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Cédula *</label>
                <input
                  className={`fieldInput ${errors.cedula ? "input-error" : ""}`}
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  placeholder="Ej: 1712345678"
                />
                {errors.cedula && <div className="field-error">{errors.cedula}</div>}
              </div>

              <div className="formField">
                <label className="label">Nombres *</label>
                <input
                  className={`fieldInput ${errors.nombres_docente ? "input-error" : ""}`}
                  value={form.nombres_docente}
                  onChange={(e) => setForm({ ...form, nombres_docente: e.target.value })}
                  placeholder="Ej: Juan Carlos"
                />
                {errors.nombres_docente && <div className="field-error">{errors.nombres_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Apellidos *</label>
                <input
                  className={`fieldInput ${errors.apellidos_docente ? "input-error" : ""}`}
                  value={form.apellidos_docente}
                  onChange={(e) => setForm({ ...form, apellidos_docente: e.target.value })}
                  placeholder="Ej: Pérez Gómez"
                />
                {errors.apellidos_docente && <div className="field-error">{errors.apellidos_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Correo</label>
                <input
                  className={`fieldInput ${errors.correo_docente ? "input-error" : ""}`}
                  value={form.correo_docente}
                  onChange={(e) => setForm({ ...form, correo_docente: e.target.value })}
                  placeholder="Ej: correo@espe.edu.ec"
                />
                {errors.correo_docente && <div className="field-error">{errors.correo_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Teléfono</label>
                <input
                  className="fieldInput"
                  value={form.telefono_docente}
                  onChange={(e) => setForm({ ...form, telefono_docente: e.target.value })}
                  placeholder="Ej: 0999999999"
                />
              </div>

              <div className="formField">
                <label className="label">Nombre de usuario *</label>
                <input
                  className={`fieldInput ${errors.nombre_usuario ? "input-error" : ""}`}
                  value={form.nombre_usuario}
                  onChange={(e) => setForm({ ...form, nombre_usuario: e.target.value })}
                  placeholder="Ej: jperez"
                />
                <div className="helperText">
                  La contraseña inicial será este nombre de usuario. En el primer login deberá cambiarla.
                </div>
                {errors.nombre_usuario && <div className="field-error">{errors.nombre_usuario}</div>}
              </div>

              {/* ✅ NUEVO: Asignación de carrera (solo CREAR) */}
              {!editingDocente && (
                <>
                  <div className="formField">
                    <label className="label">id_carrera (opcional)</label>
                    <input
                      className={`fieldInput ${errors.id_carrera ? "input-error" : ""}`}
                      value={form.id_carrera}
                      onChange={(e) => setForm({ ...form, id_carrera: e.target.value })}
                      placeholder="Ej: 12"
                      inputMode="numeric"
                    />
                    {errors.id_carrera && <div className="field-error">{errors.id_carrera}</div>}
                    <div className="helperText">
                      Solo aplica si tu backend lo permite (por ejemplo SUPER_ADMIN). Si no envías, no se asigna carrera.
                    </div>
                  </div>

                  <div className="formField">
                    <label className="label">codigo_carrera (opcional)</label>
                    <input
                      className={`fieldInput ${errors.codigo_carrera ? "input-error" : ""}`}
                      value={form.codigo_carrera}
                      onChange={(e) => setForm({ ...form, codigo_carrera: e.target.value })}
                      placeholder="Ej: TI-ONLINE"
                    />
                    {errors.codigo_carrera && <div className="field-error">{errors.codigo_carrera}</div>}
                    <div className="helperText">
                      Puedes enviar código en vez de id. Si envías ambos, deben coincidir.
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modalFooter">
              <button className="btnGhost" onClick={() => setShowFormModal(false)}>
                Cancelar
              </button>

              <button className="btnPrimary" onClick={onSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VER */}
      {showViewModal && viewDocente && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">Detalle de docente</div>
              <button className="modalClose" onClick={() => setShowViewModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody viewGrid">
              <div className="viewItem">
                <div className="viewKey">Docente</div>
                <div className="viewVal">
                  {viewDocente.apellidos_docente} {viewDocente.nombres_docente}
                </div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Cédula</div>
                <div className="viewVal">{viewDocente.cedula}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">ID institucional</div>
                <div className="viewVal tdCode">{viewDocente.id_institucional_docente}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Usuario</div>
                <div className="viewVal tdCode">{viewDocente.nombre_usuario}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Correo</div>
                <div className="viewVal">{viewDocente.correo_docente || "-"}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Teléfono</div>
                <div className="viewVal">{viewDocente.telefono_docente || "-"}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Debe cambiar password</div>
                <div className="viewVal">
                  {viewDocente.debe_cambiar_password === 1 ? "Sí" : "No"}
                </div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Estado</div>
                <div className="viewVal">
                  <span className={`badge ${viewDocente.estado ? "badge-success" : "badge-danger"}`}>
                    {viewDocente.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="viewItem viewItemFull">
                <div className="viewKey">Creado</div>
                <div className="viewVal">{viewDocente.created_at || "-"}</div>
              </div>
            </div>

            <div className="modalFooter">
              <button className="btnGhost" onClick={() => setShowViewModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
