import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricaEditorPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  tipo_rubrica: "ORAL" | "ESCRITA";
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  ponderacion_global: number | string;
  estado: number;
};

type Nivel = {
  id_nivel: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden_nivel?: number;
  estado: number;
};

type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  id_componente: number;
  ponderacion_porcentaje: number | string;
  orden_componente: number;
  estado: number;
  nombre_componente?: string;
};

type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;
  id_rubrica_componente: number;
  id_criterio: number;
  id_nivel: number;
  descripcion: string;
  estado: number;

  // opcional si tu API los devuelve
  nombre_criterio?: string;
};

const toNum = (v: any) => Number(String(v ?? "").replace(",", "."));
const str = (v: any) => (v === null || v === undefined ? "" : String(v));

export default function RubricaEditorPage() {
  const { idRubrica } = useParams();
  const rid = Number(idRubrica);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [rubricaComponentes, setRubricaComponentes] = useState<RubricaComponente[]>([]);
  const [grid, setGrid] = useState<Record<number, RubricaCriterioNivel[]>>({});

  // crear nivel
  const [nivelForm, setNivelForm] = useState({ nombre: "", valor: "1", orden: "1" });

  // crear componente (todo aquí)
  const [compForm, setCompForm] = useState({ nombre: "", ponderacion: "100", orden: "1" });

  // crear criterio por componente
  const [critNameByComp, setCritNameByComp] = useState<Record<number, string>>({});

  // debounce autosave celdas
  const saveTimers = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!rid) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rRub, rNiv, rRC] = await Promise.all([
        axiosClient.get(`/rubricas/${rid}`),
        axiosClient.get("/niveles", { params: { includeInactive: true } }),
        axiosClient.get("/rubricas-componentes", { params: { rubricaId: rid, includeInactive: true } }),
      ]);

      setRubrica(rRub.data);

      const nivs: Nivel[] = (rNiv.data ?? []).filter((x: Nivel) => x.estado === 1);
      setNiveles(nivs);

      const comps: RubricaComponente[] = rRC.data ?? [];
      setRubricaComponentes(comps);

      const map: Record<number, RubricaCriterioNivel[]> = {};
      await Promise.all(
        comps.map(async (c) => {
          const rGrid = await axiosClient.get("/rubricas-criterios-niveles", {
            params: { componenteId: c.id_rubrica_componente, includeInactive: true },
          });
          map[c.id_rubrica_componente] = (rGrid.data ?? []).map((row: any) => ({
            ...row,
            id_rubrica_componente: row.id_rubrica_componente ?? row.id_componente,
          }));
        })
      );
      setGrid(map);

      // orden sugerido para crear nivel
      setNivelForm((p) => ({ ...p, orden: String(nivs.length + 1) }));
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el editor de rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const reloadComponentes = async () => {
    const rRC = await axiosClient.get("/rubricas-componentes", {
      params: { rubricaId: rid, includeInactive: true },
    });
    const comps: RubricaComponente[] = rRC.data ?? [];
    setRubricaComponentes(comps);

    const map: Record<number, RubricaCriterioNivel[]> = {};
    await Promise.all(
      comps.map(async (c) => {
        const rGrid = await axiosClient.get("/rubricas-criterios-niveles", {
          params: { componenteId: c.id_rubrica_componente, includeInactive: true },
        });
        map[c.id_rubrica_componente] = (rGrid.data ?? []).map((row: any) => ({
          ...row,
          id_rubrica_componente: row.id_rubrica_componente ?? row.id_componente,
        }));
      })
    );
    setGrid(map);
  };

  // ================== GUARDAR INFO RÚBRICA ==================
  const saveRubricaInfo = async () => {
    if (!rubrica) return;
    try {
      await axiosClient.put(`/rubricas/${rubrica.id_rubrica}`, {
        id_periodo: rubrica.id_periodo,
        tipo_rubrica: rubrica.tipo_rubrica,
        ponderacion_global: toNum(rubrica.ponderacion_global),
        nombre_rubrica: rubrica.nombre_rubrica,
        descripcion_rubrica: rubrica.descripcion_rubrica ?? null,
      });
      alert("Rúbrica guardada");
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la rúbrica");
    }
  };

  // ================== NIVELES (crear aquí) ==================
  const createNivel = async () => {
    const nombre = nivelForm.nombre.trim();
    if (!nombre) return alert("Escribe el nombre del nivel");
    try {
      await axiosClient.post("/niveles", {
        nombre_nivel: nombre,
        valor_nivel: Number(nivelForm.valor),
        orden_nivel: Number(nivelForm.orden),
      });
      setNivelForm({ nombre: "", valor: "1", orden: String(niveles.length + 2) });
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el nivel");
    }
  };

  // ================== COMPONENTE (crear aquí) ==================
  const createComponenteAndAssign = async () => {
    const nombre = compForm.nombre.trim();
    if (!nombre) return alert("Escribe el nombre del componente");
    try {
      const rComp = await axiosClient.post("/componentes", { nombre_componente: nombre });
      const idComp = rComp.data?.id_componente;
      if (!idComp) throw new Error("No vino id_componente");

      await axiosClient.post("/rubricas-componentes", {
        id_rubrica: rid,
        id_componente: idComp,
        ponderacion_porcentaje: toNum(compForm.ponderacion),
        orden_componente: Number(compForm.orden),
      });

      setCompForm({ nombre: "", ponderacion: "100", orden: "1" });
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear/asignar el componente");
    }
  };

  const updateRubricaComponente = async (rc: RubricaComponente) => {
    try {
      await axiosClient.put(`/rubricas-componentes/${rc.id_rubrica_componente}`, {
        ponderacion_porcentaje: toNum(rc.ponderacion_porcentaje),
        orden_componente: Number(rc.orden_componente),
      });
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar el componente");
    }
  };

  const toggleComponenteEstado = async (rc: RubricaComponente) => {
    try {
      await axiosClient.patch(`/rubricas-componentes/${rc.id_rubrica_componente}/estado`, {
        estado: rc.estado !== 1,
      });
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar estado del componente");
    }
  };

  // ================== CRITERIO (crear aquí) ==================
  const createCriterioForComponente = async (idRubricaComponente: number) => {
    const nombre = (critNameByComp[idRubricaComponente] ?? "").trim();
    if (!nombre) return alert("Escribe el nombre del criterio");

    if (niveles.length === 0) {
      return alert("Primero crea los niveles (columnas). Sin niveles no se puede crear la tabla.");
    }

    try {
      const rCrit = await axiosClient.post("/criterios", { nombre_criterio: nombre });
      const idCrit = rCrit.data?.id_criterio;
      if (!idCrit) throw new Error("No vino id_criterio");

      // crea celdas para cada nivel
      await Promise.all(
        niveles.map((niv) =>
          axiosClient.post("/rubricas-criterios-niveles", {
            id_componente: idRubricaComponente, // tu API lo llama id_componente
            id_criterio: idCrit,
            id_nivel: niv.id_nivel,
            descripcion: "",
          })
        )
      );

      setCritNameByComp((p) => ({ ...p, [idRubricaComponente]: "" }));
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el criterio");
    }
  };

  // ================== GRID helpers ==================
  const rowsByComp = (idRubricaComponente: number) => {
    const cells = grid[idRubricaComponente] ?? [];
    const byCrit: Record<number, RubricaCriterioNivel[]> = {};
    for (const c of cells) {
      if (!byCrit[c.id_criterio]) byCrit[c.id_criterio] = [];
      byCrit[c.id_criterio].push(c);
    }
    return Object.keys(byCrit).map((k) => ({ id_criterio: Number(k), cells: byCrit[Number(k)] }));
  };

  const criterioNombre = (row: { id_criterio: number; cells: RubricaCriterioNivel[] }) => {
    // si tu API devuelve nombre_criterio en cada celda, usamos eso
    const n = row.cells.find((c) => c.nombre_criterio)?.nombre_criterio;
    return n ?? `Criterio #${row.id_criterio}`;
  };

  const setCellText = (idRubricaComponente: number, id_criterio: number, id_nivel: number, text: string) => {
    setGrid((prev) => {
      const cells = [...(prev[idRubricaComponente] ?? [])];
      const idx = cells.findIndex((x) => x.id_criterio === id_criterio && x.id_nivel === id_nivel);
      if (idx >= 0) cells[idx] = { ...cells[idx], descripcion: text };
      return { ...prev, [idRubricaComponente]: cells };
    });

    const key = `${idRubricaComponente}_${id_criterio}_${id_nivel}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => saveCell(idRubricaComponente, id_criterio, id_nivel), 500);
  };

  const saveCell = async (idRubricaComponente: number, id_criterio: number, id_nivel: number) => {
    const cells = grid[idRubricaComponente] ?? [];
    const cell = cells.find((x) => x.id_criterio === id_criterio && x.id_nivel === id_nivel);
    if (!cell) return;
    try {
      await axiosClient.put(`/rubricas-criterios-niveles/${cell.id_rubrica_criterio_nivel}`, {
        descripcion: cell.descripcion ?? "",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRow = async (idRubricaComponente: number, id_criterio: number) => {
    const cells = (grid[idRubricaComponente] ?? []).filter((x) => x.id_criterio === id_criterio);
    if (cells.length === 0) return;

    try {
      await Promise.all(
        cells.map((c) =>
          axiosClient.patch(`/rubricas-criterios-niveles/${c.id_rubrica_criterio_nivel}/estado`, { estado: false })
        )
      );
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el criterio");
    }
  };

  const totalComp = useMemo(() => {
    return rubricaComponentes
      .filter((x) => x.estado === 1)
      .reduce((acc, x) => acc + toNum(x.ponderacion_porcentaje), 0);
  }, [rubricaComponentes]);

  return (
    <div className="re-page">
      <div className="re-top">
        <div>
          <div className="re-breadcrumb" onClick={() => navigate("/rubricas")}>
            Rúbricas
          </div>
          <h1 className="re-title">{rubrica ? `Editar Rúbrica (${rubrica.tipo_rubrica})` : "Cargando..."}</h1>
        </div>

        <div className="re-top-actions">
          <button className="btn ghost" onClick={() => navigate("/rubricas")}>
            Volver
          </button>
          <button className="btn primary" onClick={saveRubricaInfo} disabled={!rubrica || loading}>
            Guardar Rúbrica
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card">
        <div className="card-head">Información General de la Rúbrica</div>
        <div className="card-body">
          <label className="lbl">Nombre de la Rúbrica</label>
          <input
            className="inp"
            value={rubrica?.nombre_rubrica ?? ""}
            onChange={(e) => setRubrica((p) => (p ? { ...p, nombre_rubrica: e.target.value } : p))}
            placeholder="Ej: Rúbrica Evaluación Oral TI 2024S1"
          />
        </div>
      </div>

      {/* Niveles */}
      <div className="card">
        <div className="card-head">Niveles de Calificación (Columnas)</div>
        <div className="card-body">
          <div className="levels-table">
            <div className="levels-head">
              <div>Nombre</div>
              <div>Valor</div>
              <div>Orden</div>
            </div>

            {niveles.map((n) => (
              <div key={n.id_nivel} className="levels-row">
                <div>{n.nombre_nivel}</div>
                <div>{n.valor_nivel}</div>
                <div>{n.orden_nivel ?? "-"}</div>
              </div>
            ))}

            {niveles.length === 0 && <div className="muted">No existen niveles. Crea los niveles aquí.</div>}
          </div>

          <div className="inline-form">
            <input
              className="inp"
              placeholder="Nombre nivel (Ej: Muy Bueno)"
              value={nivelForm.nombre}
              onChange={(e) => setNivelForm((p) => ({ ...p, nombre: e.target.value }))}
            />
            <input
              className="inp"
              type="number"
              placeholder="Valor"
              value={nivelForm.valor}
              onChange={(e) => setNivelForm((p) => ({ ...p, valor: e.target.value }))}
            />
            <input
              className="inp"
              type="number"
              placeholder="Orden"
              value={nivelForm.orden}
              onChange={(e) => setNivelForm((p) => ({ ...p, orden: e.target.value }))}
            />
            <button className="btn primary" onClick={createNivel} disabled={loading}>
              + Crear Nivel
            </button>
          </div>
        </div>
      </div>

      <div className="re-section-title">Componentes y Criterios de la Rúbrica</div>

      {/* Crear componente aquí */}
      <div className="card">
        <div className="card-head between">
          <div>Agregar componente a la rúbrica</div>
          <div className={`pill ${totalComp === 100 ? "ok" : ""}`}>Total activo: {totalComp.toFixed(2)}%</div>
        </div>
        <div className="card-body grid3">
          <div>
            <label className="lbl">Nombre del componente</label>
            <input
              className="inp"
              placeholder="Ej: Parte Oral, Parte Escrita, Presentación..."
              value={compForm.nombre}
              onChange={(e) => setCompForm((p) => ({ ...p, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="lbl">Ponderación (%)</label>
            <input className="inp" value={compForm.ponderacion} onChange={(e) => setCompForm((p) => ({ ...p, ponderacion: e.target.value }))} />
          </div>
          <div>
            <label className="lbl">Orden</label>
            <input className="inp" value={compForm.orden} onChange={(e) => setCompForm((p) => ({ ...p, orden: e.target.value }))} />
          </div>
          <div className="end" style={{ gridColumn: "1 / -1" }}>
            <button className="btn primary" onClick={createComponenteAndAssign} disabled={loading}>
              + Añadir Nuevo Componente
            </button>
          </div>
        </div>
      </div>

      {/* Componentes */}
      {rubricaComponentes
        .sort((a, b) => a.orden_componente - b.orden_componente)
        .map((rc, idx) => (
          <div key={rc.id_rubrica_componente} className="card">
            <div className="card-head between">
              <div>Componente {idx + 1}</div>
              <div className="inline">
                <button className="btn tiny ghost" onClick={() => updateRubricaComponente(rc)}>
                  Guardar
                </button>
                <button className={`btn tiny ${rc.estado === 1 ? "danger" : "ghost"}`} onClick={() => toggleComponenteEstado(rc)}>
                  {rc.estado === 1 ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>

            <div className="card-body">
              <div className="comp-row">
                <div>
                  <label className="lbl">Nombre del Componente</label>
                  <div className="readonly">{rc.nombre_componente ?? "—"}</div>
                </div>

                <div>
                  <label className="lbl">Ponderación (%)</label>
                  <input
                    className="inp"
                    value={str(rc.ponderacion_porcentaje)}
                    onChange={(e) =>
                      setRubricaComponentes((p) =>
                        p.map((x) =>
                          x.id_rubrica_componente === rc.id_rubrica_componente
                            ? { ...x, ponderacion_porcentaje: e.target.value }
                            : x
                        )
                      )
                    }
                  />
                </div>

                <div>
                  <label className="lbl">Orden</label>
                  <input
                    className="inp"
                    value={str(rc.orden_componente)}
                    onChange={(e) =>
                      setRubricaComponentes((p) =>
                        p.map((x) =>
                          x.id_rubrica_componente === rc.id_rubrica_componente
                            ? { ...x, orden_componente: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                  />
                </div>
              </div>

              {/* crear criterio aquí */}
              <div className="add-criterio">
                <input
                  className="inp"
                  value={critNameByComp[rc.id_rubrica_componente] ?? ""}
                  onChange={(e) =>
                    setCritNameByComp((p) => ({ ...p, [rc.id_rubrica_componente]: e.target.value }))
                  }
                  placeholder="Nombre del criterio (Ej: Claridad, Argumentación...)"
                />
                <button className="btn primary" onClick={() => createCriterioForComponente(rc.id_rubrica_componente)}>
                  + Añadir Criterio
                </button>
              </div>

              {/* tabla */}
              <div className="grid-table-wrap">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>Criterio</th>
                      {niveles.map((n) => (
                        <th key={n.id_nivel}>
                          {n.nombre_nivel} ({n.valor_nivel})
                        </th>
                      ))}
                      <th>Acción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rowsByComp(rc.id_rubrica_componente).length === 0 ? (
                      <tr>
                        <td colSpan={niveles.length + 2} className="td-center">
                          Aún no hay criterios en este componente
                        </td>
                      </tr>
                    ) : (
                      rowsByComp(rc.id_rubrica_componente).map((row) => (
                        <tr key={row.id_criterio}>
                          <td className="crit-cell">
                            <textarea className="ta" value={criterioNombre(row)} readOnly />
                          </td>

                          {niveles.map((niv) => {
                            const cell = row.cells.find((x) => x.id_nivel === niv.id_nivel);
                            return (
                              <td key={niv.id_nivel}>
                                <textarea
                                  className="ta"
                                  value={cell?.descripcion ?? ""}
                                  onChange={(e) => setCellText(rc.id_rubrica_componente, row.id_criterio, niv.id_nivel, e.target.value)}
                                  placeholder="Descripción…"
                                />
                              </td>
                            );
                          })}

                          <td className="td-action">
                            <button className="btn icon danger" onClick={() => deleteRow(rc.id_rubrica_componente, row.id_criterio)}>
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="muted small">Los textos se guardan automáticamente al escribir.</div>
            </div>
          </div>
        ))}
    </div>
  );
}
