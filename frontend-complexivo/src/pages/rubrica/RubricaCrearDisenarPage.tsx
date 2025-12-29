import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RubricasDisenoPage.css";

import { catalogosService, type CatalogoItem } from "../../services/catalogos.service";
import { rubricaService, type Rubrica, type TipoRubrica } from "../../services/rubrica.service";
import { rubricaComponenteService, type RubricaComponente } from "../../services/rubricaComponente.service";
import { rubricaCriterioNivelService, type RubricaCriterioNivel } from "../../services/rubricaCriterioNivel.service";

const isActive = (estado: any) => (typeof estado === "boolean" ? estado : Number(estado) === 1);

function defaultRubricaName(tipo: TipoRubrica) {
  return tipo === "ESCRITA" ? "Rúbrica Evaluación Escrita" : "Rúbrica Evaluación Oral";
}

export default function RubricasDisenoPage() {
  const nav = useNavigate();
  const { idCarreraPeriodo } = useParams();
  const cpId = Number(idCarreraPeriodo);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [tab, setTab] = useState<TipoRubrica>("ESCRITA");
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);
  const rubricaActiva = useMemo(() => rubricas.find(r => r.tipo_rubrica === tab) || null, [rubricas, tab]);

  const [catComponentes, setCatComponentes] = useState<CatalogoItem[]>([]);
  const [catCriterios, setCatCriterios] = useState<CatalogoItem[]>([]);
  const [catNiveles, setCatNiveles] = useState<CatalogoItem[]>([]);

  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);

  // criterios por componente (catálogo)
  const [openComponenteCatalogoId, setOpenComponenteCatalogoId] = useState<number | null>(null);
  const [criteriosNiveles, setCriteriosNiveles] = useState<RubricaCriterioNivel[]>([]);

  // form add componente a rubrica
  const [nuevoCompId, setNuevoCompId] = useState<number>(0);
  const [nuevoCompOrden, setNuevoCompOrden] = useState<number>(1);
  const [nuevoCompPond, setNuevoCompPond] = useState<number>(0);

  // form add criterio-nivel
  const [nuevoCriterioId, setNuevoCriterioId] = useState<number>(0);
  const [nuevoNivelId, setNuevoNivelId] = useState<number>(0);
  const [nuevoDesc, setNuevoDesc] = useState<string>("");

  // 1) cargar catálogos
  useEffect(() => {
    (async () => {
      try { setCatComponentes(await catalogosService.componentes({ includeInactive: true })); } catch {}
      try { setCatCriterios(await catalogosService.criterios({ includeInactive: true })); } catch {}
      try { setCatNiveles(await catalogosService.niveles({ includeInactive: true })); } catch {}
    })();
  }, []);

  // 2) asegurar 2 rúbricas
  const ensureRubricas = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const list = await rubricaService.list({ carreraPeriodoId: cpId, includeInactive: true });
      const arr = Array.isArray(list) ? list : [];

      const escrita = arr.find(r => r.tipo_rubrica === "ESCRITA");
      const oral = arr.find(r => r.tipo_rubrica === "ORAL");

      const created: Rubrica[] = [];

      if (!escrita) {
        created.push(await rubricaService.create({
          id_carrera_periodo: cpId,
          tipo_rubrica: "ESCRITA",
          ponderacion_global: 50,
          nombre_rubrica: defaultRubricaName("ESCRITA"),
          descripcion_rubrica: "Diseño de rúbrica ESCRITA (50%)",
        }));
      }
      if (!oral) {
        created.push(await rubricaService.create({
          id_carrera_periodo: cpId,
          tipo_rubrica: "ORAL",
          ponderacion_global: 50,
          nombre_rubrica: defaultRubricaName("ORAL"),
          descripcion_rubrica: "Diseño de rúbrica ORAL (50%)",
        }));
      }

      const finalList = created.length
        ? await rubricaService.list({ carreraPeriodoId: cpId, includeInactive: true })
        : arr;

      setRubricas(Array.isArray(finalList) ? finalList : []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error asegurando rúbricas ESCRITA/ORAL.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cpId || Number.isNaN(cpId)) {
      setMsg("ID carrera_periodo inválido.");
      return;
    }
    ensureRubricas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpId]);

  // 3) cargar componentes de la rúbrica activa
  const loadComponentes = async (rubricaId: number) => {
    setLoading(true);
    setMsg(null);
    try {
      const comps = await rubricaComponenteService.list({ rubricaId, includeInactive: true });
      const list = (Array.isArray(comps) ? comps : [])
        .slice()
        .sort((a, b) => Number(a.orden_componente) - Number(b.orden_componente));

      setComponentes(list);

      setNuevoCompOrden(list.length ? Math.max(...list.map(x => Number(x.orden_componente))) + 1 : 1);
      setOpenComponenteCatalogoId(null);
      setCriteriosNiveles([]);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error cargando componentes.");
      setComponentes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rubricaActiva?.id_rubrica) loadComponentes(rubricaActiva.id_rubrica);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubricaActiva?.id_rubrica]);

  const nombreComp = (id: number) => catComponentes.find(x => x.id === id)?.nombre || `Componente #${id}`;
  const nombreCrit = (id: number) => catCriterios.find(x => x.id === id)?.nombre || `Criterio #${id}`;
  const nombreNivel = (id: number) => catNiveles.find(x => x.id === id)?.nombre || `Nivel #${id}`;

  // agregar componente a rúbrica
  const addComponente = async () => {
    if (!rubricaActiva) return;

    if (!nuevoCompId || nuevoCompId < 1) return setMsg("Selecciona un componente válido.");
    setLoading(true);
    setMsg(null);
    try {
      await rubricaComponenteService.create({
        id_rubrica: rubricaActiva.id_rubrica,
        id_componente: Number(nuevoCompId),
        ponderacion_porcentaje: Number(nuevoCompPond),
        orden_componente: Number(nuevoCompOrden),
      });
      await loadComponentes(rubricaActiva.id_rubrica);
      setNuevoCompId(0);
      setNuevoCompPond(0);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error agregando componente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleComponente = async (row: RubricaComponente) => {
    setLoading(true);
    setMsg(null);
    try {
      await rubricaComponenteService.changeEstado(row.id_rubrica_componente, !isActive(row.estado));
      if (rubricaActiva) await loadComponentes(rubricaActiva.id_rubrica);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error cambiando estado del componente.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cargar criterios/niveles por ID DE CATÁLOGO componente
  const openCriterios = async (componenteCatalogoId: number) => {
    setLoading(true);
    setMsg(null);
    try {
      const rows = await rubricaCriterioNivelService.list({
        componenteId: componenteCatalogoId, // ✅ catálogo
        includeInactive: true,
      });
      setOpenComponenteCatalogoId(componenteCatalogoId);
      setCriteriosNiveles(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error cargando criterios y niveles.");
    } finally {
      setLoading(false);
    }
  };

  const addCriterioNivel = async () => {
    if (!openComponenteCatalogoId) return;

    if (!nuevoCriterioId || !nuevoNivelId) return setMsg("Selecciona criterio y nivel.");
    if (!nuevoDesc.trim()) return setMsg("La descripción es obligatoria.");

    setLoading(true);
    setMsg(null);
    try {
      await rubricaCriterioNivelService.create({
        id_componente: openComponenteCatalogoId, // ✅ catálogo
        id_criterio: Number(nuevoCriterioId),
        id_nivel: Number(nuevoNivelId),
        descripcion: nuevoDesc.trim(),
      });
      await openCriterios(openComponenteCatalogoId);
      setNuevoDesc("");
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error creando criterio/nivel.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCriterioNivel = async (row: RubricaCriterioNivel) => {
    setLoading(true);
    setMsg(null);
    try {
      await rubricaCriterioNivelService.changeEstado(row.id_rubrica_criterio_nivel, !isActive(row.estado));
      await openCriterios(row.id_componente); // ✅ catálogo
    } catch (e: any) {
      setMsg(e?.response?.data?.message || "Error cambiando estado criterio/nivel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp3-page">
      <div className="cp3-panel">
        <div className="cp3-panel-top">
          <div>
            <h1 className="cp3-title">Diseño de Rúbricas</h1>
            <p className="cp3-subtitle">Carrera–Período: <b>#{cpId}</b> · ESCRITA/ORAL</p>
          </div>

          <div className="row-actions">
            <button className="btn-action view" onClick={() => nav(`/rubricas/ver/${cpId}`)}>Ver</button>
            <button className="btn-action" onClick={() => nav("/rubricas")}>Volver</button>
          </div>
        </div>

        {msg && <div className="cp3-error">{msg}</div>}

        <div className="rub-tabs">
          <button className={`rub-tab ${tab === "ESCRITA" ? "on" : ""}`} onClick={() => setTab("ESCRITA")}>ESCRITA</button>
          <button className={`rub-tab ${tab === "ORAL" ? "on" : ""}`} onClick={() => setTab("ORAL")}>ORAL</button>
        </div>
      </div>

      <div className="cp3-card">
        <div className="rub-header">
          <div>
            <div className="rub-h-title">{rubricaActiva?.nombre_rubrica || "—"}</div>
            <div className="td-mini">{rubricaActiva?.descripcion_rubrica || ""}</div>
          </div>
          <div className="rub-h-right">
            <span className="badge active">Ponderación global: {rubricaActiva?.ponderacion_global ?? 50}%</span>
            {loading && <span className="td-mini">Cargando…</span>}
          </div>
        </div>

        {/* Agregar componente */}
        <div className="rub-add">
          <div className="rub-add-row">
            <div className="rub-field">
              <label>Componente</label>
              <select className="input-base" value={nuevoCompId} onChange={(e) => setNuevoCompId(Number(e.target.value))}>
                <option value={0}>Selecciona…</option>
                {catComponentes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="rub-field">
              <label>Ponderación (%)</label>
              <input className="input-base" type="number" step="0.01" value={nuevoCompPond} onChange={(e) => setNuevoCompPond(Number(e.target.value))} />
            </div>

            <div className="rub-field">
              <label>Orden</label>
              <input className="input-base" type="number" value={nuevoCompOrden} onChange={(e) => setNuevoCompOrden(Number(e.target.value))} />
            </div>

            <button className="btn-action assign" onClick={addComponente} disabled={loading || !rubricaActiva}>
              + Agregar
            </button>
          </div>
        </div>

        {/* Tabla componentes */}
        <div className="cp3-table-scroll">
          <table className="cp3-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Componente</th>
                <th>Ponderación</th>
                <th>Estado</th>
                <th className="cp3-actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {componentes.length === 0 ? (
                <tr><td colSpan={5} className="td-center">No hay componentes todavía.</td></tr>
              ) : (
                componentes.map((row) => {
                  const activo = isActive(row.estado);
                  return (
                    <tr key={row.id_rubrica_componente}>
                      <td className="td-strong">{row.orden_componente}</td>
                      <td className="td-strong">{row.nombre_componente || nombreComp(row.id_componente)}</td>
                      <td>{Number(row.ponderacion_porcentaje).toFixed(2)}%</td>
                      <td><span className={`badge ${activo ? "active" : "inactive"}`}>{activo ? "ACTIVO" : "INACTIVO"}</span></td>
                      <td>
                        <div className="row-actions">
                          {/* ✅ AQUÍ lo importante: abrir por id_componente catálogo */}
                          <button className="btn-action view" onClick={() => openCriterios(row.id_componente)}>
                            Criterios/Niveles
                          </button>
                          <button className="btn-action" onClick={() => toggleComponente(row)}>
                            {activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Panel criterios/niveles */}
        {openComponenteCatalogoId && (
          <div className="rub-criteria">
            <div className="rub-criteria-top">
              <div className="rub-h-title">Criterios y niveles · {nombreComp(openComponenteCatalogoId)}</div>
              <button className="btn-action" onClick={() => { setOpenComponenteCatalogoId(null); setCriteriosNiveles([]); }}>
                Cerrar
              </button>
            </div>

            <div className="rub-add-row">
              <div className="rub-field">
                <label>Criterio</label>
                <select className="input-base" value={nuevoCriterioId} onChange={(e) => setNuevoCriterioId(Number(e.target.value))}>
                  <option value={0}>Selecciona…</option>
                  {catCriterios.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="rub-field">
                <label>Nivel</label>
                <select className="input-base" value={nuevoNivelId} onChange={(e) => setNuevoNivelId(Number(e.target.value))}>
                  <option value={0}>Selecciona…</option>
                  {catNiveles.map((n) => (
                    <option key={n.id} value={n.id}>{n.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="rub-field grow">
                <label>Descripción</label>
                <input className="input-base" value={nuevoDesc} onChange={(e) => setNuevoDesc(e.target.value)} placeholder="Descripción..." />
              </div>

              <button className="btn-action assign" onClick={addCriterioNivel} disabled={loading}>
                + Agregar
              </button>
            </div>

            <div className="cp3-table-scroll">
              <table className="cp3-table">
                <thead>
                  <tr>
                    <th>Criterio</th>
                    <th>Nivel</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th className="cp3-actions-col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {criteriosNiveles.length === 0 ? (
                    <tr><td colSpan={5} className="td-center">No hay criterios/niveles.</td></tr>
                  ) : (
                    criteriosNiveles.map((row) => {
                      const activo = isActive(row.estado);
                      return (
                        <tr key={row.id_rubrica_criterio_nivel}>
                          <td className="td-strong">{row.nombre_criterio || nombreCrit(row.id_criterio)}</td>
                          <td className="td-strong">{row.nombre_nivel || nombreNivel(row.id_nivel)}</td>
                          <td>{row.descripcion}</td>
                          <td><span className={`badge ${activo ? "active" : "inactive"}`}>{activo ? "ACTIVO" : "INACTIVO"}</span></td>
                          <td>
                            <div className="row-actions">
                              <button className="btn-action" onClick={() => toggleCriterioNivel(row)}>
                                {activo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
