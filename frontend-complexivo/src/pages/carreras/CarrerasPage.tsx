// src/pages/carreras/CarrerasPage.tsx
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
  List,
  GraduationCap,
  Building2,
  Laptop,
  MapPin,
  Hash,
  X,
  Save,
  AlignLeft,
  BadgeCheck,
  BadgeX,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./CarrerasPage.css";

/**
 * ✅ IMPORTANTÍSIMO:
 * Los valores del SELECT deben ser "backend-safe".
 * Normalmente backend manda EN_LINEA / PRESENCIAL.
 */
const MODALIDADES = ["EN_LINEA", "PRESENCIAL"] as const;

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
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [search, setSearch] = useState("");
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  const [filtroSede, setFiltroSede] = useState("");
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  // paginación
  const [page, setPage] = useState(1);

  // modales
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCarrera, setEditingCarrera] = useState<Carrera | null>(null);
  const [viewCarrera, setViewCarrera] = useState<Carrera | null>(null);

  // form
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

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivas]);

  async function loadAll() {
    try {
      setLoading(true);
      const [car, dep] = await Promise.all([
        carrerasService.list(mostrarInactivas),
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

  /**
   * ✅ Normaliza cualquier variante:
   * "EN_LÍNEA", "EN LINEA", "EN_LINEA", "en_linea", etc -> "EN_LINEA"
   * "PRESENCIAL" -> "PRESENCIAL"
   */
  function normalizeModalidad(input?: string | null) {
    if (!input) return "";
    let s = String(input).trim().toUpperCase();

    // quita tildes
    s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // unifica separadores
    s = s.replace(/\s+/g, "_");

    if (s.includes("LINEA")) return "EN_LINEA";
    if (s.includes("PRESENCIAL")) return "PRESENCIAL";

    // fallback
    return s.replace(/[^A-Z_]/g, "");
  }

  // ✅ Etiqueta bonita para UI
  function modalidadLabel(mod?: string | null) {
    const s = normalizeModalidad(mod);
    if (!s) return "-";
    if (s === "EN_LINEA") return "EN LÍNEA";
    if (s === "PRESENCIAL") return "PRESENCIAL";
    return s.replaceAll("_", " ");
  }

  function openEdit(c: Carrera) {
    setEditingCarrera(c);
    setForm({
      nombre_carrera: c.nombre_carrera ?? "",
      codigo_carrera: c.codigo_carrera ?? "",
      descripcion_carrera: c.descripcion_carrera ?? "",
      id_departamento: String(c.id_departamento ?? ""),
      // ✅ aquí también normalizamos para que el select agarre el value correcto
      modalidad: normalizeModalidad(c.modalidad ?? ""),
      sede: (c.sede ?? "") as string,
    });
    setErrors({});
    setShowFormModal(true);
  }

  function openView(c: Carrera) {
    setViewCarrera(c);
    setShowViewModal(true);
  }

  function normalizeCodigo(input: string) {
    let s = input.trim();
    s = s.replace(/\s+/g, "_");
    s = s.replace(/[^a-zA-Z0-9_]/g, "");
    s = s.toUpperCase();
    return s.slice(0, 30);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Error al guardar carrera";
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return carreras
      .filter((c) => (mostrarInactivas ? true : c.estado === 1))
      .filter((c) => {
        if (!q) return true;

        const dept = getDepartamentoNombre(c.id_departamento).toLowerCase();
        return (
          (c.nombre_carrera || "").toLowerCase().includes(q) ||
          (c.codigo_carrera || "").toLowerCase().includes(q) ||
          (c.sede || "").toLowerCase().includes(q) ||
          // ✅ también lo hacemos robusto para búsqueda
          modalidadLabel(c.modalidad ?? "").toLowerCase().includes(q) ||
          dept.includes(q)
        );
      })
      .filter((c) => (filtroDepartamento ? String(c.id_departamento) === filtroDepartamento : true))
      // ✅ AQUÍ ESTABA EL BUG: ahora comparamos normalizado
      .filter((c) => (filtroModalidad ? normalizeModalidad(c.modalidad ?? "") === filtroModalidad : true))
      .filter((c) => (filtroSede ? (c.sede || "") === filtroSede : true))
      .sort((a, b) => (a.nombre_carrera || "").localeCompare(b.nombre_carrera || "", "es"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carreras, search, filtroDepartamento, filtroModalidad, filtroSede, mostrarInactivas, departamentos]);

  useEffect(() => {
    setPage(1);
  }, [search, filtroDepartamento, filtroModalidad, filtroSede, mostrarInactivas]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalCarreras = carreras.length;
  const activas = carreras.filter((c) => c.estado === 1).length;
  const inactivas = carreras.filter((c) => c.estado === 0).length;

  function validateForm(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!form.nombre_carrera.trim()) e.nombre_carrera = "El nombre es obligatorio.";
    else if (form.nombre_carrera.trim().length < 3) e.nombre_carrera = "Mínimo 3 caracteres.";

    if (!form.codigo_carrera.trim()) e.codigo_carrera = "El código es obligatorio.";
    else if (form.codigo_carrera.trim().length < 3) e.codigo_carrera = "Mínimo 3 caracteres.";

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
        // ✅ guardamos modalidad normalizada (backend-safe)
        modalidad: normalizeModalidad(form.modalidad),
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
    <div className="wrap carrerasPage">
      <div className="containerFull">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">CARRERAS ACADÉMICAS</h1>
              <p className="heroSubtitle">Gestión de carreras, modalidades y sedes</p>
            </div>
          </div>

          <button className="heroBtn" onClick={openCreate}>
            <Plus className="iconSm" /> Agregar Nueva Carrera
          </button>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <List className="iconSm" />
              </span>
              Listado de Carreras
            </div>

            <div className="searchWrap">
              <Search className="searchIcon" />
              <input
                className="search"
                placeholder="Buscar por código, nombre, departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* resumen */}
          <div className="summaryRow">
            <div className="summaryBoxes">
              <div className="summaryBox">
                <span className="summaryLabel">Total</span>
                <span className="summaryValue">{totalCarreras}</span>
              </div>

              <div className="summaryBox active">
                <span className="summaryLabel">Activas</span>
                <span className="summaryValue">{activas}</span>
              </div>

              <div className="summaryBox inactive">
                <span className="summaryLabel">Inactivas</span>
                <span className="summaryValue">{inactivas}</span>
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

              <button className="btnGhost" onClick={loadAll} title="Actualizar">
                ⟳ Actualizar
              </button>
            </div>
          </div>

          {/* filtros */}
          <div className="filtersRow">
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
                <option key={m} value={m}>
                  {modalidadLabel(m)}
                </option>
              ))}
            </select>

            <select
              className="select"
              value={filtroSede}
              onChange={(e) => setFiltroSede(e.target.value)}
            >
              <option value="">Sede</option>
              {SEDES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* tabla */}
          <div className="tableWrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th className="thNum">
                    <span className="thInline">#</span>
                  </th>

                  <th>
                    <span className="thInline">
                      <Hash className="iconSm" /> Código
                    </span>
                  </th>

                  <th className="thName">
                    <span className="thInline">
                      <GraduationCap className="iconSm" /> Nombre de Carrera
                    </span>
                  </th>

                  <th>
                    <span className="thInline">
                      <Building2 className="iconSm" /> Departamento
                    </span>
                  </th>

                  <th>
                    <span className="thInline">
                      <Laptop className="iconSm" /> Modalidad
                    </span>
                  </th>

                  <th>
                    <span className="thInline">
                      <MapPin className="iconSm" /> Sede
                    </span>
                  </th>

                  <th className="thState">Estado</th>
                  <th className="thActions">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="emptyCell">
                      <div className="empty">
                        <div className="emptyText">Cargando...</div>
                      </div>
                    </td>
                  </tr>
                ) : pageData.length ? (
                  pageData.map((c, idx) => (
                    <tr key={c.id_carrera}>
                      <td className="tdNum">{(page - 1) * PAGE_SIZE + idx + 1}</td>

                      <td>
                        <span className="chipCode">{c.codigo_carrera || "-"}</span>
                      </td>

                      <td>
                        <div className="nameMain">{c.nombre_carrera || "-"}</div>
                        {c.descripcion_carrera?.trim() ? (
                          <div className="nameSub">{c.descripcion_carrera}</div>
                        ) : null}
                      </td>

                      <td>
                        <span className="cellWithIcon">
                          <Building2 className="cellIcon" />
                          {getDepartamentoNombre(c.id_departamento)}
                        </span>
                      </td>

                      <td>
                        <span className="chipMod">{modalidadLabel(c.modalidad ?? null)}</span>
                      </td>

                      <td>
                        <span className="cellWithIcon">
                          <MapPin className="cellIcon" />
                          {c.sede || "-"}
                        </span>
                      </td>

                      <td>
                        {c.estado ? (
                          <span className="badgeActive">Activo</span>
                        ) : (
                          <span className="badgeInactive">Inactivo</span>
                        )}
                      </td>

                      <td className="tdActions">
                        <div className="actions">
                          <button className="iconBtn iconBtn_neutral" onClick={() => openView(c)} aria-label="Ver">
                            <span className="tooltip">Ver</span>
                            <Eye className="iconAction" />
                          </button>

                          <button className="iconBtn iconBtn_primary" onClick={() => openEdit(c)} aria-label="Editar">
                            <span className="tooltip">Editar</span>
                            <Pencil className="iconAction" />
                          </button>

                          <button
                            className={`iconBtn ${c.estado ? "iconBtn_danger" : "iconBtn_primary"}`}
                            aria-label={c.estado ? "Desactivar" : "Activar"}
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
                            <span className="tooltip">{c.estado ? "Desactivar" : "Activar"}</span>
                            {c.estado ? <ToggleRight className="iconAction" /> : <ToggleLeft className="iconAction" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="emptyCell">
                      <div className="empty">
                        <div className="emptyText">No hay carreras para mostrar.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* paginación */}
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

        {/* MODAL FORM */}
        {showFormModal && (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalPro">
              <div className="modalHeader">
                <div className="modalHeaderLeft">
                  <span className="modalHeaderIcon">
                    <GraduationCap className="iconSm" />
                  </span>
                  <div className="modalHeaderTexts">
                    <div className="modalHeaderTitle">{editingCarrera ? "Editar carrera" : "Nueva carrera"}</div>
                    <div className="modalHeaderSub">Completa los campos obligatorios para guardar.</div>
                  </div>
                </div>

                <button className="modalClose" onClick={() => setShowFormModal(false)} aria-label="Cerrar">
                  <X className="iconAction" />
                </button>
              </div>

              <div className="modalDivider" />

              <div className="modalBody">
                <div className="formGrid">
                  <div className="field">
                    <label className="label">
                      Nombre de la carrera <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={form.nombre_carrera}
                      placeholder="Ej: Tecnologías de la Información"
                      onChange={(e) => setForm({ ...form, nombre_carrera: e.target.value })}
                      style={errors.nombre_carrera ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
                    />
                    {errors.nombre_carrera && <div className="fieldError">{errors.nombre_carrera}</div>}
                  </div>

                  <div className="field">
                    <label className="label">
                      Código <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={form.codigo_carrera}
                      placeholder="Ej: TI_EN_LINEA"
                      onChange={(e) => setForm({ ...form, codigo_carrera: e.target.value })}
                      onBlur={() => setForm((p) => ({ ...p, codigo_carrera: normalizeCodigo(p.codigo_carrera) }))}
                      style={errors.codigo_carrera ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
                    />
                    <div className="helperText helperTextBig"></div>
                    {errors.codigo_carrera && <div className="fieldError">{errors.codigo_carrera}</div>}
                  </div>

                  <div className="field">
                    <label className="label">
                      Departamento <span className="req">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.id_departamento}
                      onChange={(e) => setForm({ ...form, id_departamento: e.target.value })}
                      style={errors.id_departamento ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
                    >
                      <option value="">Seleccionar</option>
                      {departamentos.map((d) => (
                        <option key={d.id_departamento} value={d.id_departamento}>
                          {d.nombre_departamento}
                        </option>
                      ))}
                    </select>
                    {errors.id_departamento && <div className="fieldError">{errors.id_departamento}</div>}
                  </div>

                  <div className="field">
                    <label className="label">
                      Modalidad <span className="req">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.modalidad}
                      onChange={(e) => setForm({ ...form, modalidad: e.target.value })}
                      style={errors.modalidad ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
                    >
                      <option value="">Seleccionar</option>
                      {MODALIDADES.map((m) => (
                        <option key={m} value={m}>
                          {modalidadLabel(m)}
                        </option>
                      ))}
                    </select>
                    {errors.modalidad && <div className="fieldError">{errors.modalidad}</div>}
                  </div>

                  <div className="field">
                    <label className="label">
                      Sede <span className="req">*</span>
                    </label>
                    <select
                      className="input"
                      value={form.sede}
                      onChange={(e) => setForm({ ...form, sede: e.target.value })}
                      style={errors.sede ? { borderColor: "rgba(180,20,20,0.35)" } : undefined}
                    >
                      <option value="">Seleccionar</option>
                      {SEDES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.sede && <div className="fieldError">{errors.sede}</div>}
                  </div>

                  <div className="field fieldFull">
                    <label className="label">Descripción</label>
                    <textarea
                      className="textarea"
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
                    <Save className="iconSm" /> Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL VIEW */}
        {showViewModal && viewCarrera && (
          <div className="modalOverlay" role="dialog" aria-modal="true">
            <div className="modalCard modalPro">
              <div className="modalHeader">
                <div className="modalHeaderLeft">
                  <span className="modalHeaderIcon">
                    <Eye className="iconSm" />
                  </span>
                  <div className="modalHeaderTexts">
                    <div className="modalHeaderTitle">Detalle de carrera</div>
                    <div className="modalHeaderSub">Información registrada en el sistema.</div>
                  </div>
                </div>

                <button className="modalClose" onClick={() => setShowViewModal(false)} aria-label="Cerrar">
                  <X className="iconAction" />
                </button>
              </div>

              <div className="modalDivider" />

              <div className="modalBody">
                <div className="viewCards">
                  <div className="vCard">
                    <div className="vLabel">
                      <GraduationCap className="vIcon" /> Carrera
                    </div>
                    <div className="vValue">{viewCarrera.nombre_carrera || "-"}</div>
                  </div>

                  <div className="vCard">
                    <div className="vLabel">
                      <Hash className="vIcon" /> Código
                    </div>
                    <div className="vValue">
                      <span className="chipCode">{viewCarrera.codigo_carrera || "-"}</span>
                    </div>
                  </div>

                  <div className="vCard">
                    <div className="vLabel">
                      <Building2 className="vIcon" /> Departamento
                    </div>
                    <div className="vValue">{getDepartamentoNombre(viewCarrera.id_departamento)}</div>
                  </div>

                  <div className="vCard">
                    <div className="vLabel">
                      <Laptop className="vIcon" /> Modalidad
                    </div>
                    <div className="vValue">
                      <span className="chipMod">{modalidadLabel(viewCarrera.modalidad ?? null)}</span>
                    </div>
                  </div>

                  <div className="vCard">
                    <div className="vLabel">
                      <MapPin className="vIcon" /> Sede
                    </div>
                    <div className="vValue">{viewCarrera.sede || "-"}</div>
                  </div>

                  <div className="vCard">
                    <div className="vLabel">
                      {viewCarrera.estado ? <BadgeCheck className="vIcon" /> : <BadgeX className="vIcon" />} Estado
                    </div>
                    <div className="vValue">
                      {viewCarrera.estado ? (
                        <span className="badgeActive">Activo</span>
                      ) : (
                        <span className="badgeInactive">Inactivo</span>
                      )}
                    </div>
                  </div>

                  <div className="vCard vCardFull">
                    <div className="vLabel">
                      <AlignLeft className="vIcon" /> Descripción
                    </div>
                    <div className="vValue">
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
          </div>
        )}

        {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
      </div>
    </div>
  );
}
