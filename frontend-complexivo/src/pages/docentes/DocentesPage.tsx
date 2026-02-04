// ✅ src/pages/docentes/DocentesPage.tsx
import { useEffect, useMemo, useState } from "react";

import type { Docente } from "../../types/docente";
import type { Departamento } from "../../types/departamento";

import { docentesService } from "../../services/docentes.service";
import { departamentosService } from "../../services/departamentos.service";

// ✅ MODALES (en la misma carpeta)
import DocenteFormModal from "./DocenteFormModal";
import DocenteViewModal from "./DocenteViewModal";
import DocentesImportModal from "./DocentesImportModal"; // ✅ usa el modal real

import {
  Plus,
  Eye,
  ToggleLeft,
  ToggleRight,
  Search,
  Upload,
  Filter,
  X,
  User,
  Hash,
  Mail,
  BadgeCheck,
  BadgeX,
  Pencil,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./DocentesPage.css";

const PAGE_SIZE = 10;
type ToastType = "success" | "error" | "info";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);

  const [search, setSearch] = useState("");
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [page, setPage] = useState(1);

  const [filterDepartamentoId, setFilterDepartamentoId] = useState<string>("");

  // ✅ VIEW MODAL
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDocente, setViewDocente] = useState<Docente | null>(null);

  // ✅ CREATE / EDIT MODAL
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formDocente, setFormDocente] = useState<Docente | null>(null);

  // ✅ IMPORT MODAL REAL
  const [showImportModal, setShowImportModal] = useState(false);
  const [importingExternal, setImportingExternal] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Ocurrió un error";
  }

  useEffect(() => {
    loadDepartamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadAll();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos, filterDepartamentoId]);

  async function loadDepartamentos() {
    try {
      setLoadingDepartamentos(true);
      const data = await departamentosService.list();
      setDepartamentos((data ?? []).filter((d) => d.estado === 1));
    } catch {
      showToast("Error al cargar departamentos", "error");
    } finally {
      setLoadingDepartamentos(false);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);

      const idDepartamento =
        filterDepartamentoId && Number(filterDepartamentoId) > 0 ? Number(filterDepartamentoId) : undefined;

      const data = await docentesService.list({
        includeInactive: mostrarInactivos,
        id_departamento: idDepartamento,
      });

      setDocentes(data);
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  function openView(d: Docente) {
    setViewDocente(d);
    setShowViewModal(true);
  }

  function closeView() {
    setShowViewModal(false);
    setViewDocente(null);
  }

  function openCreate() {
    setFormMode("create");
    setFormDocente(null);
    setShowFormModal(true);
  }

  function openEdit(d: Docente) {
    setFormMode("edit");
    setFormDocente(d);
    setShowFormModal(true);
  }

  function closeFormModal() {
    setShowFormModal(false);
  }

  async function onSavedForm() {
    await loadAll();
    setShowFormModal(false);
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

  useEffect(() => setPage(1), [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalDocentes = docentes.length;
  const activos = docentes.filter((d) => d.estado === 1).length;
  const inactivos = docentes.filter((d) => d.estado === 0).length;

  function openImportModal() {
    setShowImportModal(true);
  }

  function closeImportModal() {
    if (!importingExternal) setShowImportModal(false);
  }

  return (
    <div className="docentesPage">
      <div className="wrap">
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">Docentes</h1>
              <p className="heroSubtitle">
                Gestión de docentes del sistema. La contraseña inicial será la <b>cédula</b> y en el primer inicio de
                sesión deberá cambiarla.
              </p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={openImportModal} disabled={loading}>
              <Upload className="heroBtnIcon" />
              Importar
            </button>

            <button className="heroBtn primary" onClick={openCreate} disabled={loading}>
              <Plus className="heroBtnIcon" />
              Nuevo docente
            </button>
          </div>
        </div>

        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <User size={18} />
              </span>
              Listado de docentes
            </div>

            <div className="boxRight">
              <button className="btnGhost" onClick={loadAll} disabled={loading} title="Actualizar">
                ⟳ Actualizar
              </button>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={mostrarInactivos}
                  onChange={(e) => setMostrarInactivos(e.target.checked)}
                />
                <span className="slider" />
                <span className="toggleText">Mostrar inactivos</span>
              </label>
            </div>
          </div>

          <div className="summaryRow">
            <div className="summaryBoxes">
              <div className="summaryBox">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{totalDocentes}</span>
              </div>

              <div className="summaryBox active">
                <span className="summaryLabel">Activos</span>
                <span className="summaryValue">{activos}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Inactivos</span>
                <span className="summaryValue">{inactivos}</span>
              </div>
            </div>
          </div>

          <div className="filtersRow">
            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por nombre, cédula, ID institucional, usuario o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filterWrap">
              <Filter className="filterIcon" />
              <select
                className="select"
                value={filterDepartamentoId}
                onChange={(e) => setFilterDepartamentoId(e.target.value)}
                disabled={loadingDepartamentos}
                aria-label="Filtrar por departamento"
                title="Filtrar por departamento"
              >
                <option value="">{loadingDepartamentos ? "Elegir departamento..." : "Todos los departamentos"}</option>
                {departamentos
                  .slice()
                  .sort((a, b) => a.nombre_departamento.localeCompare(b.nombre_departamento, "es"))
                  .map((d) => (
                    <option key={d.id_departamento} value={String(d.id_departamento)}>
                      {d.nombre_departamento}
                    </option>
                  ))}
              </select>

              {filterDepartamentoId && (
                <button className="chipClear" onClick={() => setFilterDepartamentoId("")} title="Quitar filtro">
                  <X size={14} /> Quitar filtro
                </button>
              )}
            </div>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th className="thName thCenter">
                    <span className="thFlex">
                      <User size={16} /> Docente
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Hash size={16} /> Cédula
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <BadgeCheck size={16} /> ID institucional
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <User size={16} /> Usuario
                    </span>
                  </th>

                  <th className="thCenter">
                    <span className="thFlex">
                      <Mail size={16} /> Correo
                    </span>
                  </th>

                  <th className="thState thCenter">
                    <span className="thFlex">
                      <BadgeCheck size={16} /> Estado
                    </span>
                  </th>

                  <th className="thActions thCenter">
                    <span className="thFlex">
                      <Pencil size={16} /> Acciones
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">Cargando...</div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((d) => (
                    <tr key={d.id_docente}>
                      <td className="tdCenter tdName">
                        <div className="nameMain">
                          {d.apellidos_docente} {d.nombres_docente}
                        </div>
                      </td>

                      <td className="mono tdCenter">{onlyDigits(d.cedula || "") || "-"}</td>

                      <td className="tdCenter">
                        <span className="chipCode">{(d.id_institucional_docente || "-").toUpperCase()}</span>
                      </td>

                      <td className="mono tdCenter userCell">{d.nombre_usuario || "-"}</td>

                      <td className="tdCenter mailCell">{d.correo_docente || "-"}</td>

                      <td className="tdCenter">
                        {d.estado ? (
                          <span className="badgeActive">
                            <BadgeCheck className="badgeIcon" size={16} />
                            ACTIVO
                          </span>
                        ) : (
                          <span className="badgeInactive">
                            <BadgeX className="badgeIcon" size={16} />
                            INACTIVO
                          </span>
                        )}
                      </td>

                      <td className="tdActions tdCenter">
                        <div className="actions">
                          {/* ✅ VER (AZUL) */}
                          <button className="iconBtn iconBtn_neutral" title="Ver" onClick={() => openView(d)}>
                            <Eye className="iconAction" />
                            <span className="tooltip">Ver</span>
                          </button>

                          {/* ✅ EDITAR (MORADO) */}
                          <button className="iconBtn iconBtn_purple" title="Editar" onClick={() => openEdit(d)}>
                            <Pencil className="iconAction" />
                            <span className="tooltip">Editar</span>
                          </button>

                          {/* ✅ ACTIVAR/DESACTIVAR: Activar = VERDE / Desactivar = NARANJA */}
                          <button
                            className={`iconBtn ${d.estado ? "iconBtn_danger" : "iconBtn_primary"}`}
                            title={d.estado ? "Desactivar" : "Activar"}
                            onClick={async () => {
                              try {
                                await docentesService.toggleEstado(d.id_docente, d.estado);
                                showToast(d.estado ? "Docente desactivado." : "Docente activado.", "success");
                                await loadAll();
                              } catch (err: any) {
                                showToast(extractBackendError(err), "error");
                              }
                            }}
                          >
                            {d.estado ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                            <span className="tooltip">{d.estado ? "Desactivar" : "Activar"}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      <div className="empty">No hay docentes para mostrar.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="paginationRow">
            <button className="btnGhost" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              ← Anterior
            </button>

            <span className="paginationText">
              Página {page} de {totalPages}
            </span>

            <button className="btnGhost" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {showFormModal && (
        <DocenteFormModal
          mode={formMode}
          docente={formDocente}
          departamentos={departamentos}
          onClose={closeFormModal}
          onSaved={onSavedForm}
          onToast={showToast}
        />
      )}

      {showViewModal && viewDocente && <DocenteViewModal docente={viewDocente} onClose={closeView} />}

      {/* ✅ IMPORT MODAL REAL */}
      <DocentesImportModal
        open={showImportModal}
        departamentos={departamentos}
        loadingDepartamentos={loadingDepartamentos}
        importingExternal={importingExternal}
        onClose={closeImportModal}
        onToast={(msg, type) => showToast(msg, type ?? "info")}
        onImported={async () => {
          await loadAll();
        }}
      />

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
