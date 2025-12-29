import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RubricasVerPage.css";

import { catalogosService, type CatalogoItem } from "../../services/catalogos.service";
import { rubricaService, type Rubrica, type TipoRubrica } from "../../services/rubrica.service";
import { rubricaComponenteService, type RubricaComponente } from "../../services/rubricaComponente.service";
import { rubricaCriterioNivelService, type RubricaCriterioNivel } from "../../services/rubricaCriterioNivel.service";

const isActive = (estado: any) => (typeof estado === "boolean" ? estado : Number(estado) === 1);

export default function RubricasVerPage() {
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
  const [criteriosPorComponente, setCriteriosPorComponente] = useState<Record<number, RubricaCriterioNivel[]>>({});

  const nombreComp = (id: number) => catComponentes.find(x => x.id === id)?.nombre || `Componente #${id}`;
  const nombreCrit = (id: number) => catCriterios.find(x => x.id === id)?.nombre || `Criterio #${id}`;
  const nombreNivel = (id: number) => catNiveles.find(x => x.id === id)?.nombre || `Nivel #${id}`;

  useEffect(() => {
    (async () => {
      try { setCatComponentes(await catalogosService.componentes({ includeInactive: true })); } catch {}
      try { setCatCriterios(await catalogosService.criterios({ includeInactive: true })); } catch {}
      try { setCatNiveles(await catalogosService.niveles({ includeInactive: true })); } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);
      try {
        const list = await rubricaService.list({ carreraPeriodoId: cpId, includeInactive: true });
        setRubricas(Array.isArray(list) ? list : []);
      } catch (e: any) {
        setMsg(e?.response?.data?.message || "Error cargando rúbricas.");
      } finally {
        setLoading(false);
      }
    })();
  }, [cpId]);

  useEffect(() => {
    (async () => {
      if (!rubricaActiva?.id_rubrica) return;

      setLoading(true);
      setMsg(null);
      try {
        const comps = await rubricaComponenteService.list({ rubricaId: rubricaActiva.id_rubrica, includeInactive: true });
        const list = (Array.isArray(comps) ? comps : []).filter(x => isActive(x.estado));
        setComponentes(list);

        // ✅ cargar criterios por componente CATÁLOGO (id_componente)
        const map: Record<number, RubricaCriterioNivel[]> = {};
        for (const c of list) {
          const rows = await rubricaCriterioNivelService.list({
            componenteId: c.id_componente, // ✅ catálogo
            includeInactive: true,
          });
          map[c.id_componente] = (Array.isArray(rows) ? rows : []).filter(x => isActive(x.estado));
        }
        setCriteriosPorComponente(map);
      } catch (e: any) {
        setMsg(e?.response?.data?.message || "Error cargando diseño.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubricaActiva?.id_rubrica]);

  return (
    <div className="cp3-page">
      <div className="cp3-panel">
        <div className="cp3-panel-top">
          <div>
            <h1 className="cp3-title">Ver Rúbricas</h1>
            <p className="cp3-subtitle">Carrera–Período: <b>#{cpId}</b></p>
          </div>

          <div className="row-actions">
            <button className="btn-action assign" onClick={() => nav(`/rubricas/diseno/${cpId}`)}>Editar diseño</button>
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
        {loading && <div className="td-mini">Cargando…</div>}

        {!loading && !rubricaActiva && (
          <div className="td-center">No existe rúbrica {tab}.</div>
        )}

        {!loading && rubricaActiva && (
          <>
            <div className="rub-header">
              <div>
                <div className="rub-h-title">{rubricaActiva.nombre_rubrica}</div>
                <div className="td-mini">{rubricaActiva.descripcion_rubrica || ""}</div>
              </div>
              <span className="badge active">Ponderación global: {rubricaActiva.ponderacion_global ?? 50}%</span>
            </div>

            {componentes.length === 0 ? (
              <div className="td-center">No hay componentes activos.</div>
            ) : (
              componentes.map((c) => (
                <div key={c.id_rubrica_componente} className="rub-block">
                  <div className="rub-block-top">
                    <div className="td-strong">
                      {c.nombre_componente || nombreComp(c.id_componente)}
                      <span className="td-mini"> · Orden {c.orden_componente}</span>
                    </div>
                    <span className="badge active">{Number(c.ponderacion_porcentaje).toFixed(2)}%</span>
                  </div>

                  <div className="rub-block-body">
                    {(criteriosPorComponente[c.id_componente] || []).length === 0 ? (
                      <div className="td-mini">Sin criterios/niveles activos.</div>
                    ) : (
                      <ul className="rub-list">
                        {(criteriosPorComponente[c.id_componente] || []).map((x) => (
                          <li key={x.id_rubrica_criterio_nivel}>
                            <b>{nombreCrit(x.id_criterio)}</b> · <b>{nombreNivel(x.id_nivel)}</b> — {x.descripcion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
