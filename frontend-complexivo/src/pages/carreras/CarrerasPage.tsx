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

import CarreraFormModal from "./CarreraFormModal";
import CarreraViewModal from "./CarreraViewModal";

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
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  const totalCarreras = carreras.length;
  const activas = carreras.filter((c) => c.estado === 1).length;
  const inactivas = carreras.filter((c) => c.estado === 0).length;

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
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

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
    } catch {
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
        mostrarInactivas ? true : c.estado === 1
      )
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
  }, [
    carreras,
    search,
    filtroDepartamento,
    filtroModalidad,
    filtroSede,
    mostrarInactivas,
  ]);

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

        {/* RESUMEN */}
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
              <span className="slider"></span>
              <span className="toggleText">Mostrar inactivas</span>
            </label>

            <button className="btnSecondary" onClick={loadAll}>
              ⟳ Actualizar
            </button>
          </div>
        </div>

        {/* FILTROS */}
        <div className="filtersRow">
          <div className="searchInline">
            <Search size={18} />
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
                    className="btnIcon btnView"
                    onClick={() => {
                      setViewCarrera(c);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    className="btnIcon btnEdit"
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
                      setShowFormModal(true);
                    }}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className={`btnIcon ${
                      c.estado ? "btnDeactivate" : "btnActivate"
                    }`}
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
        <div className="pagination">
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

      {/* MODALES */}
      <CarreraFormModal
        open={showFormModal}
        editingCarrera={editingCarrera}
        departamentos={departamentos}
        form={form}
        setForm={setForm}
        errors={errors}
        setErrors={setErrors}
        onClose={() => setShowFormModal(false)}
        onSave={async () => {
          const newErrors: Record<string, string> = {};

          if (!form.nombre_carrera.trim())
            newErrors.nombre_carrera = "Campo obligatorio";
          if (!form.codigo_carrera.trim())
            newErrors.codigo_carrera = "Campo obligatorio";
          if (!form.id_departamento)
            newErrors.id_departamento = "Seleccione un departamento";
          if (!form.modalidad)
            newErrors.modalidad = "Seleccione modalidad";
          if (!form.sede)
            newErrors.sede = "Seleccione sede";

          setErrors(newErrors);
          if (Object.keys(newErrors).length > 0) return;

          if (editingCarrera) {
            await carrerasService.update(editingCarrera.id_carrera, {
              ...form,
              id_departamento: Number(form.id_departamento),
            });
          } else {
            await carrerasService.create({
              ...form,
              id_departamento: Number(form.id_departamento),
            });
          }

          setShowFormModal(false);
          loadAll();
        }}
      />

      <CarreraViewModal
        open={showViewModal}
        carrera={viewCarrera}
        getDepartamentoNombre={getDepartamentoNombre}
        onClose={() => setShowViewModal(false)}
      />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
