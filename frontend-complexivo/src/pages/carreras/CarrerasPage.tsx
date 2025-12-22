import { useEffect, useMemo, useState } from "react";
import { carrerasService } from "../../services/carreras.service";
import { departamentosService } from "../../services/departamentos.service";
import type { Carrera } from "../../types/carrera";
import type { Departamento } from "../../types/departamento";

import { Plus, Pencil, Eye, ToggleLeft, ToggleRight, Search } from "lucide-react";

import "./CarrerasPage.css";

const MODALIDADES = ["EN LÍNEA", "PRESENCIAL"];
const SEDES = ["Sangolquí (Matriz)", "Latacunga", "Santo Domingo", "IASA Sangolquí"];

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

type CarreraFormState = {
  nombre_carrera: string;
  codigo_carrera: string;
  descripcion_carrera: string;
  id_departamento: string; // select -> string
  modalidad: string;
  sede: string;
};

export default function CarrerasPage() {
  // ===========================
  // ESTADOS PRINCIPALES
  // ===========================
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);

  // ===========================
  // FILTROS
  // ===========================
  const [search, setSearch] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  // ===========================
  // PAGINACIÓN
  // ===========================
  const [page, setPage] = useState(1);

  // ===========================
  // MODALES
  // ===========================
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null);
  const [viewCarrera, setViewCarrera] = useState<Carrera | null>(null);

  // ===========================
  // FORM
  // ===========================
  const [form, setForm] = useState<CarreraFormState>({
    nombre_carrera: "",
    codigo_carrera: "",
    descripcion_carrera: "",
    id_departamento: "",
    modalidad: "",
    sede: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  // ===========================
  // CARGA INICIAL
  // ===========================
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [car, dep] = await Promise.all([carrerasService.list(), departamentosService.list()]);
      setCarreras(car);
      setDepartamentos(dep);
    } catch {
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // HELPERS
  // ===========================
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function getDepartamentoNombre(id: number) {
    return departamentos.find((d) => d.id_departamento === id)?.nombre_departamento || "-";
  }

  function resetForm() {
    setEditingCarrera(null);
    setForm({
      nombre_carrera: "",
      codigo_carrera: "",
      descripcion_carrera: "",
      id_departamento: "",
      modalidad: "",
      sede: "",
    });
    setErrors({});
  }

  function openCreate() {
    resetForm();
    setShowFormModal(true);
  }

  function openEdit(c: Carrera) {
    setEditingCarrera(c);
    setForm({
      nombre_carrera: c.nombre_carrera ?? "",
      codigo_carrera: c.codigo_carrera ?? "",
      descripcion_carrera: c.descripcion_carrera ?? "",
      id_departamento: String(c.id_departamento ?? ""),
      modalidad: c.modalidad ?? "",
      sede: c.sede ?? "",
    });
    setErrors({});
    setShowFormModal(true);
  }

  function openView(c: Carrera) {
    setViewCarrera(c);
    setShowViewModal(true);
  }

  // Normaliza código (sin obligarte a ti a escribir así)
  function normalizeCodigo(input: string) {
    // 1) trim
    let s = input.trim();

    // 2) reemplaza espacios por _
    s = s.replace(/\s+/g, "_");

    // 3) quita caracteres raros (deja letras, números y _)
    s = s.replace(/[^a-zA-Z0-9_]/g, "");

    // 4) MAYÚSCULAS (automático)
    s = s.toUpperCase();

    return s;
  }

  // Traer errores reales del backend (422)
  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      // si viene express-validator
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Error al guardar carrera";
  }

  // ===========================
  // FILTRADO + ORDEN + PAGINACIÓN
  // ===========================
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return carreras
      .filter((c) => (mostrarInactivas ? true : c.estado === 1))
      .filter((c) => {
        if (!q) return true;
        return (
          (c.nombre_carrera || "").toLowerCase().includes(q) ||
          (c.codigo_carrera || "").toLowerCase().includes(q) ||
          (c.sede || "").toLowerCase().includes(q) ||
          (c.modalidad || "").toLowerCase().includes(q)
        );
      })
      .filter((c) => (filtroDepartamento ? String(c.id_departamento) === filtroDepartamento : true))
      .filter((c) => (filtroModalidad ? (c.modalidad || "") === filtroModalidad : true))
      .filter((c) => (filtroSede ? (c.sede || "") === filtroSede : true))
      .sort((a, b) => (a.nombre_carrera || "").localeCompare(b.nombre_carrera || "", "es"));
  }, [carreras, search, filtroDepartamento, filtroModalidad, filtroSede, mostrarInactivas]);

  useEffect(() => {
    setPage(1);
  }, [search, filtroDepartamento, filtroModalidad, filtroSede, mostrarInactivas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // resumen
  const totalCarreras = carreras.length;
  const activas = carreras.filter((c) => c.estado === 1).length;
  const inactivas = carreras.filter((c) => c.estado === 0).length;

  // ===========================
  // VALIDACIONES FRONT (UX)
  // ===========================
  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.nombre_carrera.trim()) e.nombre_carrera = "El nombre es obligatorio.";
    if (form.nombre_carrera.trim().length < 3) e.nombre_carrera = "Mínimo 3 caracteres.";

    if (!form.codigo_carrera.trim()) e.codigo_carrera = "El código es obligatorio.";
    // dejamos que el sistema lo normalice, pero igual validamos que no quede vacío después
    if (form.codigo_carrera.trim().length < 3) e.codigo_carrera = "Mínimo 3 caracteres.";

    if (!form.id_departamento) e.id_departamento = "Seleccione un departamento.";
    if (!form.modalidad) e.modalidad = "Seleccione una modalidad.";
    if (!form.sede) e.sede = "Seleccione una sede.";

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
      const payload = {
        nombre_carrera: form.nombre_carrera.trim(),
        codigo_carrera: normalizeCodigo(form.codigo_carrera),
        descripcion_carrera: form.descripcion_carrera?.trim() || "",
        id_departamento: Number(form.id_departamento),
        modalidad: form.modalidad,
        sede: form.sede,
      };

      if (editingCarrera) {
        await carrerasService.update(editingCarrera.id_carrera, payload);
        showToast("Carrera actualizada.", "success");
      } else {
        await carrerasService.create(payload as any);
        showToast("Carrera creada.", "success");
      }

      setShowFormModal(false);
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");

      // si el backend manda errores por campo, los colocamos en errors
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

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="page">
      {/* HEADER */}
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Carreras</h2>
            <p className="subtitle">Gestión de carreras académicas por departamento</p>
          </div>

          <button className="btnPrimary" onClick={openCreate}>
            <Plus size={18} /> Nueva carrera
          </button>
        </div>

        {/* RESUMEN + ACCIONES */}
        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <span className="label">Total</span>
              <span className="value">{totalCarreras}</span>
            </div>

            <div className="summaryBox active">
              <span className="label">Activas</span>
              <span className="value">{activas}</span>
            </div>

            <div className="summaryBox inactive">
              <span className="label">Inactivas</span>
              <span className="value">{inactivas}</span>
            </div>
          </div>

          <div className="summaryActions">
            <label className="toggle">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivas</span>
            </label>

            <button className="btnSecondary" onClick={loadAll} title="Actualizar">
              ⟳ Actualizar
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="filtersRow">
          <div className="searchInline">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar carrera..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="select"
            value={filtroDepartamento}
            onChange={(e) => setFiltroDepartamento(e.target.value)}
          >
            <option value="">Departamento</option>
            {departamentos.map((d) => (
              <option key={d.id_departamento} value={d.id_departamento}>
                {d.nombre_departamento}
              </option>
            ))}
          </select>

          <select className="select" value={filtroModalidad} onChange={(e) => setFiltroModalidad(e.target.value)}>
            <option value="">Modalidad</option>
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select className="select" value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)}>
            <option value="">Sede</option>
            {SEDES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLA */}
      <div className="card tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Carrera</th>
              <th>Código</th>
              <th>Departamento</th>
              <th>Sede</th>
              <th>Modalidad</th>
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
              pageData.map((c) => (
                <tr key={c.id_carrera}>
                  <td className="tdStrong">{c.nombre_carrera}</td>
                  <td className="tdCode">{c.codigo_carrera}</td>
                  <td>{getDepartamentoNombre(c.id_departamento)}</td>
                  <td>{c.sede || "-"}</td>
                  <td>{c.modalidad || "-"}</td>
                  <td>
                    <span className={`badge ${c.estado ? "badge-success" : "badge-danger"}`}>
                      {c.estado ? "Activo" : "Inactivo"}
                    </span>
                  </td>

                  <td className="actions">
                    <button className="btnIcon btnView" title="Ver" onClick={() => openView(c)}>
                      <Eye size={16} />
                    </button>

                    <button className="btnIcon btnEdit" title="Editar" onClick={() => openEdit(c)}>
                      <Pencil size={16} />
                    </button>

                    <button
                      className={`btnIcon ${c.estado ? "btnDeactivate" : "btnActivate"}`}
                      title={c.estado ? "Desactivar" : "Activar"}
                      onClick={async () => {
                        try {
                          await carrerasService.toggleEstado(c.id_carrera, c.estado);
                          showToast(c.estado ? "Carrera desactivada." : "Carrera activada.", "success");
                          await loadAll();
                        } catch {
                          showToast("No se pudo cambiar el estado.", "error");
                        }
                      }}
                    >
                      {c.estado ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="muted" style={{ padding: 16 }}>
                  No hay carreras para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
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
              <div className="modalTitle">{editingCarrera ? "Editar carrera" : "Nueva carrera"}</div>
              <button className="modalClose" onClick={() => setShowFormModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody formStack">
              <div className="formField">
                <label className="label">Nombre de la carrera *</label>
                <input
                  className={`fieldInput ${errors.nombre_carrera ? "input-error" : ""}`}
                  value={form.nombre_carrera}
                  placeholder="Ej: Tecnologías de la Información"
                  onChange={(e) => setForm({ ...form, nombre_carrera: e.target.value })}
                />
                {errors.nombre_carrera && <div className="field-error">{errors.nombre_carrera}</div>}
              </div>

              <div className="formField">
                <label className="label">Código *</label>
                <input
                  className={`fieldInput ${errors.codigo_carrera ? "input-error" : ""}`}
                  value={form.codigo_carrera}
                  placeholder="Ej: TI_EN_LINEA"
                  onChange={(e) => setForm({ ...form, codigo_carrera: e.target.value })}
                  onBlur={() =>
                    setForm((p) => ({
                      ...p,
                      codigo_carrera: normalizeCodigo(p.codigo_carrera),
                    }))
                  }
                />
                <div className="helperText">Tip: se normaliza automáticamente (mayúsculas y “_”).</div>
                {errors.codigo_carrera && <div className="field-error">{errors.codigo_carrera}</div>}
              </div>

              <div className="formField">
                <label className="label">Departamento *</label>
                <select
                  className={`fieldSelect ${errors.id_departamento ? "input-error" : ""}`}
                  value={form.id_departamento}
                  onChange={(e) => setForm({ ...form, id_departamento: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {departamentos.map((d) => (
                    <option key={d.id_departamento} value={d.id_departamento}>
                      {d.nombre_departamento}
                    </option>
                  ))}
                </select>
                {errors.id_departamento && <div className="field-error">{errors.id_departamento}</div>}
              </div>

              <div className="formField">
                <label className="label">Modalidad *</label>
                <select
                  className={`fieldSelect ${errors.modalidad ? "input-error" : ""}`}
                  value={form.modalidad}
                  onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {MODALIDADES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {errors.modalidad && <div className="field-error">{errors.modalidad}</div>}
              </div>

              <div className="formField">
                <label className="label">Sede *</label>
                <select
                  className={`fieldSelect ${errors.sede ? "input-error" : ""}`}
                  value={form.sede}
                  onChange={(e) => setForm({ ...form, sede: e.target.value })}
                >
                  <option value="">Seleccione</option>
                  {SEDES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.sede && <div className="field-error">{errors.sede}</div>}
              </div>

              <div className="formField">
                <label className="label">Descripción</label>
                <textarea
                  className="fieldTextarea"
                  value={form.descripcion_carrera}
                  placeholder="Breve descripción (opcional)"
                  onChange={(e) => setForm({ ...form, descripcion_carrera: e.target.value })}
                />
              </div>
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
      {showViewModal && viewCarrera && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">Detalle de carrera</div>
              <button className="modalClose" onClick={() => setShowViewModal(false)}>
                ✕
              </button>
            </div>

            <div className="modalBody viewGrid">
              <div className="viewItem">
                <div className="viewKey">Carrera</div>
                <div className="viewVal">{viewCarrera.nombre_carrera}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Código</div>
                <div className="viewVal tdCode">{viewCarrera.codigo_carrera}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Departamento</div>
                <div className="viewVal">{getDepartamentoNombre(viewCarrera.id_departamento)}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Modalidad</div>
                <div className="viewVal">{viewCarrera.modalidad || "-"}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Sede</div>
                <div className="viewVal">{viewCarrera.sede || "-"}</div>
              </div>

              <div className="viewItem">
                <div className="viewKey">Estado</div>
                <div className="viewVal">
                  <span className={`badge ${viewCarrera.estado ? "badge-success" : "badge-danger"}`}>
                    {viewCarrera.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="viewItem viewItemFull">
                <div className="viewKey">Descripción</div>
                <div className="viewVal">
                  {viewCarrera.descripcion_carrera?.trim()
                    ? viewCarrera.descripcion_carrera
                    : "No se registró descripción."}
                </div>
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

      {/* TOAST */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
