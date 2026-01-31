import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import {
  ArrowLeft,
  List,
  Trash2,
  Plus,
  Save,
  XCircle,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
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

  // Celdas por criterio: { criterioId: { nivelId: celda } }
  const [celdasByCriterio, setCeldasByCriterio] = useState<Record<number, Record<number, RubricaCriterioNivel>>>({});

  // Drafts: `${criterioId}-${nivelId}`
  const [draftCell, setDraftCell] = useState<Record<string, string>>({});

  // Debounce timers
  const saveTimers = useRef<Record<string, any>>({});

  const nivelesActivos = useMemo(
    () =>
      niveles
        .filter((n) => n.estado === 1)
        .slice()
        .sort((a, b) => a.orden_nivel - b.orden_nivel),
    [niveles]
  );

  const componentesActivos = useMemo(
    () =>
      componentes
        .filter((c) => c.estado === 1)
        .slice()
        .sort((a, b) => a.orden - b.orden),
    [componentes]
  );

  const totalPonderacionActiva = useMemo(() => {
    return componentesActivos.reduce((acc, c) => acc + toNum(c.ponderacion, 0), 0);
  }, [componentesActivos]);

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

      // reload comps
      const compsRes = await axiosClient.get(`/rubricas/${rid}/componentes`, {
        params: { includeInactive: true },
      });
      const compArr = (compsRes.data ?? []) as RubricaComponente[];
      setComponentes(compArr);

      // criterios
      const criteriosArrays = await Promise.all(
        compArr.map((c) => loadCriteriosDeComponente(c.id_rubrica_componente))
      );

      // celdas
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
      const orden =
        (arr
          .filter((x) => x.estado === 1)
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .at(-1)?.orden ?? 0) + 1;

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
  // CELDAS (UPSERT)
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

    setDraftCell((prev) => ({ ...prev, [key]: value }));

    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await axiosClient.post(`/criterios/${criterioId}/niveles`, {
          id_rubrica_nivel: nivelId,
          descripcion: value ?? "",
        });
        await loadCeldasDeCriterio(criterioId);
      } catch (e) {
        console.error(e);
      }
    }, 280);
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="wrap rubricaEditorPage">
      <div className="containerFull">
        {/* HERO (igual estilo Carreras) */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">
                {rubrica ? "EDITAR RÚBRICA" : "RÚBRICA"}
              </h1>
              <p className="heroSubtitle">
                Configuración de criterios y niveles de evaluación
              </p>
            </div>
          </div>

          <button className="heroBtn" onClick={() => navigate("/rubricas")}>
            <ArrowLeft className="iconSm" /> Volver
          </button>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <List className="iconSm" />
              </span>
              {nombreRubrica?.trim() ? `Rúbrica: ${nombreRubrica}` : "Rúbrica (sin nombre)"}
            </div>

            <div className={`rePill ${Math.abs(totalPonderacionActiva - 100) < 0.001 ? "ok" : ""}`}>
              Total ponderación: <b>{totalPonderacionActiva.toFixed(2)}%</b>
            </div>
          </div>

          {/* TOP GRID: Info general (izq) + Niveles (der) */}
          <div className="reTopGrid">
            {/* Info general */}
            <div className="reCard">
              <div className="reCardHead">Información General</div>
              <div className="reCardBody">
                <label className="reLbl">Nombre de la Rúbrica</label>
                <input
                  className="reInp"
                  placeholder="Ej: Rúbrica General de Examen Complexivo"
                  value={nombreRubrica}
                  onChange={(e) => setNombreRubrica(e.target.value)}
                />

                <label className="reLbl" style={{ marginTop: 10 }}>
                  Descripción (opcional)
                </label>
                <textarea
                  className="reTa"
                  placeholder="Ej: Diseño de rúbrica ESCRITA (50%)"
                  value={descRubrica}
                  onChange={(e) => setDescRubrica(e.target.value)}
                />
              </div>
            </div>

            {/* Niveles */}
            <div className="reCard">
              <div className="reCardHead between">
                <div>Niveles de Calificación</div>
                <button className="reBtn reBtnSmall reBtnOk" onClick={addNivel} disabled={loading}>
                  <Plus className="iconSm" /> Añadir nivel
                </button>
              </div>

              <div className="reCardBody">
                <div className="levelsTable">
                  <div className="levelsHead">
                    <div>Nombre del nivel</div>
                    <div>Valor</div>
                    <div className="levelsAction">Acción</div>
                  </div>

                  {nivelesActivos.map((n) => (
                    <div className="levelsRow" key={n.id_rubrica_nivel}>
                      <input
                        className="reInp reInpSlim"
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
                        className="reInp reInpSlim"
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

                      <button
                        className="reIconBtn danger"
                        onClick={() => deleteNivel(n.id_rubrica_nivel)}
                        title="Eliminar nivel"
                        type="button"
                      >
                        <Trash2 className="iconSm" />
                      </button>
                    </div>
                  ))}
                </div>

                {nivelesActivos.length < 2 ? (
                  <div className="reHint">
                    Recomendación: usa al menos <b>2 niveles</b> para que la rúbrica sea válida.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* COMPONENTES */}
          <div className="reSectionTitle">Componentes y Criterios</div>

          {componentesActivos.map((comp, idx) => {
            const criterios = (criteriosByComp[comp.id_rubrica_componente] ?? [])
              .filter((x) => x.estado === 1)
              .slice()
              .sort((a, b) => a.orden - b.orden);

            return (
              <div className="reCompCard" key={comp.id_rubrica_componente}>
                <div className="reCompHead">
                  <div className="reCompTitle">Componente {idx + 1}</div>

                  <button
                    className="reBtn reBtnDanger"
                    onClick={() => deleteComponente(comp.id_rubrica_componente)}
                    type="button"
                  >
                    <Trash2 className="iconSm" /> Eliminar componente
                  </button>
                </div>

                <div className="reCompBody">
                  <div className="reCompForm">
                    <div>
                      <label className="reLbl">Nombre del componente</label>
                      <input
                        className="reInp"
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
                      <label className="reLbl">Ponderación (%)</label>
                      <input
                        className="reInp"
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

                  {/* Tabla criterios */}
                  <div className="reTableWrap">
                    <table className="reTable">
                      <thead>
                        <tr>
                          <th className="thCrit">Criterio</th>
                          {nivelesActivos.map((n) => (
                            <th key={n.id_rubrica_nivel} className="thLvl">
                              <div className="thLvlName">{n.nombre_nivel}</div>
                              <div className="thLvlVal">{n.valor_nivel}</div>
                            </th>
                          ))}
                          <th className="thAct">Acción</th>
                        </tr>
                      </thead>

                      <tbody>
                        {criterios.length === 0 ? (
                          <tr>
                            <td colSpan={nivelesActivos.length + 2} className="tdEmpty">
                              No hay criterios en este componente.
                            </td>
                          </tr>
                        ) : (
                          criterios.map((cr) => (
                            <tr key={cr.id_rubrica_criterio}>
                              <td className="tdCrit">
                                <textarea
                                  className="reTaCell"
                                  value={cr.nombre_criterio}
                                  placeholder="Descripción del criterio"
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
                                  onBlur={() =>
                                    updateCriterio(comp.id_rubrica_componente, cr, {
                                      nombre_criterio: cr.nombre_criterio,
                                    })
                                  }
                                />
                              </td>

                              {nivelesActivos.map((n) => (
                                <td key={n.id_rubrica_nivel} className="tdCell">
                                  <textarea
                                    className="reTaCell"
                                    value={getCellValue(cr.id_rubrica_criterio, n.id_rubrica_nivel)}
                                    placeholder="Descripción..."
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

                              <td className="tdAct">
                                <button
                                  className="reIconBtn danger"
                                  onClick={() => deleteCriterio(comp.id_rubrica_componente, cr.id_rubrica_criterio)}
                                  title="Eliminar criterio"
                                  type="button"
                                >
                                  <Trash2 className="iconSm" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="reCompActions">
                    <button
                      className="reBtn reBtnPrimary"
                      onClick={() => addCriterio(comp.id_rubrica_componente)}
                      type="button"
                    >
                      <Plus className="iconSm" /> Añadir criterio a este componente
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="reAddComp">
            <button className="reBtn reBtnOk" onClick={addComponente} type="button">
              <Plus className="iconSm" /> Añadir nuevo componente
            </button>
          </div>

          {/* FOOTER actions */}
          <div className="reFooter">
            <button className="reBtn reBtnPrimary" onClick={saveRubrica} disabled={loading} type="button">
              <Save className="iconSm" /> Guardar rúbrica
            </button>
            <button className="reBtn reBtnGhost" onClick={() => navigate(-1)} disabled={loading} type="button">
              <XCircle className="iconSm" /> Cancelar
            </button>

            {loading ? <div className="reMuted">Cargando…</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
