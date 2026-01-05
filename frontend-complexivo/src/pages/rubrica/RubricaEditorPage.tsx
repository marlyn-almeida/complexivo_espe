import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricaEditorPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

type RubricaNivel = {
  id_rubrica_nivel: number;
  id_rubrica: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden_nivel: number;
  estado: number;
};

type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO";
  ponderacion: number;
  orden: number;
  estado: number;
};

type RubricaCriterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  orden: number;
  estado: number;
};

type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  descripcion: string;
  estado: number;
  // opcional si backend devuelve join
  nombre_nivel?: string;
  valor_nivel?: number;
  orden_nivel?: number;
};

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function RubricaEditorPage() {
  const { idRubrica } = useParams();
  const rid = Number(idRubrica);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  // Info general
  const [nombreRubrica, setNombreRubrica] = useState("");
  const [descRubrica, setDescRubrica] = useState<string>("");

  // Niveles
  const [niveles, setNiveles] = useState<RubricaNivel[]>([]);

  // Componentes
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);

  // Criterios por componente
  const [criteriosByComp, setCriteriosByComp] = useState<Record<number, RubricaCriterio[]>>({});

  // Celdas por criterio (map clave: `${criterioId}-${nivelId}`)
  const [celdasByCriterio, setCeldasByCriterio] = useState<Record<number, Record<number, RubricaCriterioNivel>>>({});

  // Drafts de texto por celda (para escribir sin lag)
  const [draftCell, setDraftCell] = useState<Record<string, string>>({});

  // Para evitar spamear upsert si el usuario tabula rápido
  const saveTimers = useRef<Record<string, any>>({});

  const nivelesActivos = useMemo(
    () => niveles.filter((n) => n.estado === 1).sort((a, b) => a.orden_nivel - b.orden_nivel),
    [niveles]
  );

  const componentesActivos = useMemo(
    () => componentes.slice().sort((a, b) => a.orden - b.orden),
    [componentes]
  );

  const totalPonderacionActiva = useMemo(() => {
    return componentes
      .filter((c) => c.estado === 1)
      .reduce((acc, c) => acc + toNum(c.ponderacion, 0), 0);
  }, [componentes]);

  // ---------------------------
  // LOADERS
  // ---------------------------
  const loadRubrica = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}`);
    const r = res.data as Rubrica;
    setRubrica(r);
    setNombreRubrica(r?.nombre_rubrica ?? "");
    setDescRubrica(r?.descripcion_rubrica ?? "");
  };

  const loadNiveles = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}/niveles`, {
      params: { includeInactive: true },
    });
    setNiveles((res.data ?? []) as RubricaNivel[]);
  };

  const loadComponentes = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}/componentes`, {
      params: { includeInactive: true },
    });
    setComponentes((res.data ?? []) as RubricaComponente[]);
  };

  const loadCriteriosDeComponente = async (idComp: number) => {
    const res = await axiosClient.get(`/componentes/${idComp}/criterios`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaCriterio[];
    setCriteriosByComp((prev) => ({ ...prev, [idComp]: arr }));
    return arr;
  };

  const loadCeldasDeCriterio = async (criterioId: number) => {
    const res = await axiosClient.get(`/criterios/${criterioId}/niveles`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaCriterioNivel[];

    // normalizar a map por nivelId
    const map: Record<number, RubricaCriterioNivel> = {};
    for (const rcn of arr) {
      map[toNum((rcn as any).id_rubrica_nivel)] = rcn;
    }

    setCeldasByCriterio((prev) => ({ ...prev, [criterioId]: map }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRubrica(), loadNiveles(), loadComponentes()]);

      // cargar criterios y celdas (en paralelo)
      const comps = await axiosClient.get(`/rubricas/${rid}/componentes`, {
        params: { includeInactive: true },
      });
      const compArr = (comps.data ?? []) as RubricaComponente[];

      setComponentes(compArr);

      const criteriosPromises = compArr.map((c) => loadCriteriosDeComponente(c.id_rubrica_componente));
      const criteriosArrays = await Promise.all(criteriosPromises);

      const allCriterios = criteriosArrays.flat();
      await Promise.all(allCriterios.map((cr) => loadCeldasDeCriterio(cr.id_rubrica_criterio)));
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el editor de rúbrica");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!rid) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  // ---------------------------
  // ACCIONES: RUBRICA
  // ---------------------------
  const saveRubrica = async () => {
    try {
      setLoading(true);
      await axiosClient.put(`/rubricas/${rid}`, {
        nombre_rubrica: nombreRubrica.trim(),
        descripcion_rubrica: descRubrica.trim() ? descRubrica.trim() : null,
        ponderacion_global: 100,
      });
      await loadRubrica();
      alert("Rúbrica actualizada");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // ACCIONES: NIVELES
  // ---------------------------
  const addNivel = async () => {
    try {
      const orden = (nivelesActivos.at(-1)?.orden_nivel ?? 0) + 1;
      await axiosClient.post(`/rubricas/${rid}/niveles`, {
        nombre_nivel: "Nuevo nivel",
        valor_nivel: 0,
        orden_nivel: orden,
      });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el nivel");
    }
  };

  const updateNivel = async (nivelId: number, patch: Partial<RubricaNivel>) => {
    const current = niveles.find((n) => n.id_rubrica_nivel === nivelId);
    if (!current) return;

    try {
      await axiosClient.put(`/rubricas/${rid}/niveles/${nivelId}`, {
        nombre_nivel: patch.nombre_nivel ?? current.nombre_nivel,
        valor_nivel: patch.valor_nivel ?? current.valor_nivel,
        orden_nivel: patch.orden_nivel ?? current.orden_nivel,
      });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el nivel");
    }
  };

  const deleteNivel = async (nivelId: number) => {
    if (!confirm("¿Eliminar este nivel?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/niveles/${nivelId}/estado`, { estado: false });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el nivel");
    }
  };

  // ---------------------------
  // ACCIONES: COMPONENTES
  // ---------------------------
  const addComponente = async () => {
    try {
      const orden = (componentesActivos.at(-1)?.orden ?? 0) + 1;
      await axiosClient.post(`/rubricas/${rid}/componentes`, {
        nombre_componente: `Componente ${orden}`,
        tipo_componente: "OTRO",
        ponderacion: 0,
        orden,
      });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el componente");
    }
  };

  const updateComponente = async (comp: RubricaComponente, patch: Partial<RubricaComponente>) => {
    try {
      await axiosClient.put(`/rubricas/${rid}/componentes/${comp.id_rubrica_componente}`, {
        nombre_componente: patch.nombre_componente ?? comp.nombre_componente,
        tipo_componente: patch.tipo_componente ?? comp.tipo_componente,
        ponderacion: patch.ponderacion ?? comp.ponderacion,
        orden: patch.orden ?? comp.orden,
      });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el componente");
    }
  };

  const deleteComponente = async (compId: number) => {
    if (!confirm("¿Eliminar este componente?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/componentes/${compId}/estado`, { estado: false });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el componente");
    }
  };

  // ---------------------------
  // ACCIONES: CRITERIOS
  // ---------------------------
  const addCriterio = async (compId: number) => {
    try {
      const arr = criteriosByComp[compId] ?? [];
      const orden = (arr.filter((x) => x.estado === 1).sort((a, b) => a.orden - b.orden).at(-1)?.orden ?? 0) + 1;

      await axiosClient.post(`/componentes/${compId}/criterios`, {
        nombre_criterio: "Nuevo criterio",
        orden,
      });

      const nuevos = await loadCriteriosDeComponente(compId);
      const creado = nuevos.find((x) => x.orden === orden) ?? nuevos.at(-1);
      if (creado?.id_rubrica_criterio) {
        await loadCeldasDeCriterio(creado.id_rubrica_criterio);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el criterio");
    }
  };

  const updateCriterio = async (compId: number, criterio: RubricaCriterio, patch: Partial<RubricaCriterio>) => {
    try {
      await axiosClient.put(`/componentes/${compId}/criterios/${criterio.id_rubrica_criterio}`, {
        nombre_criterio: patch.nombre_criterio ?? criterio.nombre_criterio,
        orden: patch.orden ?? criterio.orden,
      });
      await loadCriteriosDeComponente(compId);
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el criterio");
    }
  };

  const deleteCriterio = async (compId: number, criterioId: number) => {
    if (!confirm("¿Eliminar este criterio?")) return;
    try {
      await axiosClient.patch(`/componentes/${compId}/criterios/${criterioId}/estado`, { estado: false });
      await loadCriteriosDeComponente(compId);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el criterio");
    }
  };

  // ---------------------------
  // ACCIONES: CELDAS (UPSERT)
  // ---------------------------
  const getCellKey = (criterioId: number, nivelId: number) => `${criterioId}-${nivelId}`;

  const getCellValue = (criterioId: number, nivelId: number) => {
    const key = getCellKey(criterioId, nivelId);
    if (draftCell[key] !== undefined) return draftCell[key];
    const cell = celdasByCriterio[criterioId]?.[nivelId];
    return cell?.descripcion ?? "";
  };

  const scheduleUpsert = (criterioId: number, nivelId: number, value: string) => {
    const key = getCellKey(criterioId, nivelId);

    // actualizar draft inmediato
    setDraftCell((prev) => ({ ...prev, [key]: value }));

    // debounce simple
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await axiosClient.post(`/criterios/${criterioId}/niveles`, {
          id_rubrica_nivel: nivelId,
          descripcion: value ?? "",
        });
        // refrescar celdas del criterio (para tener id_rubrica_criterio_nivel si se creó)
        await loadCeldasDeCriterio(criterioId);
      } catch (e) {
        console.error(e);
        // no alert en cada celda, molesta demasiado; solo log
      }
    }, 250);
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="re-page">
      {/* Breadcrumb / título como en tus capturas */}
      <div style={{ marginBottom: 12 }}>
        <div className="re-breadcrumb">
          <span className="link" onClick={() => navigate("/rubricas")}>Rúbricas</span>
          <span> / </span>
          <span>
            Editar Rúbrica: <b>{nombreRubrica || "—"}</b>
          </span>
        </div>
      </div>

      {/* Info General */}
      <div className="card">
        <div className="card-head">Información General de la Rúbrica</div>
        <div className="card-body">
          <label className="lbl">Nombre de la Rúbrica</label>
          <input
            className="inp"
            placeholder="Ej: Rúbrica Evaluación Oral TI 202451"
            value={nombreRubrica}
            onChange={(e) => setNombreRubrica(e.target.value)}
          />
        </div>
      </div>

      {/* Niveles */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">Niveles de Calificación (Columnas)</div>
        <div className="card-body">
          <div className="levels">
            {nivelesActivos.map((n) => (
              <div className="level-line" key={n.id_rubrica_nivel}>
                <input
                  className="inp"
                  value={n.nombre_nivel}
                  onChange={(e) =>
                    setNiveles((prev) =>
                      prev.map((x) =>
                        x.id_rubrica_nivel === n.id_rubrica_nivel ? { ...x, nombre_nivel: e.target.value } : x
                      )
                    )
                  }
                  onBlur={() => updateNivel(n.id_rubrica_nivel, { nombre_nivel: n.nombre_nivel })}
                />
                <input
                  className="inp"
                  type="number"
                  value={n.valor_nivel}
                  onChange={(e) =>
                    setNiveles((prev) =>
                      prev.map((x) =>
                        x.id_rubrica_nivel === n.id_rubrica_nivel ? { ...x, valor_nivel: toNum(e.target.value) } : x
                      )
                    )
                  }
                  onBlur={() => updateNivel(n.id_rubrica_nivel, { valor_nivel: n.valor_nivel })}
                />
                <button className="btn icon danger" onClick={() => deleteNivel(n.id_rubrica_nivel)} title="Eliminar nivel">
                  🗑
                </button>
              </div>
            ))}

            <button className="btn success" onClick={addNivel} disabled={loading}>
              + Añadir Nivel de Calificación
            </button>
          </div>
        </div>
      </div>

      {/* Componentes y criterios */}
      <div style={{ marginTop: 18 }}>
        <h2 className="section-title">Componentes y Criterios de la Rúbrica</h2>

        {componentesActivos
          .filter((c) => c.estado === 1)
          .map((comp, idx) => {
            const criterios = (criteriosByComp[comp.id_rubrica_componente] ?? [])
              .filter((x) => x.estado === 1)
              .sort((a, b) => a.orden - b.orden);

            return (
              <div className="card" key={comp.id_rubrica_componente} style={{ marginTop: 12 }}>
                <div className="card-head between">
                  <div>Componente {idx + 1}</div>
                  <button className="btn danger" onClick={() => deleteComponente(comp.id_rubrica_componente)}>
                    Eliminar Componente
                  </button>
                </div>

                <div className="card-body">
                  <div className="grid2">
                    <div>
                      <label className="lbl">Nombre del Componente</label>
                      <input
                        className="inp"
                        placeholder="Ej: Parte Escrita"
                        value={comp.nombre_componente}
                        onChange={(e) =>
                          setComponentes((prev) =>
                            prev.map((x) =>
                              x.id_rubrica_componente === comp.id_rubrica_componente
                                ? { ...x, nombre_componente: e.target.value }
                                : x
                            )
                          )
                        }
                        onBlur={() => updateComponente(comp, { nombre_componente: comp.nombre_componente })}
                      />
                    </div>

                    <div>
                      <label className="lbl">Ponderación (%)</label>
                      <input
                        className="inp"
                        type="number"
                        value={comp.ponderacion}
                        onChange={(e) =>
                          setComponentes((prev) =>
                            prev.map((x) =>
                              x.id_rubrica_componente === comp.id_rubrica_componente
                                ? { ...x, ponderacion: toNum(e.target.value) }
                                : x
                            )
                          )
                        }
                        onBlur={() => updateComponente(comp, { ponderacion: comp.ponderacion })}
                      />
                    </div>
                  </div>

                  <div className="grid-table-wrap" style={{ marginTop: 14 }}>
                    <table className="grid-table">
                      <thead>
                        <tr>
                          <th style={{ width: 300 }}>Criterio</th>
                          {nivelesActivos.map((n) => (
                            <th key={n.id_rubrica_nivel}>
                              {n.nombre_nivel} ({n.valor_nivel})
                            </th>
                          ))}
                          <th style={{ width: 90 }}>Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {criterios.length === 0 && (
                          <tr>
                            <td colSpan={nivelesActivos.length + 2} className="td-center">
                              No hay criterios en este componente
                            </td>
                          </tr>
                        )}

                        {criterios.map((cr) => (
                          <tr key={cr.id_rubrica_criterio}>
                            <td className="crit-cell">
                              <textarea
                                className="ta cell"
                                value={cr.nombre_criterio}
                                onChange={(e) =>
                                  setCriteriosByComp((prev) => ({
                                    ...prev,
                                    [comp.id_rubrica_componente]: (prev[comp.id_rubrica_componente] ?? []).map((x) =>
                                      x.id_rubrica_criterio === cr.id_rubrica_criterio
                                        ? { ...x, nombre_criterio: e.target.value }
                                        : x
                                    ),
                                  }))
                                }
                                onBlur={() => updateCriterio(comp.id_rubrica_componente, cr, { nombre_criterio: cr.nombre_criterio })}
                              />
                            </td>

                            {nivelesActivos.map((n) => (
                              <td key={n.id_rubrica_nivel}>
                                <textarea
                                  className="ta cell"
                                  value={getCellValue(cr.id_rubrica_criterio, n.id_rubrica_nivel)}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    const key = getCellKey(cr.id_rubrica_criterio, n.id_rubrica_nivel);
                                    setDraftCell((prev) => ({ ...prev, [key]: v }));
                                  }}
                                  onBlur={(e) => {
                                    scheduleUpsert(cr.id_rubrica_criterio, n.id_rubrica_nivel, e.target.value);
                                  }}
                                />
                              </td>
                            ))}

                            <td className="td-center">
                              <button
                                className="btn icon danger"
                                onClick={() => deleteCriterio(comp.id_rubrica_componente, cr.id_rubrica_criterio)}
                                title="Eliminar criterio"
                              >
                                🗑
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <button className="btn primary" onClick={() => addCriterio(comp.id_rubrica_componente)}>
                      + Añadir Criterio a este Componente
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

        <div style={{ marginTop: 12 }}>
          <button className="btn success" onClick={addComponente}>
            + Añadir Nuevo Componente a la Rúbrica
          </button>
        </div>
      </div>

      {/* Footer buttons como tu captura */}
      <div className="footer-actions">
        <button className="btn primary" onClick={saveRubrica} disabled={loading}>
          Actualizar Rúbrica
        </button>
        <button className="btn ghost" onClick={() => navigate(-1)} disabled={loading}>
          Cancelar
        </button>

        <div className="muted small" style={{ marginLeft: "auto" }}>
          Total ponderación componentes activos: <b>{totalPonderacionActiva.toFixed(2)}%</b>
        </div>
      </div>

      {loading && <div className="muted" style={{ marginTop: 8 }}>Cargando…</div>}
    </div>
  );
}
