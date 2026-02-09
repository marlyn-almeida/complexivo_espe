// src/pages/misCalificaciones/CalificarTribunalPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCcw,
  Save,
  ClipboardCheck,
  BadgeCheck,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./CalificarTribunalPage.css";

import {
  misCalificacionesDocenteService,
  type ItemPlan,
  type SavePayload,
  type Nivel,
} from "../../services/misCalificacionesDocente.service";

type ToastType = "success" | "error" | "info";
type SelectedMap = Record<number, { id_nivel: number; observacion?: string }>;

export default function CalificarTribunalPage() {
  const nav = useNavigate();
  const { idTribunalEstudiante } = useParams();
  const id = Number(idTribunalEstudiante || 0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(
    null
  );

  const [header, setHeader] = useState<{
    estudiante: string;
    codigo?: string | null;
    carrera?: string | null;
    mi_rol?: string | null;
    plan_nombre?: string | null;
    cerrado?: 0 | 1;
  } | null>(null);

  const [items, setItems] = useState<ItemPlan[]>([]);
  const [selected, setSelected] = useState<SelectedMap>({});
  const [obsGeneral, setObsGeneral] = useState("");

  const cerrado = Number(header?.cerrado ?? 0) === 1;

  async function load() {
    if (!id) {
      setToast({ type: "error", msg: "ID inválido del tribunal." });
      return;
    }

    setLoading(true);
    setToast(null);
    try {
      const res = await misCalificacionesDocenteService.get(id);

      const te = res.data.tribunal_estudiante;
      setHeader({
        estudiante: te.estudiante,
        carrera: te.carrera ?? null,
        mi_rol: te.mi_rol ?? "Miembro",
        plan_nombre: res.data.plan?.nombre_plan ?? "",
        cerrado: te.cerrado ?? 0,
      });

      setItems(res.data.items || []);
      setObsGeneral(res.data.observacion_general || "");

      // precargar selecciones + observaciones por criterio si vienen
      const initial: SelectedMap = {};
      for (const item of res.data.items || []) {
        for (const comp of item.componentes || []) {
          for (const crit of comp.criterios || []) {
            if (crit.id_nivel_seleccionado) {
              initial[crit.id_criterio] = {
                id_nivel: crit.id_nivel_seleccionado,
                observacion: crit.observacion || "",
              };
            }
          }
        }
      }
      setSelected(initial);
    } catch (e: any) {
      setToast({
        type: "error",
        msg:
          e?.response?.data?.message ||
          "No se pudo cargar la estructura de calificación.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Tomamos headers de niveles desde el primer criterio disponible (misma rúbrica)
  const nivelHeaders: Nivel[] = useMemo(() => {
    for (const item of items) {
      for (const comp of item.componentes || []) {
        for (const crit of comp.criterios || []) {
          return crit.niveles || [];
        }
      }
    }
    return [];
  }, [items]);

  function onPick(idCriterio: number, idNivel: number) {
    setSelected((prev) => ({
      ...prev,
      [idCriterio]: { ...prev[idCriterio], id_nivel: idNivel },
    }));
  }

  function onObsCriterio(idCriterio: number, v: string) {
    setSelected((prev) => ({
      ...prev,
      [idCriterio]: { ...prev[idCriterio], observacion: v },
    }));
  }

  async function onSave() {
    if (cerrado) {
      setToast({
        type: "info",
        msg: "Este tribunal está cerrado. No se pueden guardar cambios.",
      });
      return;
    }

    const calificaciones = Object.entries(selected)
      .filter(([, v]) => !!v?.id_nivel)
      .map(([k, v]) => ({
        id_criterio: Number(k),
        id_nivel: v.id_nivel,
        observacion: v.observacion?.trim() ? v.observacion.trim() : null,
      }));

    const payload: SavePayload = {
      calificaciones,
      observacion_general: obsGeneral?.trim() ? obsGeneral.trim() : null,
    };

    setSaving(true);
    setToast(null);
    try {
      await misCalificacionesDocenteService.save(id, payload);
      setToast({ type: "success", msg: "Calificaciones guardadas correctamente." });
      await load();
    } catch (e: any) {
      setToast({
        type: "error",
        msg: e?.response?.data?.message || "No se pudo guardar.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="califPage wrap containerFull">
      {/* HERO verde tipo ESPE */}
      <div className="hero">
        <div className="heroLeft">
          <img className="heroLogo" src={escudoESPE} alt="ESPE" />
          <div className="heroText">
            <h1 className="heroTitle">CALIFICAR TRIBUNAL</h1>
            <p className="heroSubtitle">
              {header?.estudiante ? (
                <>
                  {header.estudiante}
                  {header.carrera ? ` — ${header.carrera}` : ""}
                </>
              ) : (
                "Cargando información..."
              )}
            </p>
          </div>
        </div>

        <div className="heroActions">
          <button
            className="heroBtn ghost"
            onClick={load}
            disabled={loading || saving}
            title="Actualizar"
          >
            <RefreshCcw className="heroBtnIcon" />
            Actualizar
          </button>

          <button
            className="heroBtn primary"
            onClick={onSave}
            disabled={loading || saving || cerrado}
            title="Guardar"
          >
            <Save className="heroBtnIcon" />
            {saving ? "Guardando..." : "Guardar Mis Calificaciones"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="toastClose" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      {/* Breadcrumb + Rol */}
      <div className="crumbRow">
        <div className="crumb">
          <button className="crumbLink" onClick={() => nav("/docente/calificaciones")}>
            Mis Evaluaciones
          </button>
          <span className="crumbSep">/</span>
          <span className="crumbHere">
            {header?.estudiante ? header.estudiante : "Calificar"}
          </span>
        </div>

        <div className="rolePill">
          <BadgeCheck size={16} />
          <span>
            Tu rol en este tribunal: <b>{header?.mi_rol || "Miembro"}</b>
          </span>
        </div>
      </div>

      {/* Box principal */}
      <div className="box">
        <div className="boxHead">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <ClipboardCheck />
            </span>
            <span>Formulario de Calificación</span>
          </div>

          <div className="boxRight">
            <div className={`statePill ${cerrado ? "off" : "on"}`}>
              {cerrado ? "CERRADO" : "ABIERTO"}
            </div>
            <div className="roleBadge">
              <span>Su Rol de Evaluación:</span>
              <b>{header?.mi_rol || "Miembro"}</b>
            </div>
          </div>
        </div>

        <div className="meta">
          <div><b>Estudiante:</b> {header?.estudiante || "—"}</div>
          <div><b>Plan:</b> {header?.plan_nombre || "—"}</div>
        </div>

        {/* Items/Componentes */}
        {loading ? (
          <div className="emptyBox">Cargando estructura...</div>
        ) : !items.length ? (
          <div className="emptyBox">
            No hay estructura para calificar (plan/rúbrica no disponibles o no asignados a tu rol).
          </div>
        ) : (
          items.map((item) => (
            <div className="rubricaCard" key={item.id_item_plan}>
              <div className="rubricaCardHead">
                <div className="rubricaCardTitle">
                  <span className="rubricaIndex">{item.nombre_item}</span>
                  {item.ponderacion != null && (
                    <span className="chipPercent">{Number(item.ponderacion).toFixed(2)}%</span>
                  )}
                </div>
                <div className="rubricaCardSub">
                  Usando plantilla: {item.rubrica_nombre || "—"}
                </div>
              </div>

              {item.componentes.map((comp) => (
                <div className="compBlock" key={comp.id_componente}>
                  <div className="compTitle">
                    <span className="compDot" />
                    <b>{comp.nombre_componente}</b>
                    {comp.ponderacion != null && (
                      <span className="compHint">
                        ({Number(comp.ponderacion).toFixed(2)}% de esta rúbrica)
                      </span>
                    )}
                  </div>

                  <div className="tableWrap">
                    <table className="tableRubrica">
                      <thead>
                        <tr>
                          <th className="thCriterio">Criterio</th>
                          {nivelHeaders.map((n) => (
                            <th key={n.id_nivel} className="thNivel">
                              {n.nombre_nivel}
                              <div className="muted">({Number(n.puntaje).toFixed(2)})</div>
                            </th>
                          ))}
                          <th className="thObs">Observación (Opcional)</th>
                        </tr>
                      </thead>

                      <tbody>
                        {comp.criterios.map((crit) => {
                          const picked = selected[crit.id_criterio]?.id_nivel ?? null;

                          return (
                            <tr key={crit.id_criterio}>
                              <td className="tdCriterio">
                                <div className="critMain">{crit.nombre_criterio}</div>
                                {crit.descripcion_criterio && (
                                  <div className="critSub">{crit.descripcion_criterio}</div>
                                )}
                              </td>

                              {nivelHeaders.map((n) => {
                                const checked = picked === n.id_nivel;
                                const nivelReal = (crit.niveles || []).find(
                                  (x) => x.id_nivel === n.id_nivel
                                );

                                return (
                                  <td key={n.id_nivel} className={`tdNivel ${checked ? "sel" : ""}`}>
                                    <label className="nivelOption">
                                      <input
                                        type="radio"
                                        name={`crit-${crit.id_criterio}`}
                                        checked={checked}
                                        disabled={cerrado}
                                        onChange={() => onPick(crit.id_criterio, n.id_nivel)}
                                      />
                                      <span className="nivelRadio" />
                                      <span className="nivelText">
                                        {nivelReal?.descripcion || "—"}
                                      </span>
                                    </label>
                                  </td>
                                );
                              })}

                              <td className="tdObs">
                                <textarea
                                  className="obsInput"
                                  placeholder="Observación específica..."
                                  value={selected[crit.id_criterio]?.observacion || ""}
                                  disabled={cerrado}
                                  onChange={(e) => onObsCriterio(crit.id_criterio, e.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}

        {/* Observación general */}
        <div className="obsGeneralWrap">
          <div className="obsGeneralLabel">Observación General para {header?.mi_rol || "ti"} (Opcional)</div>
          <textarea
            className="obsGeneral"
            placeholder="Observación general..."
            value={obsGeneral}
            disabled={cerrado}
            onChange={(e) => setObsGeneral(e.target.value)}
          />
        </div>

        {/* Footer botones como en tu foto */}
        <div className="footerBtns">
          <button className="btnPrimary" onClick={onSave} disabled={loading || saving || cerrado}>
            <Save size={18} />
            {saving ? "Guardando..." : "Guardar Mis Calificaciones"}
          </button>

          <button className="btnGhost" onClick={() => nav("/docente/calificaciones")}>
            <ArrowLeft size={18} />
            Volver a Mis Evaluaciones
          </button>
        </div>
      </div>
    </div>
  );
}
