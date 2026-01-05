import { useEffect, useMemo, useState } from "react";
import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { misTribunalesService } from "../../services/misTribunales.service";
import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";

import { Eye, Search, RefreshCcw } from "lucide-react";
import DocenteTribunalModal from "./DocenteTribunalModal";

import "./MisTribunalesPage.css";

const PAGE_SIZE = 10;

type ToastType = "success" | "error" | "info";

export default function MisTribunalesPage() {
  const [tribunales, setTribunales] = useState<Tribunal[]>([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [search, setSearch] = useState("");

  // paginación
  const [page, setPage] = useState(1);

  // modal
  const [showView, setShowView] = useState(false);
  const [viewTribunal, setViewTribunal] = useState<Tribunal | null>(null);

  // asignaciones del tribunal seleccionado
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [loadingAsign, setLoadingAsign] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const data = await misTribunalesService.list();
      setTribunales(data ?? []);
    } catch {
      showToast("Error al cargar mis tribunales", "error");
      setTribunales([]);
    } finally {
      setLoading(false);
    }
  }

  async function openView(t: Tribunal) {
    setViewTribunal(t);
    setShowView(true);
    await loadAsignaciones(t.id_tribunal);
  }

  async function loadAsignaciones(idTribunal: number) {
    try {
      setLoadingAsign(true);
      const data = await tribunalEstudiantesService.list({
        tribunalId: idTribunal,
        includeInactive: false,
        page: 1,
        limit: 100,
      });
      setAsignaciones(data ?? []);
    } catch {
      showToast("No se pudieron cargar las asignaciones del tribunal", "error");
      setAsignaciones([]);
    } finally {
      setLoadingAsign(false);
    }
  }

  // filtrado + orden
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    return tribunales
      .filter((t) => {
        if (!q) return true;
        const name = (t.nombre_tribunal || "").toLowerCase();
        const carrera = (t.nombre_carrera || "").toLowerCase();
        const periodo = (t.codigo_periodo || "").toLowerCase();
        const caso = String(t.caso ?? "").toLowerCase();
        return name.includes(q) || carrera.includes(q) || periodo.includes(q) || caso.includes(q);
      })
      .sort((a, b) => (a.nombre_tribunal || "").localeCompare(b.nombre_tribunal || "", "es"));
  }, [tribunales, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const pageData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  // resumen
  const total = tribunales.length;

  return (
    <div className="page">
      {/* HEADER */}
      <div className="card">
        <div className="headerRow">
          <div>
            <h2 className="title">Mis tribunales</h2>
            <p className="subtitle">
              Aquí verás los tribunales donde estás asignado y podrás revisar estudiantes/franjas para calificar.
            </p>
          </div>

          <button className="btnSecondary" onClick={loadAll} title="Actualizar">
            <RefreshCcw size={18} /> Actualizar
          </button>
        </div>

        {/* RESUMEN + FILTROS */}
        <div className="summaryRow">
          <div className="summaryBoxes">
            <div className="summaryBox">
              <span className="label">Total</span>
              <span className="value">{total}</span>
            </div>
          </div>

          <div className="summaryActions">
            <div className="searchInline">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por tribunal, carrera, período o caso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="card tableWrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tribunal</th>
              <th>Carrera</th>
              <th>Período</th>
              <th>Caso</th>
              <th className="thActions">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
                  Cargando...
                </td>
              </tr>
            ) : pageData.length ? (
              pageData.map((t) => (
                <tr key={t.id_tribunal}>
                  <td className="tdStrong">{t.nombre_tribunal || "-"}</td>
                  <td>{t.nombre_carrera || "-"}</td>
                  <td>{t.codigo_periodo || "-"}</td>
                  <td className="tdCode">{t.caso ?? "-"}</td>

                  <td className="actions">
                    <button className="btnIcon btnView" title="Ver" onClick={() => openView(t)}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="muted" style={{ padding: 16 }}>
                  No tienes tribunales asignados.
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

      {/* MODAL */}
      {showView && viewTribunal && (
        <DocenteTribunalModal
          tribunal={viewTribunal}
          asignaciones={asignaciones}
          loadingAsignaciones={loadingAsign}
          onClose={() => setShowView(false)}
          onRefreshAsignaciones={() => loadAsignaciones(viewTribunal.id_tribunal)}
          onCalificar={(a: TribunalEstudiante) => {
            showToast(
              `Calificar: ${a.apellidos_estudiante || ""} ${a.nombres_estudiante || ""} (${a.id_institucional_estudiante || ""})`,
              "info"
            );
          }}
        />
      )}

      {/* TOAST */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
