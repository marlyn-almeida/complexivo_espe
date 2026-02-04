// src/pages/rubricas/RubricaEditorPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import { ArrowLeft, List, Trash2, Plus, Save, XCircle } from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./RubricaEditorPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number | boolean | string;
};

type RubricaNivel = {
  id_rubrica_nivel: number;
  id_rubrica: number;
  nombre_nivel: string;
  valor_nivel: number | string;
  orden_nivel: number | string;
  estado: number | boolean | string;
};

type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO";
  ponderacion: number | string; // puede venir "40,00"
  orden: number | string; // puede venir string
  estado: number | boolean | string;
};

type RubricaCriterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  orden: number | string;
  estado: number | boolean | string;
};

type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  descripcion: string;
  estado: number | boolean | string;
  nombre_nivel?: string;
  valor_nivel?: number;
  orden_nivel?: number;
};

type ToastType = "success" | "error" | "info";

/** ✅ soporta "40,00" / "40.00" / números / null */
function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

/** ✅ estado robusto: 1/"1"/true => activo */
function isActivo(v: any) {
  if (v === true) return true;
  if (v === false) return false;
  return toNum(v, 0) === 1;
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
  const [celdasByCriterio, setCeldasByCriterio] = useState<
    Record<number, Record<number, RubricaCriterioNivel>>
  >({});

  // Drafts: `${criterioId}-${nivelId}`
  const [draftCell, setDraftCell] = useState<Record<string, string>>({});

  // Debounce timers
  const saveTimers = useRef<Record<string, any>>({});

  // ✅ Toast (abajo-derecha via CSS .reToastBL)
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const toastTimer = useRef<any>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // ✅ VOLVER SIEMPRE AL VIEW DEL PERIODO (RubricasVerPage)
  function goBack() {
    const pid = rubrica?.id_periodo;
    if (pid) navigate(`/rubricas/periodo/${pid}`);
    else navigate("/rubricas");
  }

  const nivelesActivos = useMemo(() => {
    return niveles
      .filter((n) => isActivo(n.estado))
      .slice()
      .sort((a, b) => toNum(a.orden_nivel, 0) - toNum(b.orden_nivel, 0));
  }, [niveles]);

  const componentesActivos = useMemo(() => {
    return componentes
      .filter((c) => isActivo(c.estado))
      .slice()
      .sort((a, b) => toNum(a.orden, 0) - toNum(b.orden, 0));
  }, [componentes]);

  // ✅ Total ponderación SIEMPRE correcto aunque venga "40,00"
  const totalPonderacionActiva = useMemo(() => {
    return componentesActivos.reduce((acc, c) => acc + toNum(c.ponderacion, 0), 0);
  }, [componentesActivos]);

  // ---------------------------
  // LOADERS (SIN DOBLE SET QUE CAUSA "PARPADEO")
  // ---------------------------
  const loadRubrica = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}`);
    const r = res.data as Rubrica;

    setRubrica(r);

    // ✅ set por defecto con fallback (evita "sin nombre" raro si llega null/undefined)
    setNombreRubrica((r?.nombre_rubrica ?? "").toString());
    setDescRubrica((r?.descripcion_rubrica ?? "").toString());
  };

  const loadNiveles = async (): Promise<RubricaNivel[]> => {
    const res = await axiosClient.get(`/rubricas/${rid}/niveles`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaNivel[];

    const normalized = arr.map((n) => ({
      ...n,
      estado: toNum((n as any).estado, 1), // ✅ normaliza estado
      valor_nivel: toNum(n.valor_nivel, 0),
      orden_nivel: toNum(n.orden_nivel, 0),
    }));

    setNiveles(normalized);
    return normalized;
  };

  const loadComponentes = async (): Promise<RubricaComponente[]> => {
    const res = await axiosClient.get(`/rubricas/${rid}/componentes`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaComponente[];

    const normalized = arr.map((c) => ({
      ...c,
      estado: toNum((c as any).estado, 1), // ✅ normaliza estado
      ponderacion: toNum(c.ponderacion, 0),
      orden: toNum(c.orden, 0),
    }));

    setComponentes(normalized);
    return normalized;
  };

  const loadCriteriosDeComponente = async (idComp: number) => {
    const res = await axiosClient.get(`/componentes/${idComp}/criterios`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaCriterio[];

    const normalized = arr.map((x) => ({
      ...x,
      estado: toNum((x as any).estado, 1),
      orden: toNum((x as any).orden, 0),
    }));

    setCriteriosByComp((prev) => ({ ...prev, [idComp]: normalized }));
    return normalized;
  };

  const loadCeldasDeCriterio = async (criterioId: number) => {
    const res = await axiosClient.get(`/criterios/${criterioId}/niveles`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaCriterioNivel[];

    const map: Record<number, RubricaCriterioNivel> = {};
    for (const rcn of arr) {
      map[toNum((rcn as any).id_rubrica_nivel)] = {
        ...rcn,
        estado: toNum((rcn as any).estado, 1),
      };
    }
    setCeldasByCriterio((prev) => ({ ...prev, [criterioId]: map }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [_r, _n, comps] = await Promise.all([loadRubrica(), loadNiveles(), loadComponentes()]);

      // criterios
      const criteriosArrays = await Promise.all(
        comps.map((c) => loadCriteriosDeComponente(c.id_rubrica_componente))
      );

      // celdas
      const allCriterios = criteriosArrays.flat();
      await Promise.all(allCriterios.map((cr) => loadCeldasDeCriterio(cr.id_rubrica_criterio)));
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo cargar el editor de rúbrica");
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
        // ✅ evita null si tu backend no lo quiere (si lo acepta, igual funciona)
        descripcion_rubrica: descRubrica.trim() ? descRubrica.trim() : "",
        ponderacion_global: 100,
      });
      await loadRubrica();
      showToast("success", "Rúbrica actualizada");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo actualizar la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // ACCIONES: NIVELES
  // ---------------------------
  const addNivel = async () => {
    try {
      const lastOrden = toNum(nivelesActivos.at(-1)?.orden_nivel, 0);
      const orden = lastOrden + 1;

      await axiosClient.post(`/rubricas/${rid}/niveles`, {
        nombre_nivel: "Nuevo nivel",
        valor_nivel: 0,
        orden_nivel: orden,
      });
      await loadNiveles();
      showToast("success", "Nivel añadido");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo añadir el nivel");
    }
  };

  const updateNivel = async (nivelId: number, patch: Partial<RubricaNivel>) => {
    const current = niveles.find((n) => n.id_rubrica_nivel === nivelId);
    if (!current) return;

    try {
      await axiosClient.put(`/rubricas/${rid}/niveles/${nivelId}`, {
        nombre_nivel: (patch.nombre_nivel ?? current.nombre_nivel) ?? "",
        valor_nivel: toNum(patch.valor_nivel ?? current.valor_nivel, 0),
        orden_nivel: toNum(patch.orden_nivel ?? current.orden_nivel, 0),
      });
      await loadNiveles();
      showToast("success", "Nivel actualizado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo actualizar el nivel");
    }
  };

  const deleteNivel = async (nivelId: number) => {
    if (!confirm("¿Eliminar este nivel?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/niveles/${nivelId}/estado`, { estado: false });
      await loadNiveles();
      showToast("success", "Nivel eliminado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo eliminar el nivel");
    }
  };

  // ---------------------------
  // ACCIONES: COMPONENTES
  // ---------------------------
  const addComponente = async () => {
    try {
      const lastOrden = toNum(componentesActivos.at(-1)?.orden, 0);
      const orden = lastOrden + 1;

      await axiosClient.post(`/rubricas/${rid}/componentes`, {
        nombre_componente: `Componente ${orden}`,
        tipo_componente: "OTRO",
        ponderacion: 0,
        orden,
      });
      await loadComponentes();
      showToast("success", "Componente añadido");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo añadir el componente");
    }
  };

  const updateComponente = async (comp: RubricaComponente, patch: Partial<RubricaComponente>) => {
    try {
      await axiosClient.put(`/rubricas/${rid}/componentes/${comp.id_rubrica_componente}`, {
        nombre_componente: (patch.nombre_componente ?? comp.nombre_componente) ?? "",
        tipo_componente: (patch.tipo_componente ?? comp.tipo_componente) as any,
        ponderacion: toNum(patch.ponderacion ?? comp.ponderacion, 0),
        orden: toNum(patch.orden ?? comp.orden, 0),
      });
      await loadComponentes();
      showToast("success", "Componente actualizado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo actualizar el componente");
    }
  };

  const deleteComponente = async (compId: number) => {
    if (!confirm("¿Eliminar este componente?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/componentes/${compId}/estado`, { estado: false });
      await loadComponentes();
      showToast("success", "Componente eliminado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo eliminar el componente");
    }
  };

  // ---------------------------
  // ACCIONES: CRITERIOS
  // ---------------------------
  const addCriterio = async (compId: number) => {
    try {
      const arr = criteriosByComp[compId] ?? [];
      const lastOrden =
        arr
          .filter((x) => isActivo(x.estado))
          .slice()
          .sort((a, b) => toNum(a.orden, 0) - toNum(b.orden, 0))
          .at(-1)?.orden ?? 0;

      const orden = toNum(lastOrden, 0) + 1;

      await axiosClient.post(`/componentes/${compId}/criterios`, {
        nombre_criterio: "Nuevo criterio",
        orden,
      });

      const nuevos = await loadCriteriosDeComponente(compId);
      const creado = nuevos.find((x) => toNum(x.orden, 0) === orden) ?? nuevos.at(-1);

      if (creado?.id_rubrica_criterio) {
        await loadCeldasDeCriterio(creado.id_rubrica_criterio);
      }

      showToast("success", "Criterio añadido");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo añadir el criterio");
    }
  };

  const updateCriterio = async (
    compId: number,
    criterio: RubricaCriterio,
    patch: Partial<RubricaCriterio>
  ) => {
    try {
      await axiosClient.put(`/componentes/${compId}/criterios/${criterio.id_rubrica_criterio}`, {
        nombre_criterio: (patch.nombre_criterio ?? criterio.nombre_criterio) ?? "",
        orden: toNum(patch.orden ?? criterio.orden, 0),
      });
      await loadCriteriosDeComponente(compId);
      showToast("success", "Criterio actualizado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo actualizar el criterio");
    }
  };

  const deleteCriterio = async (compId: number, criterioId: number) => {
    if (!confirm("¿Eliminar este criterio?")) return;
    try {
      await axiosClient.patch(`/componentes/${compId}/criterios/${criterioId}/estado`, {
        estado: false,
      });
      await loadCriteriosDeComponente(compId);
      showToast("success", "Criterio eliminado");
    } catch (e) {
      console.error(e);
      showToast("error", "No se pudo eliminar el criterio");
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
        showToast("error", "No se pudo guardar la celda");
      }
    }, 280);
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="wrap rubricaEditorPage">
      <div className="containerFull">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">{rubrica ? "EDITAR RÚBRICA" : "RÚBRICA"}</h1>
              <p className="heroSubtitle">Configuración de criterios y niveles de evaluación</p>
            </div>
          </div>

          <button className="heroBtn" onClick={goBack} type="button">
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
              Total ponderación: <b>{loading ? "—" : `${totalPonderacionActiva.toFixed(2)}%`}</b>
            </div>
          </div>

          {/* TOP GRID */}
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
                <button className="reBtn reBtnSmall reBtnOk" onClick={addNivel} disabled={loading} type="button">
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
                        value={toNum(n.valor_nivel, 0)}
                        onChange={(e) =>
                          setNiveles((prev) =>
                            prev.map((x) =>
                              x.id_rubrica_nivel === n.id_rubrica_nivel
                                ? { ...x, valor_nivel: toNum(e.target.value, 0) }
                                : x
                            )
                          )
                        }
                        onBlur={() => updateNivel(n.id_rubrica_nivel, { valor_nivel: toNum(n.valor_nivel, 0) })}
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
              .filter((x) => isActivo(x.estado))
              .slice()
              .sort((a, b) => toNum(a.orden, 0) - toNum(b.orden, 0));

            return (
              <div className="reCompCard" key={comp.id_rubrica_componente}>
                <div className="reCompHead">
                  <div className="reCompTitle">Componente {idx + 1}</div>

                  <button className="reBtn reBtnDanger" onClick={() => deleteComponente(comp.id_rubrica_componente)} type="button">
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
                              x.id_rubrica_componente === comp.id_rubrica_componente ? { ...x, nombre_componente: e.target.value } : x
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
                        value={toNum(comp.ponderacion, 0)}
                        onChange={(e) =>
                          setComponentes((prev) =>
                            prev.map((x) =>
                              x.id_rubrica_componente === comp.id_rubrica_componente ? { ...x, ponderacion: toNum(e.target.value, 0) } : x
                            )
                          )
                        }
                        onBlur={() => updateComponente(comp, { ponderacion: toNum(comp.ponderacion, 0) })}
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
                              <div className="thLvlVal">{toNum(n.valor_nivel, 0)}</div>
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
                                        x.id_rubrica_criterio === cr.id_rubrica_criterio ? { ...x, nombre_criterio: e.target.value } : x
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
                    <button className="reBtn reBtnPrimary" onClick={() => addCriterio(comp.id_rubrica_componente)} type="button">
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

          {/* FOOTER */}
          <div className="reFooter">
            <button className="reBtn reBtnPrimary" onClick={saveRubrica} disabled={loading} type="button">
              <Save className="iconSm" /> Guardar rúbrica
            </button>

            <button className="reBtn reBtnGhost" onClick={goBack} disabled={loading} type="button">
              <XCircle className="iconSm" /> Cancelar
            </button>

            {loading ? <div className="reMuted">Cargando…</div> : null}
          </div>
        </div>
      </div>

      {/* ✅ Toast abajo-derecha (usa el CSS .reToastBL) */}
      {toast ? (
        <div className={`reToastBL ${toast.type}`} onClick={() => setToast(null)} role="status" aria-live="polite">
          <div className="reToastMsg">{toast.message}</div>
        </div>
      ) : null}
    </div>
  );
}
