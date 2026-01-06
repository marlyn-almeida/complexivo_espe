import { useEffect, useMemo, useState } from "react";
import type { Docente } from "../../types/docente";
import type { Carrera } from "../../types/carrera";

import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import { Plus, Pencil, Eye, ToggleLeft, ToggleRight, Search, Upload, Download, Shield } from "lucide-react";
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
  id_carrera: string; // selector (solo create)
};

// ---------- Helpers validación / sanitizado ----------
const onlyDigits = (v: string) => v.replace(/\D+/g, "");
const normalizeSpaces = (v: string) => v.replace(/\s+/g, " ").trim();

// Letras (incluye tildes/ñ), espacios y guion. (sin puntos, sin números)
const cleanNameLike = (v: string) =>
  v
    .replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

const cleanInstitucional = (v: string) =>
  v
    .replace(/[.]+/g, "")            // quita puntos
    .replace(/\s+/g, " ")
    .trim();

// Usuario: letras/números/._- (sin espacios)
const cleanUsername = (v: string) => v.replace(/[^a-zA-Z0-9._-]+/g, "").trim();

function isValidEmail(v: string) {
  return /^\S+@\S+\.\S+$/.test(v);
}

function getRoleFromTokenBestEffort(): string | null {
  // intentamos varias claves típicas
  const keys = ["token", "accessToken", "authToken", "jwt", "JWT"];
  let token: string | null = null;

  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.split(".").length === 3) {
      token = v;
      break;
    }
  }
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

    // backend: activeRole / rol / roles
    const role = json.activeRole ?? json.rol ?? null;
    if (typeof role === "string") return role;

    // si viene numérico (1/2/3)
    if (typeof role === "number") {
      if (role === 1) return "SUPER_ADMIN";
      if (role === 2) return "ADMIN";
      if (role === 3) return "DOCENTE";
    }

    // si no, intenta roles array
    const roles = Array.isArray(json.roles) ? json.roles : [];
    if (roles.includes("SUPER_ADMIN") || roles.includes(1)) return "SUPER_ADMIN";

    return null;
  } catch {
    return null;
  }
}

export default function DocentesPage() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

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
    id_carrera: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  const isSuperAdminUI = useMemo(() => getRoleFromTokenBestEffort() === "SUPER_ADMIN", []);

  useEffect(() => {
    loadAll();
  }, [mostrarInactivos]);

  useEffect(() => {
    loadCarreras();
  }, []);

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

  async function loadCarreras() {
    try {
      setLoadingCarreras(true);
      const data = await carrerasService.list(false);
      setCarreras((data ?? []).filter((c) => c.estado === 1));
    } catch {
      showToast("Error al cargar carreras", "error");
    } finally {
      setLoadingCarreras(false);
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
      id_carrera: "", // no editar carrera aquí por ahora
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

    const inst = normalizeSpaces(form.id_institucional_docente);
    const ced = onlyDigits(form.cedula);
    const nom = cleanNameLike(form.nombres_docente);
    const ape = cleanNameLike(form.apellidos_docente);
    const user = cleanUsername(form.nombre_usuario);

    if (!inst) e.id_institucional_docente = "ID institucional obligatorio.";
    // evita "...." o basura (ya quitamos puntos en onChange igual)
    if (inst && inst.length < 3) e.id_institucional_docente = "ID institucional inválido.";

    if (!ced) e.cedula = "La cédula es obligatoria.";
    if (ced && ced.length !== 10) e.cedula = "La cédula debe tener 10 dígitos.";

    if (!nom) e.nombres_docente = "Nombres obligatorios.";
    if (nom && nom.length < 3) e.nombres_docente = "Mínimo 3 caracteres.";

    if (!ape) e.apellidos_docente = "Apellidos obligatorios.";
    if (ape && ape.length < 3) e.apellidos_docente = "Mínimo 3 caracteres.";

    const email = form.correo_docente.trim();
    if (email && !isValidEmail(email)) e.correo_docente = "Correo no válido.";

    const tel = onlyDigits(form.telefono_docente);
    if (tel && (tel.length < 7 || tel.length > 15)) {
      e.telefono_docente = "Teléfono inválido (7–15 dígitos).";
    }

    if (!user) e.nombre_usuario = "Nombre de usuario obligatorio.";
    if (user && user.length < 3) e.nombre_usuario = "Mínimo 3 caracteres.";

    if (!editingDocente && !form.id_carrera.trim()) e.id_carrera = "Selecciona una carrera.";

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
        id_institucional_docente: cleanInstitucional(form.id_institucional_docente),
        cedula: onlyDigits(form.cedula),
        nombres_docente: cleanNameLike(form.nombres_docente),
        apellidos_docente: cleanNameLike(form.apellidos_docente),
        correo_docente: form.correo_docente.trim() ? form.correo_docente.trim() : undefined,
        telefono_docente: onlyDigits(form.telefono_docente) ? onlyDigits(form.telefono_docente) : undefined,
        nombre_usuario: cleanUsername(form.nombre_usuario),
      };

      if (!editingDocente) payloadBase.id_carrera = Number(form.id_carrera);

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
    }
  }

  async function toggleSuperAdmin(d: Docente) {
    // Requiere que venga d.super_admin del backend
    if (typeof d.super_admin === "undefined") {
      showToast("Falta flag super_admin en el listado (backend).", "error");
      return;
    }

    const enabled = d.super_admin === 0;

    try {
      await docentesService.setSuperAdmin(d.id_docente, enabled);
      showToast(enabled ? "Rol SUPER_ADMIN asignado." : "Rol SUPER_ADMIN removido.", "success");
      await loadAll();
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* ✅ Estos quedan como “acciones” y luego los conectamos a DocentesImportPage */}
            <button
              className="btnSecondary"
              onClick={() => showToast("Plantilla: se moverá a Importación.", "info")}
              title="Descargar plantilla"
            >
              <Download size={18} /> Plantilla
            </button>

            <button
              className="btnSecondary"
              onClick={() => showToast("Importación: se moverá a una pantalla separada.", "info")}
              title="Importar Excel"
            >
              <Upload size={18} /> Importar
            </button>

            <button className="btnPrimary" onClick={openCreate}>
              <Plus size={18} /> Nuevo docente
            </button>
          </div>
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
                    <div className="docentes-name">
                      {d.apellidos_docente} {d.nombres_docente}
                      {d.super_admin === 1 && (
                        <span className="badge badge-info" style={{ marginLeft: 8 }}>
                          SUPER_ADMIN
                        </span>
                      )}
                    </div>
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
                    {isSuperAdminUI && (
                      <button
                        className={`btnIcon btnSuperAdmin ${d.super_admin === 1 ? "isOn" : ""}`}
                        title={d.super_admin === 1 ? "Quitar SUPER_ADMIN" : "Hacer SUPER_ADMIN"}
                        onClick={() => toggleSuperAdmin(d)}
                      >
                        <Shield size={16} />
                      </button>
                    )}

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
              {!editingDocente && (
                <div className="formField">
                  <label className="label">Carrera *</label>
                  <select
                    className={`fieldSelect ${errors.id_carrera ? "input-error" : ""}`}
                    value={form.id_carrera}
                    onChange={(e) => setForm({ ...form, id_carrera: e.target.value })}
                    disabled={loadingCarreras}
                  >
                    <option value="">{loadingCarreras ? "Cargando..." : "Seleccione una carrera"}</option>
                    {carreras
                      .slice()
                      .sort((a, b) => a.nombre_carrera.localeCompare(b.nombre_carrera, "es"))
                      .map((c) => (
                        <option key={c.id_carrera} value={String(c.id_carrera)}>
                          {c.nombre_carrera} ({c.codigo_carrera})
                        </option>
                      ))}
                  </select>
                  {errors.id_carrera && <div className="field-error">{errors.id_carrera}</div>}
                </div>
              )}

              <div className="formField">
                <label className="label">ID institucional *</label>
                <input
                  className={`fieldInput ${errors.id_institucional_docente ? "input-error" : ""}`}
                  value={form.id_institucional_docente}
                  onChange={(e) =>
                    setForm({ ...form, id_institucional_docente: cleanInstitucional(e.target.value) })
                  }
                  placeholder="Ej: ESPE-12345"
                />
                {errors.id_institucional_docente && <div className="field-error">{errors.id_institucional_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Cédula *</label>
                <input
                  className={`fieldInput ${errors.cedula ? "input-error" : ""}`}
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: onlyDigits(e.target.value).slice(0, 10) })}
                  placeholder="Ej: 1712345678"
                  inputMode="numeric"
                />
                {errors.cedula && <div className="field-error">{errors.cedula}</div>}
              </div>

              <div className="formField">
                <label className="label">Nombres *</label>
                <input
                  className={`fieldInput ${errors.nombres_docente ? "input-error" : ""}`}
                  value={form.nombres_docente}
                  onChange={(e) => setForm({ ...form, nombres_docente: cleanNameLike(e.target.value) })}
                  placeholder="Ej: Juan Carlos"
                />
                {errors.nombres_docente && <div className="field-error">{errors.nombres_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Apellidos *</label>
                <input
                  className={`fieldInput ${errors.apellidos_docente ? "input-error" : ""}`}
                  value={form.apellidos_docente}
                  onChange={(e) => setForm({ ...form, apellidos_docente: cleanNameLike(e.target.value) })}
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
                  className={`fieldInput ${errors.telefono_docente ? "input-error" : ""}`}
                  value={form.telefono_docente}
                  onChange={(e) => setForm({ ...form, telefono_docente: onlyDigits(e.target.value).slice(0, 15) })}
                  placeholder="Ej: 0999999999"
                  inputMode="numeric"
                />
                {errors.telefono_docente && <div className="field-error">{errors.telefono_docente}</div>}
              </div>

              <div className="formField">
                <label className="label">Nombre de usuario *</label>
                <input
                  className={`fieldInput ${errors.nombre_usuario ? "input-error" : ""}`}
                  value={form.nombre_usuario}
                  onChange={(e) => setForm({ ...form, nombre_usuario: cleanUsername(e.target.value) })}
                  placeholder="Ej: jperez"
                />
                <div className="helperText">
                  La contraseña inicial será este nombre de usuario. En el primer login deberá cambiarla.
                </div>
                {errors.nombre_usuario && <div className="field-error">{errors.nombre_usuario}</div>}
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
                <div className="viewVal">{viewDocente.debe_cambiar_password === 1 ? "Sí" : "No"}</div>
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
