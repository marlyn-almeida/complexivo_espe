import { useEffect, useMemo, useState } from "react";
import { carrerasService } from "../../services/carreras.service";
import { departamentosService } from "../../services/departamentos.service";
import type { Carrera } from "../../types/carrera";
import type { Departamento } from "../../types/departamento";

import {
  Plus,
  Pencil,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";

import "./CarrerasPage.css";

const MODALIDADES = ["EN LÍNEA", "PRESENCIAL"];
const SEDES = [
  "Sangolquí (Matriz)",
  "Latacunga",
  "Santo Domingo",
  "IASA Sangolquí",
];

const PAGE_SIZE = 10;

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
  const [form, setForm] = useState({
    nombre_carrera: "",
    codigo_carrera: "",
    descripcion_carrera: "",
    id_departamento: "",
    modalidad: "",
    sede: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(
    null
  );

  // ===========================
  // CARGA INICIAL
  // ===========================
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [car, dep] = await Promise.all([
        carrerasService.list(),
        departamentosService.list(),
      ]);
      setCarreras(car);
      setDepartamentos(dep);
    } catch (e) {
      showToast("Error al cargar datos", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===========================
  // FILTRADO + PAGINACIÓN
  // ===========================
  const filtered = useMemo(() => {
    return carreras
      .filter((c) =>
        c.nombre_carrera.toLowerCase().includes(search.toLowerCase())
      )
      .filter((c) =>
        filtroDepartamento
          ? String(c.id_departamento) === filtroDepartamento
          : true
      )
      .filter((c) =>
        filtroModalidad ? c.modalidad === filtroModalidad : true
      )
      .filter((c) => (filtroSede ? c.sede === filtroSede : true))
      .sort((a, b) =>
        a.nombre_carrera.localeCompare(b.nombre_carrera, "es")
      );
  }, [carreras, search, filtroDepartamento, filtroModalidad, filtroSede]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // ===========================
  // HELPERS
  // ===========================
  function showToast(msg: string, type = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function getDepartamentoNombre(id: number) {
    return (
      departamentos.find((d) => d.id_departamento === id)
        ?.nombre_departamento || "-"
    );
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
            <p className="subtitle">
              Gestión de carreras académicas por departamento
            </p>
          </div>

          <button
            className="btnPrimary"
            onClick={() => {
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
              setShowFormModal(true);
            }}
          >
            <Plus size={18} /> Nueva carrera
          </button>
        </div>

        {/* FILTROS */}
        <div className="filtersRow">
          <div className="input">
            <Search size={16} />
            <input
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

          <select
            className="select"
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
          >
            <option value="">Modalidad</option>
            {MODALIDADES.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <select
            className="select"
            value={filtroSede}
            onChange={(e) => setFiltroSede(e.target.value)}
          >
            <option value="">Sede</option>
            {SEDES.map((s) => (
              <option key={s}>{s}</option>
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
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((c) => (
              <tr key={c.id_carrera}>
                <td className="tdStrong">{c.nombre_carrera}</td>
                <td className="tdCode">{c.codigo_carrera}</td>
                <td>{getDepartamentoNombre(c.id_departamento)}</td>
                <td>{c.sede}</td>
                <td>{c.modalidad}</td>
                <td>
                  <span
                    className={`badge ${
                      c.estado ? "badge-success" : "badge-danger"
                    }`}
                  >
                    {c.estado ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="actions">
                  <button
                    className="btnGhost"
                    onClick={() => {
                      setViewCarrera(c);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    className="btnGhost"
                    onClick={() => {
                      setEditingCarrera(c);
                      setForm({
                        nombre_carrera: c.nombre_carrera,
                        codigo_carrera: c.codigo_carrera,
                        descripcion_carrera: c.descripcion_carrera || "",
                        id_departamento: String(c.id_departamento),
                        modalidad: c.modalidad || "",
                        sede: c.sede || "",
                      });
                      setErrors({});
                      setShowFormModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="btnGhost"
                    onClick={async () => {
                      await carrerasService.toggleEstado(
                        c.id_carrera,
                        c.estado
                      );
                      loadAll();
                    }}
                  >
                    {c.estado ? (
                      <ToggleRight size={18} />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
            {/* PAGINACIÓN */}
      <div className="card">
        <div className="actions">
          <button
            className="btnGhost"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>

          <span className="muted">
            Página {page} de {totalPages || 1}
          </span>

          <button
            className="btnGhost"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      </div>

      {/* MODAL CREAR / EDITAR */}
      {showFormModal && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <div className="modalTitle">
                {editingCarrera ? "Editar carrera" : "Nueva carrera"}
              </div>
              <button
                className="modalClose"
                onClick={() => setShowFormModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modalBody">
              {/* NOMBRE */}
              <label className="label">Nombre de la carrera *</label>
              <input
                className={`input ${errors.nombre_carrera ? "input-error" : ""}`}
                value={form.nombre_carrera}
                onChange={(e) =>
                  setForm({ ...form, nombre_carrera: e.target.value })
                }
              />
              {errors.nombre_carrera && (
                <div className="field-error">{errors.nombre_carrera}</div>
              )}

              {/* CÓDIGO */}
              <label className="label">Código *</label>
              <input
                className={`input ${errors.codigo_carrera ? "input-error" : ""}`}
                value={form.codigo_carrera}
                onChange={(e) =>
                  setForm({ ...form, codigo_carrera: e.target.value })
                }
              />
              {errors.codigo_carrera && (
                <div className="field-error">{errors.codigo_carrera}</div>
              )}

              {/* DEPARTAMENTO */}
              <label className="label">Departamento *</label>
              <select
                className={`select ${
                  errors.id_departamento ? "input-error" : ""
                }`}
                value={form.id_departamento}
                onChange={(e) =>
                  setForm({ ...form, id_departamento: e.target.value })
                }
              >
                <option value="">Seleccione</option>
                {departamentos.map((d) => (
                  <option
                    key={d.id_departamento}
                    value={d.id_departamento}
                  >
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
              {errors.id_departamento && (
                <div className="field-error">{errors.id_departamento}</div>
              )}

              {/* MODALIDAD */}
              <label className="label">Modalidad *</label>
              <select
                className={`select ${errors.modalidad ? "input-error" : ""}`}
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
              {errors.modalidad && (
                <div className="field-error">{errors.modalidad}</div>
              )}

              {/* SEDE */}
              <label className="label">Sede *</label>
              <select
                className={`select ${errors.sede ? "input-error" : ""}`}
                value={form.sede}
                onChange={(e) => setForm({ ...form, sede: e.target.value })}
              >
                <option value="">Seleccione</option>
                {SEDES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {errors.sede && (
                <div className="field-error">{errors.sede}</div>
              )}

              {/* DESCRIPCIÓN */}
              <label className="label">Descripción</label>
              <textarea
                className="textarea"
                value={form.descripcion_carrera}
                onChange={(e) =>
                  setForm({ ...form, descripcion_carrera: e.target.value })
                }
              />
            </div>

            <div className="modalFooter">
              <button
                className="btnGhost"
                onClick={() => setShowFormModal(false)}
              >
                Cancelar
              </button>

              <button
                className="btnPrimary"
                onClick={async () => {
                  const newErrors: Record<string, string> = {};

                  if (!form.nombre_carrera.trim())
                    newErrors.nombre_carrera = "Campo obligatorio";
                  if (!form.codigo_carrera.trim())
                    newErrors.codigo_carrera = "Campo obligatorio";
                  if (!form.id_departamento)
                    newErrors.id_departamento = "Seleccione un departamento";
                  if (!form.modalidad)
                    newErrors.modalidad = "Seleccione una modalidad";
                  if (!form.sede)
                    newErrors.sede = "Seleccione una sede";

                  setErrors(newErrors);
                  if (Object.keys(newErrors).length > 0) return;

                  try {
                    if (editingCarrera) {
                      await carrerasService.update(
                        editingCarrera.id_carrera,
                        {
                          ...form,
                          id_departamento: Number(form.id_departamento),
                        }
                      );
                      showToast("Carrera actualizada", "success");
                    } else {
                      await carrerasService.create({
                        ...form,
                        id_departamento: Number(form.id_departamento),
                      });
                      showToast("Carrera creada", "success");
                    }

                    setShowFormModal(false);
                    loadAll();
                  } catch {
                    showToast("Error al guardar carrera", "error");
                  }
                }}
              >
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
              <button
                className="modalClose"
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modalBody">
              <div>
                <strong>Nombre:</strong> {viewCarrera.nombre_carrera}
              </div>
              <div>
                <strong>Código:</strong> {viewCarrera.codigo_carrera}
              </div>
              <div>
                <strong>Departamento:</strong>{" "}
                {getDepartamentoNombre(viewCarrera.id_departamento)}
              </div>
              <div>
                <strong>Modalidad:</strong> {viewCarrera.modalidad}
              </div>
              <div>
                <strong>Sede:</strong> {viewCarrera.sede}
              </div>
              <div>
                <strong>Descripción:</strong>{" "}
                {viewCarrera.descripcion_carrera || "-"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

