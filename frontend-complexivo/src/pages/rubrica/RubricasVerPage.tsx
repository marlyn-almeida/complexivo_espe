import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RubricasVerPage.css";

import { rubricaService } from "../../services/rubrica.service";
import {
  rubricaComponenteService,
  type RubricaComponente,
} from "../../services/rubricaComponente.service";
import axiosClient from "../../api/axiosClient";

/** -----------------------------
 * Tipos locales (solo para esta vista)
 * ------------------------------ */
type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number | boolean;
};

type Nivel = {
  id_rubrica_nivel: number;
  id_rubrica: number;
  nombre_nivel: string;
  valor_nivel: number;
  // según tu BD puede venir como "orden" u "orden_nivel"
  orden?: number;
  orden_nivel?: number;
  estado: number | boolean;
};

type Criterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  descripcion_criterio?: string | null;
  orden: number;
  estado: number | boolean;
};

/** -----------------------------
 * Helpers
 * ------------------------------ */
function isActivo(estado: number | boolean | undefined) {
  // backend a veces manda 1/0 o true/false
  if (estado === true) return true;
  if (estado === false) return false;
  return Number(estado) === 1;
}

function toNum(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** -----------------------------
 * Service mínimo para criterios (porque dijiste que no lo tenías)
 * Endpoint REAL según tu server.js:
 *   /api/componentes/:componenteId/criterios
 * ------------------------------ */
async function listCriteriosByComponente(
  componenteId: number,
  includeInactive = true
): Promise<Criterio[]> {
  const res = await axiosClient.get(`/componentes/${componenteId}/criterios`, {
    params: { includeInactive: includeInactive ? 1 : 0 },
  });
  return (res.data ?? []) as Criterio[];
}

/** -----------------------------
 * Service mínimo para niveles (porque dijiste que no lo tenías)
 * Endpoint REAL según tu server.js:
 *   /api/rubricas/:rubricaId/niveles
 * ------------------------------ */
async function listNivelesByRubrica(
  rubricaId: number,
  includeInactive = true
): Promise<Nivel[]> {
  const res = await axiosClient.get(`/rubricas/${rubricaId}/niveles`, {
    params: { includeInactive: includeInactive ? 1 : 0 },
  });
  return (res.data ?? []) as Nivel[];
}

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const navigate = useNavigate();

  const periodoId = useMemo(() => toNum(idPeriodo, 0), [idPeriodo]);

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);
  const [criteriosByComp, setCriteriosByComp] = useState<
    Record<number, Criterio[]>
  >({});

  const load = async () => {
    if (!periodoId) return;

    setLoading(true);
    try {
      // ✅ 1) Rubrica por período (endpoint real)
      // Si no existe, normalmente el backend puede devolver 404.
      let r: Rubrica | null = null;
      try {
        r = (await rubricaService.getByPeriodo(periodoId)) as unknown as Rubrica;
      } catch (e: any) {
        // si no existe, dejamos rubrica en null (y la UI mostrará "No creado")
        r = null;
      }

      setRubrica(r);

      if (!r?.id_rubrica) {
        setNiveles([]);
        setComponentes([]);
        setCriteriosByComp({});
        return;
      }

      const rid = r.id_rubrica;

      // ✅ 2) Niveles + Componentes (endpoints reales)
      const [nivs, comps] = await Promise.all([
        listNivelesByRubrica(rid, true).catch(() => []),
        rubricaComponenteService.list(rid, { includeInactive: true }).catch(() => []),
      ]);

      setNiveles(nivs ?? []);
      setComponentes(comps ?? []);

      // ✅ 3) Criterios por componenteId (endpoint real)
      const map: Record<number, Criterio[]> = {};
      for (const c of comps ?? []) {
        const compId = c.id_rubrica_componente;
        map[compId] = await listCriteriosByComponente(compId, true).catch(() => []);
      }
      setCriteriosByComp(map);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la rúbrica del período");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId]);

  const createAndOpen = async () => {
    if (!periodoId) return;

    try {
      setLoading(true);

      // ✅ Crear/asegurar por período (endpoint real)
      const resp = await rubricaService.ensureByPeriodo(periodoId, {
        nombre_rubrica: "Rúbrica Complexivo",
        ponderacion_global: 100,
        descripcion_rubrica: null as any,
      });

      const createdRubrica = resp?.rubrica as unknown as Rubrica;
      if (!createdRubrica?.id_rubrica) {
        alert("No se pudo crear/abrir la rúbrica (respuesta inválida)");
        return;
      }

      navigate(`/rubricas/editar/${createdRubrica.id_rubrica}`, {
        state: { mode: resp.created ? "create" : "edit" },
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo crear/abrir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const nivelesActivos = useMemo(
    () => niveles.filter((x) => isActivo(x.estado)),
    [niveles]
  );

  const compsActivos = useMemo(
    () => componentes.filter((x) => isActivo(x.estado)),
    [componentes]
  );

  const totalPonderacion = useMemo(() => {
    return compsActivos.reduce((acc, c) => acc + toNum(c.ponderacion, 0), 0);
  }, [compsActivos]);

  const totalCriterios = useMemo(() => {
    let n = 0;
    for (const comp of compsActivos) {
      const arr = criteriosByComp[comp.id_rubrica_componente] ?? [];
      n += arr.filter((x) => isActivo(x.estado)).length;
    }
    return n;
  }, [criteriosByComp, compsActivos]);

  const isLista = useMemo(() => {
    return (
      !!rubrica &&
      nivelesActivos.length >= 2 &&
      compsActivos.length >= 1 &&
      totalCriterios >= 1
    );
  }, [rubrica, nivelesActivos.length, compsActivos.length, totalCriterios]);

  return (
    <div className="rv-page">
      <div className="rv-panel">
        <div>
          <h1 className="rv-title">Rúbrica del Período #{idPeriodo}</h1>
          <p className="rv-subtitle">
            Aquí puedes ver el estado real de la rúbrica y abrir el editor.
          </p>
        </div>

        <button className="rv-btn ghost" onClick={() => navigate("/rubricas")}>
          Volver
        </button>
      </div>

      <div className="rv-card">
        <div className="rv-card-head">
          <div>
            <div className="rv-k">Estado</div>
            <div
              className={`rv-badge ${
                !rubrica ? "off" : isActivo(rubrica.estado) ? "ok" : "off"
              }`}
            >
              {!rubrica ? "No creado" : isActivo(rubrica.estado) ? "Activa" : "Inactiva"}
            </div>

            {rubrica && (
              <div style={{ marginTop: 8 }}>
                <div className="rv-k">Progreso</div>
                <div className={`rv-badge ${isLista ? "ok" : "off"}`}>
                  {isLista ? "Lista para usar" : "Incompleta"}
                </div>
              </div>
            )}
          </div>

          <div className="rv-actions">
            {rubrica ? (
              <button
                className="rv-btn primary"
                onClick={() =>
                  navigate(`/rubricas/editar/${rubrica.id_rubrica}`, {
                    state: { mode: "edit" },
                  })
                }
              >
                Editar rúbrica
              </button>
            ) : (
              <button className="rv-btn primary" onClick={createAndOpen}>
                Crear rúbrica
              </button>
            )}
          </div>
        </div>

        <div className="rv-body">
          <div className="rv-row">
            <span className="k">Nombre</span>
            <span className="v">{rubrica?.nombre_rubrica ?? "—"}</span>
          </div>

          <div className="rv-row">
            <span className="k">Ponderación global</span>
            <span className="v">{rubrica?.ponderacion_global ?? "—"}</span>
          </div>

          <div className="rv-row">
            <span className="k">Descripción</span>
            <span className="v">{rubrica?.descripcion_rubrica ?? "—"}</span>
          </div>

          {rubrica && (
            <>
              <div className="rv-divider" />

              <div className="rv-row">
                <span className="k">Niveles</span>
                <span className="v">
                  {nivelesActivos.length} activos ({niveles.length} totales)
                </span>
              </div>

              <div className="rv-row">
                <span className="k">Componentes</span>
                <span className="v">
                  {compsActivos.length} activos ({componentes.length} totales) —{" "}
                  {totalPonderacion.toFixed(2)}% sumado
                </span>
              </div>

              <div className="rv-row">
                <span className="k">Criterios</span>
                <span className="v">{totalCriterios} activos</span>
              </div>

              <div className="rv-divider" />

              <div className="rv-k" style={{ marginBottom: 8 }}>
                Resumen por componente
              </div>

              {compsActivos.length === 0 ? (
                <div className="rv-muted">Aún no hay componentes creados.</div>
              ) : (
                <div className="rv-list">
                  {compsActivos
                    .slice()
                    .sort((a, b) => toNum(a.orden, 0) - toNum(b.orden, 0))
                    .map((c) => {
                      const cr = criteriosByComp[c.id_rubrica_componente] ?? [];
                      const nCr = cr.filter((x) => isActivo(x.estado)).length;

                      return (
                        <div className="rv-item" key={c.id_rubrica_componente}>
                          <div className="rv-item-title">
                            {c.nombre_componente}{" "}
                            <span className="rv-pill">{c.tipo_componente}</span>
                          </div>
                          <div className="rv-item-sub">
                            Ponderación:{" "}
                            <b>{toNum(c.ponderacion, 0).toFixed(2)}%</b> — Criterios:{" "}
                            <b>{nCr}</b>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {!rubrica && (
            <div className="rv-hint">
              Primero crea la rúbrica. Luego podrás agregar niveles, componentes y
              criterios.
            </div>
          )}
        </div>
      </div>

      {loading && <div className="rv-muted">Cargando…</div>}
    </div>
  );
}
