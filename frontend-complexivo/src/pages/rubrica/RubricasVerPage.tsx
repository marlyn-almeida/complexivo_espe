// src/pages/rubricas/RubricasVerPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "./RubricasVerPage.css";

import { rubricaService } from "../../services/rubrica.service";
import {
  rubricaComponenteService,
  type RubricaComponente,
} from "../../services/rubricaComponente.service";
import axiosClient from "../../api/axiosClient";

import { Eye, ArrowLeft, BadgeCheck, BadgeX, List } from "lucide-react";
import escudoESPE from "../../assets/escudo.png";

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
  valor_nivel: number | string;
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
function isActivo(estado: number | boolean | undefined | null) {
  if (estado === true) return true;
  if (estado === false) return false;
  if (estado === null || estado === undefined) return false;
  return Number(estado) === 1;
}

// ✅ soporta "40,00" / "40%" / "40,00 %" / null
function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;

  const s = String(v)
    .trim()
    .replace(/\s/g, "")
    .replace("%", "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

// ✅ unwrap por si tu API manda { ok, data: [...] } o si te pasan AxiosResponse
function unwrapArray<T = any>(payload: any): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as T[];

  // AxiosResponse
  if (payload?.data !== undefined) {
    const d = payload.data;
    if (Array.isArray(d)) return d as T[];
    if (d?.ok && Array.isArray(d.data)) return d.data as T[];
    if (Array.isArray(d?.data)) return d.data as T[];
  }

  // { ok, data }
  if (payload?.ok && Array.isArray(payload.data)) return payload.data as T[];
  if (Array.isArray(payload?.data)) return payload.data as T[];
  return [];
}

/** ✅ Para que NO salga OTRO en UI */
function compTypeLabel(t?: string) {
  switch (t) {
    case "ESCRITA":
      return { text: "Escrita", cls: "rvPill escrita" };
    case "ORAL":
      return { text: "Oral", cls: "rvPill oral" };
    default:
      return { text: "General", cls: "rvPill general" };
  }
}

/** ✅ Normaliza campos del componente (para que no te salga total 0) */
function normalizeComp(raw: any): RubricaComponente {
  const ponderacion =
    raw?.ponderacion ??
    raw?.ponderacion_componente ??
    raw?.porcentaje ??
    raw?.porcentaje_ponderacion ??
    0;

  const estado =
    raw?.estado ??
    raw?.estado_activo ??
    raw?.estadoActivo ??
    raw?.estadoActiva ??
    raw?.estado_activa ??
    1;

  // ojo: tu UI y cálculos usan estas claves
  return {
    ...raw,
    ponderacion: toNum(ponderacion, 0),
    estado, // lo dejamos como venga (0/1/bool), isActivo lo interpreta
  } as RubricaComponente;
}

/** Endpoints mínimos */
async function listCriteriosByComponente(
  componenteId: number,
  includeInactive = true
): Promise<Criterio[]> {
  const res = await axiosClient.get(`/componentes/${componenteId}/criterios`, {
    params: { includeInactive: includeInactive ? 1 : 0 },
  });
  return unwrapArray<Criterio>(res);
}

async function listNivelesByRubrica(
  rubricaId: number,
  includeInactive = true
): Promise<Nivel[]> {
  const res = await axiosClient.get(`/rubricas/${rubricaId}/niveles`, {
    params: { includeInactive: includeInactive ? 1 : 0 },
  });
  return unwrapArray<Nivel>(res);
}

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const navigate = useNavigate();

  const periodoId = useMemo(() => toNum(idPeriodo, 0), [idPeriodo]);

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);
  const [criteriosByComp, setCriteriosByComp] = useState<Record<number, Criterio[]>>({});

  const load = async () => {
    if (!periodoId) return;

    setLoading(true);
    try {
      // 1) Rúbrica por período (404 => null)
      let r: Rubrica | null = null;
      try {
        r = (await rubricaService.getByPeriodo(periodoId)) as unknown as Rubrica;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status !== 404) console.error(err);
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

      // 2) Niveles + Componentes
      const [nivsRaw, compsResp] = await Promise.all([
        listNivelesByRubrica(rid, true).catch(() => []),
        rubricaComponenteService.list(rid, { includeInactive: true }).catch(() => null),
      ]);

      const nivs = (nivsRaw ?? []).map((n: any) => ({
        ...n,
        valor_nivel: toNum(n.valor_nivel, 0),
        orden_nivel: toNum(n.orden_nivel ?? n.orden ?? 0, 0),
      })) as Nivel[];
      setNiveles(nivs);

      const compsArrRaw = unwrapArray<RubricaComponente>(compsResp);
      const comps = (compsArrRaw ?? []).map((c: any) => normalizeComp(c));
      setComponentes(comps);

      // 3) Criterios por componente
      const map: Record<number, Criterio[]> = {};
      for (const c of comps ?? []) {
        const compId = (c as any).id_rubrica_componente;
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

      const resp = await rubricaService.ensureByPeriodo(periodoId, {
        nombre_rubrica: "Rúbrica Complexivo",
        ponderacion_global: 100,
        descripcion_rubrica: "",
      });

      const createdRubrica = resp?.rubrica as unknown as Rubrica;
      if (!createdRubrica?.id_rubrica) {
        alert("No se pudo crear/abrir la rúbrica (respuesta inválida)");
        return;
      }

      navigate(`/rubricas/editar/${createdRubrica.id_rubrica}`, {
        state: {
          mode: resp.created ? "create" : "edit",
          returnTo: `/rubricas/periodo/${periodoId}`,
        },
      });
    } catch (e) {
      console.error(e);
      alert("No se pudo crear/abrir la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  // ✅ SOLO ACTIVOS (y usando estado normalizado)
  const nivelesActivos = useMemo(() => niveles.filter((x) => isActivo(x.estado)), [niveles]);

  const compsActivos = useMemo(
    () => componentes.filter((x: any) => isActivo(x.estado)),
    [componentes]
  );

  // ✅ Total ponderación REAL (con normalizeComp ya no te dará 0 raro)
  const totalPonderacionActiva = useMemo(() => {
    return compsActivos.reduce((acc, c: any) => acc + toNum(c.ponderacion, 0), 0);
  }, [compsActivos]);

  const okPonderacion = useMemo(
    () => Math.abs(totalPonderacionActiva - 100) < 0.001,
    [totalPonderacionActiva]
  );

  const faltaPonderacion = useMemo(
    () => Math.max(0, 100 - totalPonderacionActiva),
    [totalPonderacionActiva]
  );

  const totalCriteriosActivos = useMemo(() => {
    let n = 0;
    for (const comp of compsActivos as any[]) {
      const arr = criteriosByComp[comp.id_rubrica_componente] ?? [];
      n += arr.filter((x) => isActivo(x.estado)).length;
    }
    return n;
  }, [criteriosByComp, compsActivos]);

  // ✅ progreso real (no “—” si ya existe)
  const isLista = useMemo(() => {
    return (
      !!rubrica &&
      nivelesActivos.length >= 2 &&
      compsActivos.length >= 1 &&
      totalCriteriosActivos >= 1 &&
      okPonderacion
    );
  }, [rubrica, nivelesActivos.length, compsActivos.length, totalCriteriosActivos, okPonderacion]);

  const estadoTexto = !rubrica ? "No creada" : isActivo(rubrica.estado) ? "Activa" : "Inactiva";
  const estadoOk = !!rubrica && isActivo(rubrica.estado);

  return (
    <div className="wrap rubricasVerPage">
      <div className="containerFull">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">RÚBRICA DEL PERÍODO</h1>
              <p className="heroSubtitle">Revisa el estado y abre el editor</p>
            </div>
          </div>

          <button className="heroBtn" onClick={() => navigate("/rubricas")} type="button">
            <ArrowLeft className="iconSm" /> Volver
          </button>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <Eye className="iconSm" />
              </span>
              Período #{idPeriodo}
            </div>

            <div className="rvActionsTop">
              {rubrica ? (
                <button
                  className="btnPrimary"
                  onClick={() =>
                    navigate(`/rubricas/editar/${rubrica.id_rubrica}`, {
                      state: { mode: "edit", returnTo: `/rubricas/periodo/${periodoId}` },
                    })
                  }
                  type="button"
                >
                  Abrir rúbrica
                </button>
              ) : (
                <button className="btnPrimary" onClick={createAndOpen} type="button">
                  Crear rúbrica
                </button>
              )}
            </div>
          </div>

          {/* ESTADO + PROGRESO */}
          <div className="rvSummary">
            <div className="rvSummaryBox">
              <div className="rvLabel">Estado</div>

              <div className={`rvBadge ${estadoOk ? "ok" : "off"}`}>
                <span className="rvIcoWrap" aria-hidden="true">
                  <BadgeCheck className={`rvIco ${estadoOk ? "isOn" : "isOff"}`} />
                  <BadgeX className={`rvIco ${estadoOk ? "isOff" : "isOn"}`} />
                </span>
                {estadoTexto}
              </div>
            </div>

            <div className="rvSummaryBox">
              <div className="rvLabel">Progreso</div>

              <div className={`rvBadge ${rubrica && isLista ? "ok" : "off"}`}>
                <span className="rvIcoWrap" aria-hidden="true">
                  <BadgeCheck className={`rvIco ${rubrica && isLista ? "isOn" : "isOff"}`} />
                  <BadgeX className={`rvIco ${rubrica && isLista ? "isOff" : "isOn"}`} />
                </span>

                {rubrica ? (isLista ? "Lista para usar" : "Incompleta") : "—"}
              </div>
            </div>
          </div>

          {/* DETALLE */}
          <div className="rvGrid">
            <div className="rvRow">
              <div className="k">Nombre</div>
              <div className="v">{rubrica?.nombre_rubrica ?? "—"}</div>
            </div>

            <div className="rvRow">
              <div className="k">Ponderación global</div>
              <div className="v">{rubrica?.ponderacion_global ?? "—"}</div>
            </div>

            <div className="rvRow">
              <div className="k">Descripción</div>
              <div className="v">{rubrica?.descripcion_rubrica ?? "—"}</div>
            </div>
          </div>

          {rubrica ? (
            <>
              <div className="rvDivider" />

              {/* MINI CARDS: ACTIVOS */}
              <div className="rvMiniGrid">
                <div className="miniCard">
                  <div className="miniLabel">Niveles</div>
                  <div className="miniValue">{nivelesActivos.length}</div>
                  <div className="miniSub">activos</div>
                </div>

                <div className="miniCard">
                  <div className="miniLabel">Componentes</div>
                  <div className="miniValue">{compsActivos.length}</div>
                  <div className="miniSub">
                    Total ponderación: <b>{totalPonderacionActiva.toFixed(2)}%</b>
                    {!okPonderacion ? (
                      <span className="miniWarn"> — falta {faltaPonderacion.toFixed(2)}%</span>
                    ) : null}
                  </div>
                </div>

                <div className="miniCard">
                  <div className="miniLabel">Criterios</div>
                  <div className="miniValue">{totalCriteriosActivos}</div>
                  <div className="miniSub">activos</div>
                </div>
              </div>

              <div className="rvDivider" />

              <div className="rvSectionTitle">
                <span className="sectionTitleIcon">
                  <List className="iconSm" />
                </span>
                Resumen por componente
              </div>

              {compsActivos.length === 0 ? (
                <div className="rvMuted">Aún no hay componentes activos.</div>
              ) : (
                <div className="rvList">
                  {compsActivos
                    .slice()
                    .sort((a: any, b: any) => toNum(a.orden, 0) - toNum(b.orden, 0))
                    .map((c: any) => {
                      const cr = criteriosByComp[c.id_rubrica_componente] ?? [];
                      const nCr = cr.filter((x) => isActivo(x.estado)).length;
                      const typeUI = compTypeLabel(c.tipo_componente);

                      return (
                        <div className="rvItem" key={c.id_rubrica_componente}>
                          <div className="rvItemTitle">
                            {c.nombre_componente}
                            <span className={typeUI.cls}>{typeUI.text}</span>
                          </div>
                          <div className="rvItemSub">
                            Ponderación: <b>{toNum(c.ponderacion, 0).toFixed(2)}%</b> — Criterios:{" "}
                            <b>{nCr}</b>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          ) : (
            <div className="rvHint">
              Primero crea la rúbrica. Luego podrás agregar niveles, componentes y criterios.
            </div>
          )}

          {loading ? (
            <div className="rvMuted" style={{ marginTop: 10 }}>
              Cargando…
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
