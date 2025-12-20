import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarrerasPage.css";

import { carrerasService, type CarreraCreateDTO, type CarreraUpdateDTO } from "../../services/carreras.service";
import { departamentosService, type Departamento } from "../../services/departamentos.service";
import type { Carrera, Estado01 } from "../../types/carrera";

type ToastType = "success" | "error" | "info";

const MODALIDADES = [
  { value: "En línea", label: "En línea" },
  { value: "Presencial", label: "Presencial" },
] as const;

const SEDES = [
  { value: "Sangolquí (Matriz)", label: "Sangolquí (Matriz)" },
  { value: "Sangolquí - IASA", label: "Sangolquí - IASA" },
  { value: "Latacunga", label: "Latacunga" },
  { value: "Santo Domingo", label: "Santo Domingo" },
] as const;

type FieldErrors = Partial<Record<
  "nombre_carrera" | "codigo_carrera" | "id_departamento" | "sede" | "modalidad" | "descripcion_carrera",
  string
>>;

const normalize = (v: string) => v.replace(/\s+/g, " ").trim();

function toEstado01(v: any): Estado01 {
  return v === 0 ? 0 : 1;
}

function estadoLabel(estado: Estado01) {
  return estado === 1 ? "ACTIVA" : "INACTIVA";
}

function estadoBadgeClass(estado: Estado01) {
  return estado === 1 ? "badge badge-success" : "badge badge-danger";
}

export default function CarrerasPage() {
  const [rows, setRows] = useState<Carrera[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Carrera | null>(null);

  // campos form
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [idDepartamento, setIdDepartamento] = useState<number | "">("");
  const [sede, setSede] = useState<string>("");
  const [modalidad, setModalidad] = useState<string>("");

  // validación UI
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // confirm modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirmar");
  const [confirmText, setConfirmText] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | (() => Promise<void>)>(null);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<ToastType>("info");

  const showToast = (msg: string, type: ToastType = "info") => {
    setToastMsg(msg);
    setToastType(type);
    setToastOpen(true);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToastOpen(false), 2400);
  };

  const isValidNombre = (v: string) =>
    /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s\-\.\(\)]+$/.test(v);

  const isValidCodigo = (v: string) =>
    /^[A-Z0-9_]+$/.test(v); // EJ: TI_ENLINEA_2025

  const validate = (draft?: Partial<{
    nombre: string;
    codigo: string;
    descripcion: string;
    idDepartamento: number | "";
    sede: string;
    modalidad: string;
  }>) => {
    const n = normalize(draft?.nombre ?? nombre);
    const c = normalize(draft?.codigo ?? codigo).toUpperCase().replace(/\s+/g, "_");
    const d = normalize(draft?.descripcion ?? descripcion);
    const dep = (draft?.idDepartamento ?? idDepartamento);
    const s = draft?.sede ?? sede;
    const m = draft?.modalidad ?? modalidad;

    const e: FieldErrors = {};

    // nombre
    if (!n) e.nombre_carrera = "El nombre de la carrera es obligatorio.";
    else if (n.length < 3) e.nombre_carrera = "Debe tener al menos 3 caracteres.";
    else if (n.length > 120) e.nombre_carrera = "Máximo 120 caracteres.";
    else if (!isValidNombre(n)) e.nombre_carrera = "Solo letras, números y símbolos básicos (- . ( )).";

    // código
    if (!c) e.codigo_carrera = "El código es obligatorio.";
    else if (c.length < 3) e.codigo_carrera = "Debe tener al menos 3 caracteres.";
    else if (c.length > 30) e.codigo_carrera = "Máximo 30 caracteres.";
    else if (!isValidCodigo(c)) e.codigo_carrera = "Solo A-Z, 0-9 y guion bajo ( _ ).";

    // departamento
    if (dep === "") e.id_departamento = "Seleccione un departamento.";
    else if (typeof dep !== "number") e.id_departamento = "Seleccione un departamento válido.";

    // sede
    if (!s) e.sede = "Seleccione una sede.";
    else if (!SEDES.some(x => x.value === s)) e.sede = "Seleccione una sede válida.";

    // modalidad
    if (!m) e.modalidad = "Seleccione una modalidad.";
    else if (!MODALIDADES.some(x => x.value === m)) e.modalidad = "Seleccione una modalidad válida.";

    // descripción (opcional)
    if (d.length > 200) e.descripcion_carrera = "Máximo 200 caracteres.";

    setErrors(e);

    return {
      ok: Object.keys(e).length === 0,
      normalized: {
        nombre_carrera: n,
        codigo_carrera: c,
        descripcion_carrera: d ? d : null,
        id_departamento: dep === "" ? 0 : Number(dep),
        sede: s,
        modalidad: m,
      },
    };
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await carrerasService.list();
      setRows(data ?? []);
    } catch (e: any) {
      showToast(e?.response?.data?.message || "No se pudo cargar carreras", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartamentos = async () => {
    try {
      const deps = await departamentosService.list();
      setDepartamentos((deps ?? []).filter(d => d.estado === 1));
    } catch {
      showToast("No se pudieron cargar departamentos.", "error");
    }
  };

  useEffect(() => {
    fetchAll();
    fetchDepartamentos();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return rows.filter((c) => {
      const est: Estado01 = toEstado01((c as any).estado);

      if (estadoFilter === "ACTIVE" && est !== 1) return false;
      if (estadoFilter === "INACTIVE" && est !== 0) return false;

      if (!text) return true;

      const nombreCarrera = String((c as any).nombre_carrera ?? "").toLowerCase();
      const codigoCarrera = String((c as any).codigo_carrera ?? "").toLowerCase();
      const sedeCarrera = String((c as any).sede ?? "").toLowerCase();
      const modCarrera = String((c as any).modalidad ?? "").toLowerCase();

      return (
        nombreCarrera.includes(text) ||
        codigoCarrera.includes(text) ||
        sedeCarrera.includes(text) ||
        modCarrera.includes(text)
      );
    });
  }, [rows, q, estadoFilter]);

  const totals = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const c of rows) {
      const est: Estado01 = toEstado01((c as any).estado);
      if (est === 1) active++;
      else inactive++;
    }
    return { total: rows.length, active, inactive };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);

    setNombre("");
    setCodigo("");
    setDescripcion("");
    setIdDepartamento("");
    setSede("");
    setModalidad("");

    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const openEdit = (c: Carrera) => {
    setEditing(c);

    setNombre(String((c as any).nombre_carrera ?? ""));
    setCodigo(String((c as any).codigo_carrera ?? ""));
    setDescripcion(String((c as any).descripcion_carrera ?? ""));
    setIdDepartamento((c as any).id_departamento ?? "");
    setSede(String((c as any).sede ?? ""));
    setModalidad(String((c as any).modalidad ?? ""));

    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setTouched({
      nombre_carrera: true,
      codigo_carrera: true,
      descripcion_carrera: true,
      id_departamento: true,
      sede: true,
      modalidad: true,
    });

    const v = validate();
    if (!v.ok) {
      showToast("Revisa los campos marcados en rojo.", "error");
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        const payload: CarreraUpdateDTO = { ...v.normalized };
        await carrerasService.update((editing as any).id_carrera, payload);
        showToast("Carrera actualizada correctamente.", "success");
      } else {
        const payload: CarreraCreateDTO = { ...v.normalized };
        await carrerasService.create(payload);
        showToast("Carrera creada correctamente.", "success");
      }

      closeModal();
      await fetchAll();
    } catch (e: any) {
      // Si backend manda error por UNIQUE (nombre/código), lo mostramos
      showToast(e?.response?.data?.message || "No se pudo guardar la carrera", "error");
    } finally {
      setLoading(false);
    }
  };

  const askToggleEstado = (c: Carrera) => {
    const id = (c as any).id_carrera as number;
    const current: Estado01 = toEstado01((c as any).estado);
    const willEnable = current === 0;

    setConfirmTitle(willEnable ? "Activar carrera" : "Desactivar carrera");
    setConfirmText(
      willEnable
        ? "¿Deseas activar esta carrera? Volverá a estar disponible en el sistema."
        : "¿Deseas desactivar esta carrera? No estará disponible para asignaciones nuevas."
    );

    setConfirmAction(() => async () => {
      setLoading(true);
      try {
        await carrerasService.toggleEstado(id, current);
        showToast(willEnable ? "Carrera activada." : "Carrera desactivada.", "success");
        await fetchAll();
      } catch (e: any) {
        showToast(e?.response?.data?.message || "No se pudo cambiar el estado", "error");
      } finally {
        setLoading(false);
        setConfirmOpen(false);
      }
    });

    setConfirmOpen(true);
  };

  const inputClass = (field: keyof FieldErrors) =>
    touched[field] && errors[field] ? "input input-error" : "input";

  const fieldError = (field: keyof FieldErrors) =>
    touched[field] && errors[field] ? <div className="field-error">{errors[field]}</div> : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Carreras</h2>
            <p className="subtitle">Gestión global de carreras (Súper Administrador).</p>
          </div>

          <button className="btnPrimary" onClick={openCreate}>
            + Nueva carrera
          </button>
        </div>

        {/* métricas */}
        <div className="chipsRow">
          <div className="chip">Total: <b>{totals.total}</b></div>
          <div className="chip">Activas: <b>{totals.active}</b></div>
          <div className="chip">Inactivas: <b>{totals.inactive}</b></div>
        </div>

        {/* filtros */}
        <div className="filtersRow">
          <input
            className="input"
            placeholder="Buscar por nombre, código, sede o modalidad..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            className="select"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value as any)}
          >
            <option value="ALL">Todas</option>
            <option value="ACTIVE">Activas</option>
            <option value="INACTIVE">Inactivas</option>
          </select>

          <button className="btnGhost" onClick={fetchAll}>
            Recargar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div className="muted">Cargando...</div>
        ) : (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Código</th>
                  <th>Carrera</th>
                  <th>Departamento</th>
                  <th>Sede</th>
                  <th>Modalidad</th>
                  <th>Estado</th>
                  <th style={{ width: 240 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  const id = (c as any).id_carrera as number;
                  const est: Estado01 = toEstado01((c as any).estado);
                  const depName =
                    departamentos.find(d => d.id_departamento === (c as any).id_departamento)?.nombre_departamento ??
                    `#${(c as any).id_departamento}`;

                  return (
                    <tr key={id}>
                      <td className="tdStrong">{id}</td>
                      <td className="tdCode">{String((c as any).codigo_carrera ?? "")}</td>
                      <td>{String((c as any).nombre_carrera ?? "")}</td>
                      <td>{depName}</td>
                      <td>{String((c as any).sede ?? "")}</td>
                      <td>{String((c as any).modalidad ?? "")}</td>
                      <td>
                        <span className={estadoBadgeClass(est)}>{estadoLabel(est)}</span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btnGhost" onClick={() => openEdit(c)}>
                            Editar
                          </button>
                          <button
                            className={est === 1 ? "btnDanger" : "btnSuccess"}
                            onClick={() => askToggleEstado(c)}
                          >
                            {est === 1 ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filtered.length && (
                  <tr>
                    <td colSpan={8} className="muted" style={{ padding: 14 }}>
                      No hay carreras para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {modalOpen && (
        <div className="modalOverlay" onMouseDown={closeModal}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{editing ? "Editar carrera" : "Nueva carrera"}</div>
              <button className="modalClose" onClick={closeModal}>✕</button>
            </div>

            <form onSubmit={onSubmit} className="modalBody">
              <label className="label">Nombre de carrera</label>
              <input
                className={inputClass("nombre_carrera")}
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  if (touched.nombre_carrera) validate({ nombre: e.target.value });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, nombre_carrera: true }));
                  validate();
                }}
                placeholder="Ej: Tecnologías de la Información"
              />
              {fieldError("nombre_carrera")}

              <label className="label">Código de carrera</label>
              <input
                className={inputClass("codigo_carrera")}
                value={codigo}
                onChange={(e) => {
                  // sugerencia: mantenerlo en mayúsculas y con _
                  const v = e.target.value.toUpperCase().replace(/\s+/g, "_");
                  setCodigo(v);
                  if (touched.codigo_carrera) validate({ codigo: v });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, codigo_carrera: true }));
                  validate();
                }}
                placeholder="Ej: TI_ENLINEA"
              />
              {fieldError("codigo_carrera")}

              <label className="label">Descripción (opcional)</label>
              <textarea
                className={touched.descripcion_carrera && errors.descripcion_carrera ? "textarea input-error" : "textarea"}
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  if (touched.descripcion_carrera) validate({ descripcion: e.target.value });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, descripcion_carrera: true }));
                  validate();
                }}
                placeholder="Descripción breve de la carrera (máx. 200)"
              />
              {fieldError("descripcion_carrera")}

              <label className="label">Departamento</label>
              <select
                className={inputClass("id_departamento")}
                value={idDepartamento}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : "";
                  setIdDepartamento(v);
                  if (touched.id_departamento) validate({ idDepartamento: v });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, id_departamento: true }));
                  validate();
                }}
              >
                <option value="">Seleccione departamento</option>
                {departamentos.map((d) => (
                  <option key={d.id_departamento} value={d.id_departamento}>
                    {d.nombre_departamento}
                  </option>
                ))}
              </select>
              {fieldError("id_departamento")}

              <label className="label">Sede / Campus</label>
              <select
                className={inputClass("sede")}
                value={sede}
                onChange={(e) => {
                  setSede(e.target.value);
                  if (touched.sede) validate({ sede: e.target.value });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, sede: true }));
                  validate();
                }}
              >
                <option value="">Seleccione sede</option>
                {SEDES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {fieldError("sede")}

              <label className="label">Modalidad</label>
              <select
                className={inputClass("modalidad")}
                value={modalidad}
                onChange={(e) => {
                  setModalidad(e.target.value);
                  if (touched.modalidad) validate({ modalidad: e.target.value });
                }}
                onBlur={() => {
                  setTouched((p) => ({ ...p, modalidad: true }));
                  validate();
                }}
              >
                <option value="">Seleccione modalidad</option>
                {MODALIDADES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              {fieldError("modalidad")}

              <div className="modalFooter">
                <button type="button" className="btnGhost" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btnPrimary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmOpen && (
        <div className="modalOverlay" onMouseDown={() => setConfirmOpen(false)}>
          <div className="modal confirm" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{confirmTitle}</div>
              <button className="modalClose" onClick={() => setConfirmOpen(false)}>✕</button>
            </div>

            <div className="modalBody">
              <p className="confirmText">{confirmText}</p>

              <div className="modalFooter">
                <button className="btnGhost" onClick={() => setConfirmOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="btnPrimary"
                  onClick={() => confirmAction?.()}
                  disabled={loading}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastOpen && (
        <div className={`toast toast-${toastType}`}>
          {toastMsg}
        </div>
      )}
    </div>
  );
}
