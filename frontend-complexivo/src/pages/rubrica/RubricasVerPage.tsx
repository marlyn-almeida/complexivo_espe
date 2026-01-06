import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasVerPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

type Nivel = {
  id_rubrica_nivel: number;
  id_rubrica: number;
  nombre_nivel: string;
  valor_nivel: number;
  orden_nivel: number;
  estado: number;
};

type Componente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  nombre_componente: string;
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO";
  ponderacion: number;
  orden: number;
  estado: number;
};

type Criterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  orden: number;
  estado: number;
};

// ✅ intenta varias rutas hasta encontrar la correcta
async function getWithFallback<T>(paths: string[], params?: any): Promise<T> {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      const res = await axiosClient.get(p, { params });
      return res.data as T;
    } catch (e: any) {
      lastErr = e;
    }
  }
  throw lastErr;
}

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [criteriosByComp, setCriteriosByComp] = useState<Record<number, Criterio[]>>({});

  const load = async () => {
    setLoading(true);
    try {
      // 1) rubrica por periodo
      const res = await axiosClient.get("/rubricas", {
        params: { periodoId: Number(idPeriodo), includeInactive: true },
      });
      const arr: Rubrica[] = res.data ?? [];
      const r = arr[0] ?? null;
      setRubrica(r);

      if (!r?.id_rubrica) {
        setNiveles([]);
        setComponentes([]);
        setCriteriosByComp({});
        return;
      }

      const rid = r.id_rubrica;

      // 2) niveles + componentes (estas rutas deben ser las tuyas reales; si no, me pasas tus routes)
      const [nivs, comps] = await Promise.all([
        getWithFallback<Nivel[]>(
          [
            `/rubricas/${rid}/niveles`,
            `/rubrica-niveles?rubricaId=${rid}`,
            `/rubricas-niveles?rubricaId=${rid}`,
          ],
          { includeInactive: true }
        ).catch(() => []),
        getWithFallback<Componente[]>(
          [
            `/rubricas/${rid}/componentes`,
            `/rubrica-componentes?rubricaId=${rid}`,
            `/rubricas-componentes?rubricaId=${rid}`,
          ],
          { includeInactive: true }
        ).catch(() => []),
      ]);

      setNiveles(nivs ?? []);
      setComponentes(comps ?? []);

      // 3) criterios por componenteId (✅ aquí está el fix real)
      const map: Record<number, Criterio[]> = {};
      for (const c of (comps ?? [])) {
        const compId = c.id_rubrica_componente;

        const criterios = await getWithFallback<Criterio[]>(
          [
            // la más probable en tu caso:
            `/rubricas-componentes/${compId}/criterios`,
            `/rubrica-componentes/${compId}/criterios`,

            // otras variantes comunes:
            `/rubricas-criterios?componenteId=${compId}`,
            `/rubrica-criterios?componenteId=${compId}`,
          ],
          { includeInactive: true }
        ).catch(() => []);

        map[compId] = criterios ?? [];
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
  }, [idPeriodo]);

  const createAndOpen = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.post("/rubricas", {
        id_periodo: Number(idPeriodo),
        nombre_rubrica: "Rúbrica Complexivo",
        ponderacion_global: 100,
        descripcion_rubrica: null,
      });
      const created: Rubrica = res.data;
      navigate(`/rubricas/editar/${created.id_rubrica}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo crear/abrir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const nivelesActivos = useMemo(() => niveles.filter((x) => x.estado === 1), [niveles]);
  const compsActivos = useMemo(() => componentes.filter((x) => x.estado === 1), [componentes]);

  const totalPonderacion = useMemo(() => {
    return compsActivos.reduce((acc, c) => acc + Number(c.ponderacion || 0), 0);
  }, [compsActivos]);

  const totalCriterios = useMemo(() => {
    let n = 0;
    for (const comp of compsActivos) {
      const arr = criteriosByComp[comp.id_rubrica_componente] ?? [];
      n += arr.filter((x) => x.estado === 1).length;
    }
    return n;
  }, [criteriosByComp, compsActivos]);

  const isLista = useMemo(() => {
    return !!rubrica && nivelesActivos.length >= 2 && compsActivos.length >= 1 && totalCriterios >= 1;
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
            <div className={`rv-badge ${!rubrica ? "off" : rubrica.estado === 1 ? "ok" : "off"}`}>
              {!rubrica ? "No creado" : rubrica.estado === 1 ? "Activa" : "Inactiva"}
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
              <button className="rv-btn primary" onClick={() => navigate(`/rubricas/editar/${rubrica.id_rubrica}`)}>
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
                <span className="v">{nivelesActivos.length} activos ({niveles.length} totales)</span>
              </div>

              <div className="rv-row">
                <span className="k">Componentes</span>
                <span className="v">
                  {compsActivos.length} activos ({componentes.length} totales) — {totalPonderacion.toFixed(2)}% sumado
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
                    .sort((a, b) => a.orden - b.orden)
                    .map((c) => {
                      const cr = criteriosByComp[c.id_rubrica_componente] ?? [];
                      const nCr = cr.filter((x) => x.estado === 1).length;

                      return (
                        <div className="rv-item" key={c.id_rubrica_componente}>
                          <div className="rv-item-title">
                            {c.nombre_componente} <span className="rv-pill">{c.tipo_componente}</span>
                          </div>
                          <div className="rv-item-sub">
                            Ponderación: <b>{Number(c.ponderacion || 0).toFixed(2)}%</b> — Criterios: <b>{nCr}</b>
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
              Primero crea la rúbrica. Luego podrás agregar niveles, componentes y criterios.
            </div>
          )}
        </div>
      </div>

      {loading && <div className="rv-muted">Cargando…</div>}
    </div>
  );
}
