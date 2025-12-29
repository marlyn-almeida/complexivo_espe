import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { rubricaService } from "../../services/rubrica.service";
import { rubricaComponenteService } from "../../services/rubricaComponente.service";
import { rubricaCriterioNivelService } from "../../services/rubricaCriterioNivel.service";

import { componenteService, type Componente } from "../../services/componente.service";
import { nivelService } from "../../services/nivel.service";
import { criterioService } from "../../services/criterio.service";

import type { Nivel } from "../../types/nivel";
import type { Criterio } from "../../types/criterio";
import type { TipoRubrica } from "../../types/rubrica";

type CriterioRow = {
  key: string;
  id_criterio?: number;            // si se elige uno existente
  nombreNuevo?: string;            // si se crea uno nuevo
  orden_criterio: number;
  // descripcion por nivel id_nivel
  descPorNivel: Record<number, string>;
};

type ComponenteBlock = {
  key: string;
  id_componente: number | "";
  ponderacion_porcentaje: number;
  orden_componente: number;
  criterios: CriterioRow[];
};

const genKey = () => Math.random().toString(36).slice(2);

export default function RubricaCrearDisenarPage() {
  const nav = useNavigate();

  // 1) Datos generales
  const [idCarreraPeriodo, setIdCarreraPeriodo] = useState<number | "">("");
  const [tipoRubrica, setTipoRubrica] = useState<TipoRubrica>("ESCRITA");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState<string>("");

  // 2) Catálogos
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [niveles, setNiveles] = useState<Nivel[]>([]);
  const [criteriosCatalogo, setCriteriosCatalogo] = useState<Criterio[]>([]);

  // 3) Diseño
  const [blocks, setBlocks] = useState<ComponenteBlock[]>([
    {
      key: genKey(),
      id_componente: "",
      ponderacion_porcentaje: 0,
      orden_componente: 1,
      criterios: [],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar catálogos (componentes, niveles, criterios)
  useEffect(() => {
    (async () => {
      try {
        const [comp, niv, crit] = await Promise.all([
          componenteService.list({ includeInactive: false }),
          nivelService.list({ includeInactive: false }),
          criterioService.list({ includeInactive: false }),
        ]);

        // ordena niveles por orden_nivel o valor_nivel
        const nivOrden = [...niv].sort((a, b) => (a.orden_nivel ?? 0) - (b.orden_nivel ?? 0));
        setComponentes(comp);
        setNiveles(nivOrden);
        setCriteriosCatalogo(crit);
      } catch (e: any) {
        setError(e?.userMessage || "No se pudieron cargar catálogos (componentes/niveles/criterios).");
      }
    })();
  }, []);

  // defaults por tipo
  useEffect(() => {
    if (!nombre.trim()) {
      setNombre(tipoRubrica === "ESCRITA" ? "Rúbrica Trabajo Escrito" : "Rúbrica Sustentación Oral");
    }
    if (!descripcion.trim()) {
      setDescripcion(
        tipoRubrica === "ESCRITA"
          ? "Rúbrica para evaluar la parte escrita del examen complexivo"
          : "Rúbrica para evaluar la sustentación oral del examen complexivo"
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoRubrica]);

  const totalPonderacion = useMemo(() => {
    return blocks.reduce((acc, b) => acc + Number(b.ponderacion_porcentaje || 0), 0);
  }, [blocks]);

  const addComponente = () => {
    setBlocks((prev) => [
      ...prev,
      {
        key: genKey(),
        id_componente: "",
        ponderacion_porcentaje: 0,
        orden_componente: prev.length + 1,
        criterios: [],
      },
    ]);
  };

  const removeComponente = (key: string) => {
    setBlocks((prev) => prev.filter((b) => b.key !== key));
  };

  const addCriterioTo = (compKey: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.key !== compKey) return b;
        const nextOrden = (b.criterios?.length || 0) + 1;
        const descPorNivel: Record<number, string> = {};
        niveles.forEach((n) => (descPorNivel[n.id_nivel] = ""));
        return {
          ...b,
          criterios: [
            ...(b.criterios || []),
            { key: genKey(), orden_criterio: nextOrden, descPorNivel },
          ],
        };
      })
    );
  };

  const removeCriterio = (compKey: string, critKey: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.key !== compKey) return b;
        return { ...b, criterios: b.criterios.filter((c) => c.key !== critKey) };
      })
    );
  };

  const updateBlock = (key: string, patch: Partial<ComponenteBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  };

  const updateCriterio = (compKey: string, critKey: string, patch: Partial<CriterioRow>) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.key !== compKey) return b;
        return {
          ...b,
          criterios: b.criterios.map((c) => (c.key === critKey ? { ...c, ...patch } : c)),
        };
      })
    );
  };

  const setDesc = (compKey: string, critKey: string, idNivel: number, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.key !== compKey) return b;
        return {
          ...b,
          criterios: b.criterios.map((c) => {
            if (c.key !== critKey) return c;
            return { ...c, descPorNivel: { ...c.descPorNivel, [idNivel]: value } };
          }),
        };
      })
    );
  };

  // Validación mínima para no mandar basura
  const validate = (): string | null => {
    if (idCarreraPeriodo === "") return "Selecciona el carrera–período.";
    if (!nombre.trim()) return "El nombre de la rúbrica es obligatorio.";
    if (blocks.length === 0) return "Agrega al menos un componente.";

    for (const b of blocks) {
      if (b.id_componente === "") return "Todos los componentes deben estar seleccionados.";
      if (b.ponderacion_porcentaje < 0 || b.ponderacion_porcentaje > 100) return "Ponderación inválida (0–100).";
      if (b.orden_componente < 1) return "Orden de componente inválido.";

      // cada criterio debe tener o id_criterio o nombreNuevo
      for (const c of b.criterios) {
        const ok = !!c.id_criterio || !!c.nombreNuevo?.trim();
        if (!ok) return "Cada criterio debe seleccionarse o escribirse (nuevo).";
        // al menos una descripción escrita (recomendado)
        const anyDesc = niveles.some((n) => (c.descPorNivel?.[n.id_nivel] || "").trim().length > 0);
        if (!anyDesc) return "Cada criterio debe tener al menos una descripción por nivel.";
      }
    }

    // si quieres, fuerza 100% exacto:
    // if (Math.abs(totalPonderacion - 100) > 0.001) return "La suma de ponderación debe ser 100%.";
    return null;
  };

  const guardarTodo = async () => {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1) Crear rúbrica
      const rubrica = await rubricaService.create({
        id_carrera_periodo: Number(idCarreraPeriodo),
        tipo_rubrica: tipoRubrica,
        ponderacion_global: 50,
        nombre_rubrica: nombre.trim(),
        descripcion_rubrica: descripcion.trim() || null,
      });

      // 2) Crear rubrica_componente por cada bloque
      // Guardamos un mapa id_componente => id_rubrica (lo necesitas solo para trazabilidad; rcn cuelga del componente)
      for (const b of blocks) {
        await rubricaComponenteService.create({
          id_rubrica: rubrica.id_rubrica,
          id_componente: Number(b.id_componente),
          ponderacion_porcentaje: Number(Number(b.ponderacion_porcentaje).toFixed(2)),
          orden_componente: Number(b.orden_componente),
        });

        // 3) Por cada criterio del componente, asegurar criterioId
        for (const c of b.criterios) {
          let criterioId = c.id_criterio;

          if (!criterioId) {
            const creado = await criterioService.create({
              nombre_criterio: String(c.nombreNuevo || "").trim(),
              orden_criterio: Number(c.orden_criterio || 1),
            });
            criterioId = creado.id_criterio;
            // actualiza catálogo local (opcional)
            setCriteriosCatalogo((prev) => [...prev, creado]);
          }

          // 4) Crear rubrica_criterio_nivel por cada nivel con descripción (solo si hay texto)
          for (const n of niveles) {
            const desc = (c.descPorNivel?.[n.id_nivel] || "").trim();
            if (!desc) continue;

            await rubricaCriterioNivelService.create({
              id_componente: Number(b.id_componente),
              id_criterio: Number(criterioId),
              id_nivel: n.id_nivel,
              descripcion: desc,
            });
          }
        }
      }

      // listo → te mando al diseñador de componentes (o a la lista)
      nav(`/rubricas/${rubrica.id_rubrica}/diseno/componentes`);
    } catch (e: any) {
      setError(e?.userMessage || "Error guardando la rúbrica.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cp3-container">
      <div className="cp3-topbar">
        <div>
          <h2>Rúbricas / Crear nueva rúbrica</h2>
          <p>Creación y diseño en un solo flujo (sin dejar rúbricas vacías).</p>
        </div>
      </div>

      {error && <div className="cp3-alert cp3-alert-warn">⚠️ {error}</div>}

      {/* Información general */}
      <div className="cp3-card">
        <h3>Información general</h3>

        <div className="cp3-form-row">
          <div className="cp3-field">
            <label>ID Carrera–Período</label>
            <input
              type="number"
              min={1}
              value={idCarreraPeriodo}
              onChange={(e) => setIdCarreraPeriodo(e.target.value ? Number(e.target.value) : "")}
              placeholder="Ej: 1"
            />
            <small>Por ahora es input numérico (luego lo conectamos a selector bonito).</small>
          </div>

          <div className="cp3-field">
            <label>Tipo</label>
            <select value={tipoRubrica} onChange={(e) => setTipoRubrica(e.target.value as TipoRubrica)}>
              <option value="ESCRITA">ESCRITA</option>
              <option value="ORAL">ORAL</option>
            </select>
          </div>
        </div>

        <div className="cp3-form-row">
          <div className="cp3-field">
            <label>Nombre</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>

          <div className="cp3-field">
            <label>Ponderación global</label>
            <input value={"50"} disabled />
          </div>
        </div>

        <div className="cp3-field">
          <label>Descripción</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3} />
        </div>
      </div>

      {/* Niveles (columnas) */}
      <div className="cp3-card">
        <h3>Niveles de calificación (columnas)</h3>
        <p>Estos niveles vienen de tu tabla <code>nivel</code>. Aquí solo se muestran.</p>

        <div className="cp3-table-wrap">
          <table className="cp3-table">
            <thead>
              <tr>
                <th>Nivel</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {niveles.map((n) => (
                <tr key={n.id_nivel}>
                  <td>{n.nombre_nivel}</td>
                  <td>{n.valor_nivel}</td>
                </tr>
              ))}
              {niveles.length === 0 && (
                <tr>
                  <td colSpan={2}>No hay niveles cargados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Componentes y criterios */}
      <div className="cp3-card">
        <div className="cp3-card-header">
          <h3>Componentes y criterios</h3>
          <span className="cp3-badge">Total ponderación: {totalPonderacion.toFixed(2)}%</span>
        </div>

        {blocks.map((b, idx) => (
          <div key={b.key} className="cp3-subcard">
            <div className="cp3-subcard-header">
              <strong>Componente {idx + 1}</strong>
              <div className="cp3-actions">
                {blocks.length > 1 && (
                  <button className="btn-secondary" onClick={() => removeComponente(b.key)}>Eliminar</button>
                )}
              </div>
            </div>

            <div className="cp3-form-row">
              <div className="cp3-field">
                <label>Componente</label>
                <select
                  value={b.id_componente}
                  onChange={(e) => updateBlock(b.key, { id_componente: e.target.value ? Number(e.target.value) : "" })}
                >
                  <option value="">-- Selecciona --</option>
                  {componentes.map((c) => (
                    <option key={c.id_componente} value={c.id_componente}>
                      {c.nombre_componente}
                    </option>
                  ))}
                </select>
              </div>

              <div className="cp3-field">
                <label>Ponderación (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  value={b.ponderacion_porcentaje}
                  onChange={(e) => updateBlock(b.key, { ponderacion_porcentaje: Number(e.target.value) })}
                />
              </div>

              <div className="cp3-field">
                <label>Orden</label>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={b.orden_componente}
                  onChange={(e) => updateBlock(b.key, { orden_componente: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Tabla de criterios con columnas por nivel */}
            <div className="cp3-table-wrap">
              <table className="cp3-table">
                <thead>
                  <tr>
                    <th style={{ width: 260 }}>Criterio</th>
                    {niveles.map((n) => (
                      <th key={n.id_nivel}>{n.nombre_nivel} ({n.valor_nivel})</th>
                    ))}
                    <th style={{ width: 120 }}>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {b.criterios.map((c) => (
                    <tr key={c.key}>
                      <td>
                        {/* 1) elegir existente */}
                        <select
                          value={c.id_criterio ?? ""}
                          onChange={(e) => {
                            const v = e.target.value ? Number(e.target.value) : undefined;
                            updateCriterio(b.key, c.key, { id_criterio: v, nombreNuevo: "" });
                          }}
                        >
                          <option value="">-- Seleccionar criterio existente --</option>
                          {criteriosCatalogo.map((cr) => (
                            <option key={cr.id_criterio} value={cr.id_criterio}>
                              {cr.nombre_criterio}
                            </option>
                          ))}
                        </select>

                        <div style={{ marginTop: 8 }}>
                          <input
                            placeholder="O escribir criterio nuevo..."
                            value={c.nombreNuevo ?? ""}
                            onChange={(e) => updateCriterio(b.key, c.key, { nombreNuevo: e.target.value, id_criterio: undefined })}
                          />
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <small>Orden criterio:</small>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={c.orden_criterio}
                            onChange={(e) => updateCriterio(b.key, c.key, { orden_criterio: Number(e.target.value) })}
                          />
                        </div>
                      </td>

                      {niveles.map((n) => (
                        <td key={n.id_nivel}>
                          <textarea
                            rows={3}
                            value={c.descPorNivel?.[n.id_nivel] ?? ""}
                            onChange={(e) => setDesc(b.key, c.key, n.id_nivel, e.target.value)}
                            placeholder="Descripción..."
                          />
                        </td>
                      ))}

                      <td>
                        <button className="btn-secondary" onClick={() => removeCriterio(b.key, c.key)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {b.criterios.length === 0 && (
                    <tr>
                      <td colSpan={niveles.length + 2}>No hay criterios agregados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="cp3-actions" style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={() => addCriterioTo(b.key)}>
                + Añadir criterio a este componente
              </button>
            </div>
          </div>
        ))}

        <div className="cp3-actions" style={{ marginTop: 14 }}>
          <button className="btn-primary" onClick={addComponente}>
            + Añadir nuevo componente a la rúbrica
          </button>
        </div>
      </div>

      {/* Guardar */}
      <div className="cp3-actions">
        <button className="btn-primary" onClick={guardarTodo} disabled={saving}>
          {saving ? "Guardando..." : "Guardar rúbrica"}
        </button>
        <button className="btn-secondary" onClick={() => nav(-1)} disabled={saving}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
