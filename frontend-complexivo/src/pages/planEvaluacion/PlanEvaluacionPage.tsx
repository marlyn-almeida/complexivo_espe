import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, Save, XCircle, ClipboardList, Info, Users } from "lucide-react";

import "./PlanEvaluacionPage.css";

import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import { carreraPeriodoService } from "../../services/carreraPeriodo.service";

import type { PlanEvaluacion } from "../../types/planEvaluacion";
import type { PlanEvaluacionItem, CalificadoPor, TipoItemPlan } from "../../types/planEvaluacionItem";
import type { RubricaLite, RubricaComponenteLite } from "../../types/rubrica";
import type { PlanItemRubricaCalificador } from "../../types/planItemRubricaCalificador";

import { planEvaluacionService } from "../../services/planEvaluacion.service";
import { rubricasLiteService } from "../../services/rubricasLite.service";

type ToastType = "success" | "error" | "info";

type ItemDraft = Partial<PlanEvaluacionItem> & {
  _tempId: string;
  _deleted?: boolean;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function clampPct(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function labelTipo(t: TipoItemPlan) {
  if (t === "NOTA_DIRECTA") return "Nota Directa (Ej: Cuestionario)";
  if (t === "CUESTIONARIO") return "Cuestionario";
  return "Basado en Rúbrica Tabular (Ej: Parte Escrita)";
}

function labelCalificador(c: CalificadoPor) {
  if (c === "ROL2") return "Director de Carrera / Docente de Apoyo";
  if (c === "TRIBUNAL") return "Miembros del Tribunal";
  return "Calificadores Generales";
}

export default function PlanEvaluacionPage() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  const [loading, setLoading] = useState(false);

  const [carreraPeriodos, setCarreraPeriodos] = useState<CarreraPeriodo[]>([]);
  const [selectedCP, setSelectedCP] = useState<number | "">("");

  const [plan, setPlan] = useState<PlanEvaluacion | null>(null);

  // form plan
  const [nombrePlan, setNombrePlan] = useState("");
  const [descPlan, setDescPlan] = useState("");

  // items
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [rubricas, setRubricas] = useState<RubricaLite[]>([]);
  const [rubricaComponentes, setRubricaComponentes] = useState<Record<number, RubricaComponenteLite[]>>({});
  const [componentCalif, setComponentCalif] = useState<Record<number, Record<number, CalificadoPor>>>({}); // itemId -> compId -> calif

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function selectedCPLabel(): string {
    const cp = carreraPeriodos.find((x) => Number(x.id_carrera_periodo) === Number(selectedCP));
    if (!cp) return "";
    const carrera = cp.nombre_carrera ?? "Carrera";
    const periodo = cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período";
    return `${carrera} — ${periodo}`;
  }

  // ===== INIT CP =====
  useEffect(() => {
    const qp = sp.get("cp");
    if (qp) setSelectedCP(Number(qp));
    loadCarreraPeriodos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCarreraPeriodos() {
    try {
      setLoading(true);
      const cps = await carreraPeriodoService.list(false);
      setCarreraPeriodos(cps);

      const qp = sp.get("cp");
      if (qp) return;

      const first = cps.find((x) => Boolean(x.estado)) ?? cps[0];
      if (first) setSelectedCP(first.id_carrera_periodo);
    } catch {
      setCarreraPeriodos([]);
      setSelectedCP("");
      showToast("Error al cargar Carrera–Período", "error");
    } finally {
      setLoading(false);
    }
  }

  // ===== LOAD BY CP =====
  useEffect(() => {
    if (!selectedCP) return;
    loadAllByCP(Number(selectedCP));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCP]);

  async function loadAllByCP(cpId: number) {
    try {
      setLoading(true);

      const [p, r] = await Promise.all([planEvaluacionService.getByCP(cpId), rubricasLiteService.listByCP(cpId)]);
      setRubricas(r ?? []);

      if (!p) {
        setPlan(null);
        setNombrePlan(`Plan de Evaluación para ${selectedCPLabel()}`);
        setDescPlan("");
        setItems([]);
        setComponentCalif({});
        return;
      }

      setPlan(p);
      setNombrePlan(p.nombre_plan ?? "");
      setDescPlan(p.descripcion_plan ?? "");

      const its = await planEvaluacionService.listItems(cpId, p.id_plan_evaluacion);
      const drafts: ItemDraft[] = (its ?? []).map((x) => ({ ...x, _tempId: uid() }));
      setItems(drafts);

      // cargar calificador por componente (solo para items rubrica)
      for (const it of drafts) {
        if (it.tipo_item === "RUBRICA" && it.id_plan_item) {
          const map = await planEvaluacionService.listComponentCalificadores(cpId, it.id_plan_item);
          setComponentCalif((prev) => ({
            ...prev,
            [it.id_plan_item as number]: map.reduce((acc, row) => {
              acc[Number(row.id_rubrica_componente)] = row.calificado_por;
              return acc;
            }, {} as Record<number, CalificadoPor>),
          }));
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || "No se pudo cargar el plan.";
      showToast(String(msg), "error");
    } finally {
      setLoading(false);
    }
  }

  // ===== COMPUTE SUM =====
  const sumPct = useMemo(() => {
    return items
      .filter((x) => !x._deleted)
      .reduce((acc, it) => acc + clampPct(it.ponderacion_global_pct ?? 0), 0);
  }, [items]);

  // ===== ITEM ACTIONS =====
  function addItem() {
    const d: ItemDraft = {
      _tempId: uid(),
      nombre_item: "",
      tipo_item: "NOTA_DIRECTA",
      ponderacion_global_pct: 0,
      calificado_por: "ROL2",
      id_rubrica: null,
      estado: 1,
    };
    setItems((prev) => [...prev, d]);
  }

  function updateItemDraft(tempId: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((x) => (x._tempId === tempId ? { ...x, ...patch } : x)));
  }

  async function onSoftDelete(tempId: string) {
    const it = items.find((x) => x._tempId === tempId);
    if (!it) return;

    // si existe en DB => update estado false, sino solo borrar en UI
    if (it.id_plan_item) {
      try {
        setLoading(true);
        await planEvaluacionService.updateItem(Number(selectedCP), it.id_plan_item, { estado: false });
        showToast("Ítem eliminado.", "success");
        updateItemDraft(tempId, { _deleted: true });
      } catch (e: any) {
        const msg = e?.response?.data?.message || "No se pudo eliminar el ítem.";
        showToast(String(msg), "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    setItems((prev) => prev.filter((x) => x._tempId !== tempId));
  }

  // ===== RUBRICA COMPONENTES =====
  async function ensureRubricaComponentes(id_rubrica: number) {
    if (rubricaComponentes[id_rubrica]) return;
    try {
      const comps = await rubricasLiteService.listComponentes(id_rubrica);
      setRubricaComponentes((prev) => ({ ...prev, [id_rubrica]: comps ?? [] }));
    } catch {
      setRubricaComponentes((prev) => ({ ...prev, [id_rubrica]: [] }));
    }
  }

  function setCompCalificador(id_plan_item: number, id_rubrica_componente: number, calificado_por: CalificadoPor) {
    setComponentCalif((prev) => ({
      ...prev,
      [id_plan_item]: {
        ...(prev[id_plan_item] ?? {}),
        [id_rubrica_componente]: calificado_por,
      },
    }));
  }

  // ===== SAVE ALL =====
  async function onSaveAll() {
    if (!selectedCP) return;

    // validaciones base
    if (!nombrePlan.trim()) {
      showToast("Ingrese el nombre del plan.", "error");
      return;
    }
    if (sumPct > 100.0001) {
      showToast("La suma de ponderaciones supera 100%.", "error");
      return;
    }

    try {
      setLoading(true);

      let planId = plan?.id_plan_evaluacion;

      // 1) crear o actualizar plan
      if (!planId) {
        planId = await planEvaluacionService.create(Number(selectedCP), {
          nombre_plan: nombrePlan.trim(),
          descripcion_plan: descPlan.trim() || null,
        });

        // refrescar plan
        const p = await planEvaluacionService.getByCP(Number(selectedCP));
        setPlan(p);
      } else {
        await planEvaluacionService.update(Number(selectedCP), planId, {
          nombre_plan: nombrePlan.trim(),
          descripcion_plan: descPlan.trim() || null,
        });
      }

      if (!planId) throw new Error("No se pudo obtener id del plan");

      // 2) guardar items
      for (const it of items) {
        if (it._deleted) continue;

        const nombre_item = String(it.nombre_item ?? "").trim();
        if (!nombre_item) continue; // si está vacío, no lo guardo

        const tipo_item = (it.tipo_item ?? "NOTA_DIRECTA") as TipoItemPlan;
        const ponderacion_global_pct = clampPct(it.ponderacion_global_pct ?? 0);

        // calificado_por: para RUBRICA lo dejamos en ROL2 por defecto (igual asignas por componente)
        const calificado_por: CalificadoPor =
          tipo_item === "RUBRICA" ? "ROL2" : ((it.calificado_por ?? "ROL2") as CalificadoPor);

        const id_rubrica = tipo_item === "RUBRICA" ? Number(it.id_rubrica || 0) || null : null;

        // create
        if (!it.id_plan_item) {
          const newId = await planEvaluacionService.createItem(Number(selectedCP), {
            id_plan_evaluacion: planId,
            nombre_item,
            tipo_item,
            ponderacion_global_pct,
            calificado_por,
            id_rubrica,
          });

          // actualizar UI con id
          setItems((prev) =>
            prev.map((x) => (x._tempId === it._tempId ? { ...x, id_plan_item: newId, id_plan_evaluacion: planId } : x))
          );

          // si rubrica, carga calificador por componente si ya está seteado
          if (tipo_item === "RUBRICA" && id_rubrica) {
            await ensureRubricaComponentes(id_rubrica);
          }

          continue;
        }

        // update
        await planEvaluacionService.updateItem(Number(selectedCP), it.id_plan_item, {
          nombre_item,
          tipo_item,
          ponderacion_global_pct,
          calificado_por,
          id_rubrica,
        });
      }

      // 3) guardar asignación de calificadores por componente (solo items RUBRICA)
      for (const it of items) {
        if (it._deleted) continue;
        if (it.tipo_item !== "RUBRICA") continue;
        if (!it.id_plan_item) continue;
        if (!it.id_rubrica) continue;

        const comps = rubricaComponentes[it.id_rubrica] ?? [];
        if (!comps.length) continue;

        const map = componentCalif[it.id_plan_item] ?? {};

        // si no eligió nada, por defecto: TRIBUNAL
        for (const c of comps) {
          const chosen = (map[c.id_rubrica_componente] ?? "TRIBUNAL") as CalificadoPor;
          await planEvaluacionService.setComponentCalificador(Number(selectedCP), {
            id_plan_item: it.id_plan_item,
            id_rubrica_componente: c.id_rubrica_componente,
            calificado_por: chosen,
          });
        }
      }

      showToast("Plan de evaluación guardado.", "success");

      // recargar todo para que quede “limpio”
      await loadAllByCP(Number(selectedCP));
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "No se pudo guardar el plan.";
      showToast(String(msg), "error");
    } finally {
      setLoading(false);
    }
  }

  const cpLabel = selectedCPLabel();

  return (
    <div className="planPage">
      {toast ? <div className={`toast toast-${toast.type}`}>{toast.msg}</div> : null}

      {/* HERO */}
      <div className="hero">
        <div className="heroLeft">
          <div className="heroText">
            <h2 className="heroTitle">PLAN DE EVALUACIÓN</h2>
            <p className="heroSubtitle">Gestión de planes y criterios de evaluación</p>
          </div>
        </div>
      </div>

      {/* CP Selector */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <Info size={18} />
            </span>
            Contexto
          </div>
        </div>

        <div className="filtersRow">
          <select
            className="select"
            value={selectedCP}
            onChange={(e) => setSelectedCP(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Seleccione Carrera–Período...</option>
            {carreraPeriodos.map((cp) => (
              <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                {(cp.nombre_carrera ?? "Carrera") + " — " + (cp.codigo_periodo ?? cp.descripcion_periodo ?? "Período")}
              </option>
            ))}
          </select>

          <div className="muted">
            Trabajando en: <b>{cpLabel || "—"}</b>
          </div>
        </div>
      </div>

      {/* DATOS PLAN */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <ClipboardList size={18} />
            </span>
            Datos del Plan de Evaluación
          </div>
        </div>

        <div className="formGrid">
          <div className="field">
            <label>Nombre del Plan</label>
            <input value={nombrePlan} onChange={(e) => setNombrePlan(e.target.value)} placeholder="Nombre del plan" />
          </div>

          <div className="field fieldFull">
            <label>Descripción (Opcional)</label>
            <textarea
              value={descPlan}
              onChange={(e) => setDescPlan(e.target.value)}
              placeholder="Breve descripción del propósito del plan..."
            />
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <ClipboardList size={18} />
            </span>
            Ítems del Plan de Evaluación
          </div>

          <button className="btnPrimary" onClick={addItem} disabled={!selectedCP || loading}>
            <Plus size={18} /> Añadir Ítem
          </button>
        </div>

        <div className="sumRow">
          <div className={`sumChip ${sumPct > 100 ? "bad" : ""}`}>
            Suma de ponderaciones: <b>{sumPct.toFixed(2)}%</b>
          </div>
        </div>

        <div className="itemsStack">
          {items.filter((x) => !x._deleted).length === 0 ? (
            <div className="empty">No hay ítems. Presiona “Añadir Ítem”.</div>
          ) : (
            items
              .filter((x) => !x._deleted)
              .map((it, idx) => {
                const tipo = (it.tipo_item ?? "NOTA_DIRECTA") as TipoItemPlan;
                const isRubrica = tipo === "RUBRICA";

                const itemGlobalPct = clampPct(it.ponderacion_global_pct ?? 0);
                const rubId = Number(it.id_rubrica || 0) || null;
                const comps: RubricaComponenteLite[] = rubId ? rubricaComponentes[rubId] ?? [] : [];

                const itemId = it.id_plan_item ?? 0;
                const map = itemId ? componentCalif[itemId] ?? {} : {};

                return (
                  <div className="itemCard" key={it._tempId}>
                    <div className="itemHead">
                      <div className="itemTitle">Ítem {idx + 1}</div>
                      <button className="btnDanger" onClick={() => onSoftDelete(it._tempId)} disabled={loading}>
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="itemGrid">
                      <div className="field">
                        <label>Nombre del Ítem</label>
                        <input
                          value={String(it.nombre_item ?? "")}
                          onChange={(e) => updateItemDraft(it._tempId, { nombre_item: e.target.value })}
                          placeholder="Ej: Cuestionario Teórico"
                        />
                      </div>

                      <div className="field">
                        <label>Tipo de Ítem</label>
                        <select
                          value={tipo}
                          onChange={async (e) => {
                            const t = e.target.value as TipoItemPlan;
                            updateItemDraft(it._tempId, {
                              tipo_item: t,
                              id_rubrica: t === "RUBRICA" ? (rubricas[0]?.id_rubrica ?? null) : null,
                            });

                            if (t === "RUBRICA" && rubricas[0]?.id_rubrica) {
                              await ensureRubricaComponentes(rubricas[0].id_rubrica);
                            }
                          }}
                        >
                          <option value="NOTA_DIRECTA">{labelTipo("NOTA_DIRECTA")}</option>
                          <option value="CUESTIONARIO">{labelTipo("CUESTIONARIO")}</option>
                          <option value="RUBRICA">{labelTipo("RUBRICA")}</option>
                        </select>
                      </div>

                      <div className="field">
                        <label>% Ponderación Global (%)</label>
                        <input
                          type="number"
                          value={Number(it.ponderacion_global_pct ?? 0)}
                          onChange={(e) => updateItemDraft(it._tempId, { ponderacion_global_pct: clampPct(e.target.value) })}
                        />
                      </div>

                      {/* CALIFICADO POR (si NO es rúbrica) */}
                      {!isRubrica ? (
                        <div className="field fieldFull">
                          <label>Calificado por:</label>
                          <div className="califBadge">
                            {labelCalificador((it.calificado_por ?? "ROL2") as CalificadoPor)}
                          </div>

                          <div className="califRow">
                            <select
                              value={(it.calificado_por ?? "ROL2") as CalificadoPor}
                              onChange={(e) => updateItemDraft(it._tempId, { calificado_por: e.target.value as CalificadoPor })}
                            >
                              <option value="ROL2">{labelCalificador("ROL2")}</option>
                              <option value="TRIBUNAL">{labelCalificador("TRIBUNAL")}</option>
                              <option value="CALIFICADORES_GENERALES">{labelCalificador("CALIFICADORES_GENERALES")}</option>
                            </select>
                          </div>
                        </div>
                      ) : null}

                      {/* RUBRICA: plantilla + distribución + asignación por componente */}
                      {isRubrica ? (
                        <div className="field fieldFull">
                          <label>Plantilla de Rúbrica</label>
                          <select
                            value={rubId ?? ""}
                            onChange={async (e) => {
                              const id = e.target.value ? Number(e.target.value) : null;
                              updateItemDraft(it._tempId, { id_rubrica: id });

                              if (id) (await ensureRubricaComponentes(id));
                            }}
                          >
                            <option value="">Seleccione una rúbrica...</option>
                            {rubricas.map((r) => (
                              <option key={r.id_rubrica} value={r.id_rubrica}>
                                {r.nombre_rubrica}
                              </option>
                            ))}
                          </select>

                          {/* Distribución */}
                          <div className="distBox">
                            <div className="distTitle">Distribución de la Ponderación Global ({itemGlobalPct.toFixed(0)}%):</div>

                            {rubId && comps.length ? (
                              <div className="distLines">
                                {comps.map((c) => {
                                  const part = (Number(c.ponderacion_pct) || 0);
                                  const total = (itemGlobalPct * part) / 100;
                                  return (
                                    <div className="distLine" key={c.id_rubrica_componente}>
                                      <span>
                                        {c.nombre_componente} (interna: {part.toFixed(0)}%):
                                      </span>
                                      <b>{total.toFixed(2)}%</b>
                                      <span className="muted">(del total)</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="muted">Seleccione una rúbrica para ver la distribución.</div>
                            )}
                          </div>

                          {/* Asignar calificadores a componentes */}
                          <div className="compBox">
                            <div className="compTitle">
                              <Users size={16} /> Asignar Calificadores a Componentes de la Rúbrica:
                            </div>

                            {!rubId ? (
                              <div className="muted">Seleccione una rúbrica.</div>
                            ) : comps.length === 0 ? (
                              <div className="muted">No se encontraron componentes para esta rúbrica.</div>
                            ) : (
                              <div className="compList">
                                {comps.map((c) => {
                                  const chosen = (map[c.id_rubrica_componente] ?? "TRIBUNAL") as CalificadoPor;

                                  return (
                                    <div className="compRow" key={c.id_rubrica_componente}>
                                      <div className="compLeft">
                                        <div className="compName">{c.nombre_componente}</div>
                                        <div className="compSub">{Number(c.ponderacion_pct).toFixed(2)}% de esta rúbrica</div>
                                      </div>

                                      <select
                                        value={chosen}
                                        onChange={(e) => {
                                          const v = e.target.value as CalificadoPor;

                                          // si aún no tiene id_plan_item, se guarda en UI y al guardar plan se persiste
                                          if (it.id_plan_item) {
                                            setCompCalificador(it.id_plan_item, c.id_rubrica_componente, v);
                                          } else {
                                            showToast("Guarda el plan primero para fijar calificador por componente.", "info");
                                          }
                                        }}
                                      >
                                        <option value="ROL2">{labelCalificador("ROL2")}</option>
                                        <option value="TRIBUNAL">{labelCalificador("TRIBUNAL")}</option>
                                        <option value="CALIFICADORES_GENERALES">{labelCalificador("CALIFICADORES_GENERALES")}</option>
                                      </select>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="muted small">
                            * En ítems de rúbrica el “calificado por” se define por componente.
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="footerBar">
        <button className="btnPrimary" onClick={onSaveAll} disabled={!selectedCP || loading}>
          <Save size={18} /> {loading ? "Guardando..." : "Guardar Plan de Evaluación"}
        </button>

        <button className="btnGhost" onClick={() => navigate(-1)} disabled={loading}>
          <XCircle size={18} /> Cancelar y Volver
        </button>
      </div>
    </div>
  );
}
