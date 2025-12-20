import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./CarrerasPage.css";

import { carrerasService, type CarreraCreateDTO, type CarreraUpdateDTO } from "../../services/carreras.service";
import type { Carrera, Estado01 } from "../../types/carrera";

type ToastType = "success" | "error" | "info";

function toEstado01(v: Estado01 | boolean): Estado01 {
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

function badgeEstadoLabel(estado: Estado01) {
  return estado === 1 ? "ACTIVA" : "INACTIVA";
}

function badgeEstadoClass(estado: Estado01) {
  return estado === 1 ? "badge badge-success" : "badge badge-danger";
}

export default function CarrerasPage() {
  const [rows, setRows] = useState<Carrera[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [q, setQ] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // modal create/edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Carrera | null>(null);

  const [nombre, setNombre] = useState("");
  const [sede, setSede] = useState("");
  const [modalidad, setModalidad] = useState("");

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

  useEffect(() => {
    fetchAll();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();

    return rows.filter((c) => {
      const est: Estado01 = toEstado01((c as any).estado ?? 1);

      if (estadoFilter === "ACTIVE" && est !== 1) return false;
      if (estadoFilter === "INACTIVE" && est !== 0) return false;

      if (!text) return true;

      const nombreCarrera = String((c as any).nombre_carrera ?? "").toLowerCase();
      const sedeCarrera = String((c as any).sede ?? "").toLowerCase();
      const modCarrera = String((c as any).modalidad ?? "").toLowerCase();

      return (
        nombreCarrera.includes(text) ||
        sedeCarrera.includes(text) ||
        modCarrera.includes(text)
      );
    });
  }, [rows, q, estadoFilter]);

  const totals = useMemo(() => {
    let active = 0;
    let inactive = 0;
    for (const c of rows) {
      const est: Estado01 = toEstado01((c as any).estado ?? 1);
      if (est === 1) active++;
      else inactive++;
    }
    return { total: rows.length, active, inactive };
  }, [rows]);

  const openCreate = () => {
    setEditing(null);
    setNombre("");
    setSede("");
    setModalidad("");
    setModalOpen(true);
  };

  const openEdit = (c: Carrera) => {
    setEditing(c);
    setNombre(String((c as any).nombre_carrera ?? ""));
    setSede(String((c as any).sede ?? ""));
    setModalidad(String((c as any).modalidad ?? ""));
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return showToast("El nombre de la carrera es obligatorio.", "error");
    if (!sede.trim()) return showToast("La sede es obligatoria.", "error");
    if (!modalidad.trim()) return showToast("La modalidad es obligatoria.", "error");

    setLoading(true);
    try {
      if (editing) {
        const payload: CarreraUpdateDTO = {
          nombre_carrera: nombre.trim(),
          sede: sede.trim(),
          modalidad: modalidad.trim(),
        };
        await carrerasService.update((editing as any).id_carrera, payload);
        showToast("Carrera actualizada correctamente.", "success");
      } else {
        const payload: CarreraCreateDTO = {
          nombre_carrera: nombre.trim(),
          sede: sede.trim(),
          modalidad: modalidad.trim(),
        };
        await carrerasService.create(payload);
        showToast("Carrera creada correctamente.", "success");
      }

      closeModal();
      await fetchAll();
    } catch (e: any) {
      showToast(e?.response?.data?.message || "No se pudo guardar la carrera", "error");
    } finally {
      setLoading(false);
    }
  };

  const askToggleEstado = (c: Carrera) => {
    const id = (c as any).id_carrera as number;
    const current: Estado01 = toEstado01((c as any).estado ?? 1);
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
            placeholder="Buscar por nombre, sede o modalidad..."
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
                  <th>Carrera</th>
                  <th>Sede</th>
                  <th>Modalidad</th>
                  <th>Estado</th>
                  <th style={{ width: 220 }}>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((c) => {
                  const id = (c as any).id_carrera as number;
                  const est: Estado01 = toEstado01((c as any).estado ?? 1);

                  return (
                    <tr key={id}>
                      <td className="tdStrong">{id}</td>
                      <td>{String((c as any).nombre_carrera ?? "")}</td>
                      <td>{String((c as any).sede ?? "")}</td>
                      <td>{String((c as any).modalidad ?? "")}</td>
                      <td>
                        <span className={badgeEstadoClass(est)}>{badgeEstadoLabel(est)}</span>
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
                    <td colSpan={6} className="muted" style={{ padding: 14 }}>
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
              <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />

              <label className="label">Sede</label>
              <input className="input" value={sede} onChange={(e) => setSede(e.target.value)} />

              <label className="label">Modalidad</label>
              <input className="input" value={modalidad} onChange={(e) => setModalidad(e.target.value)} />

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
