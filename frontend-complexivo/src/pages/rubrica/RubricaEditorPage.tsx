import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricaEditorPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: string | number;
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
  tipo_componente: "ORAL" | "ESCRITA";
  ponderacion_porcentaje: number | string;
  orden_componente: number;
  estado: number;
};

export default function RubricaEditorPage() {
  const { idRubrica } = useParams();
  const navigate = useNavigate();
  const rid = Number(idRubrica);

  const [loading, setLoading] = useState(false);

  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  const [niveles, setNiveles] = useState<RubricaNivel[]>([]);
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);

  // form general
  const [nombre, setNombre] = useState("");
  const [desc, setDesc] = useState("");

  // crear nivel inline
  const [lvlNombre, setLvlNombre] = useState("");
  const [lvlValor, setLvlValor] = useState<number>(1);
  const [lvlOrden, setLvlOrden] = useState<number>(1);

  // crear componente inline
  const [compNombre, setCompNombre] = useState("");
  const [compTipo, setCompTipo] = useState<"ORAL" | "ESCRITA">("ORAL");
  const [compPond, setCompPond] = useState<number>(100);
  const [compOrden, setCompOrden] = useState<number>(1);

  const totalActivo = useMemo(() => {
    return componentes
      .filter((c) => c.estado === 1)
      .reduce((acc, c) => acc + Number(c.ponderacion_porcentaje || 0), 0);
  }, [componentes]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // ✅ 1) rubrica
      const r = await axiosClient.get(`/rubricas/${rid}`);
      setRubrica(r.data);
      setNombre(r.data?.nombre_rubrica ?? "");
      setDesc(r.data?.descripcion_rubrica ?? "");

      // ✅ 2) niveles (ruta nueva)
      const n = await axiosClient.get(`/rubricas/${rid}/niveles`, {
        params: { includeInactive: true },
      });
      setNiveles(n.data ?? []);

      // ✅ 3) componentes (ruta nueva)
      const c = await axiosClient.get(`/rubricas/${rid}/componentes`, {
        params: { includeInactive: true },
      });
      setComponentes(c.data ?? []);
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

  const saveRubrica = async () => {
    try {
      setLoading(true);
      await axiosClient.put(`/rubricas/${rid}`, {
        id_periodo: rubrica?.id_periodo,
        nombre_rubrica: nombre.trim(),
        descripcion_rubrica: desc.trim() || null,
        ponderacion_global: 100,
      });
      await loadAll();
      alert("Rúbrica guardada");
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const createNivel = async () => {
    try {
      setLoading(true);
      await axiosClient.post(`/rubricas/${rid}/niveles`, {
        nombre_nivel: lvlNombre.trim(),
        valor_nivel: Number(lvlValor),
        orden_nivel: Number(lvlOrden),
      });
      setLvlNombre("");
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el nivel");
    } finally {
      setLoading(false);
    }
  };

  const createComponente = async () => {
    try {
      setLoading(true);
      await axiosClient.post(`/rubricas/${rid}/componentes`, {
        nombre_componente: compNombre.trim(),
        tipo_componente: compTipo,
        ponderacion_porcentaje: Number(compPond),
        orden_componente: Number(compOrden),
      });
      setCompNombre("");
      await loadAll();
    } catch (e) {
      console.error(e);
      alert("No se pudo crear el componente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="re-page">
      <div className="re-top">
        <div>
          <div className="re-breadcrumb" onClick={() => navigate("/rubricas")}>
            Volver
          </div>
          <h1 className="re-title">Editar Rúbrica</h1>
          <div className="muted small">
            Período #{rubrica?.id_periodo ?? "—"} • Rúbrica #{rid}
          </div>
        </div>

        <div className="re-top-actions">
          <button className="btn primary" onClick={saveRubrica} disabled={loading}>
            Guardar Rúbrica
          </button>
        </div>
      </div>

      {/* Card general */}
      <div className="card">
        <div className="card-head">Información General de la Rúbrica</div>
        <div className="card-body">
          <label className="lbl">Nombre de la Rúbrica</label>
          <input className="inp" value={nombre} onChange={(e) => setNombre(e.target.value)} />

          <div style={{ height: 10 }} />

          <label className="lbl">Descripción</label>
          <textarea className="ta" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
      </div>

      {/* Niveles */}
      <div className="card">
        <div className="card-head between">
          <div>Niveles de Calificación (Columnas)</div>
          <span className="pill ok">{niveles.filter((x) => x.estado === 1).length} activos</span>
        </div>

        <div className="card-body">
          <div className="levels">
            {niveles.length === 0 && <div className="muted">No existen niveles (créelos aquí).</div>}

            {niveles.map((lv) => (
              <div className="level-row" key={lv.id_rubrica_nivel}>
                <div className="level-name">
                  {lv.orden_nivel}. {lv.nombre_nivel}
                </div>
                <div className="level-score">{lv.valor_nivel}</div>
              </div>
            ))}
          </div>

          <div className="re-section-title">Crear Nivel</div>
          <div className="grid4">
            <div>
              <label className="lbl">Nombre nivel (Ej: Muy Bueno)</label>
              <input className="inp" value={lvlNombre} onChange={(e) => setLvlNombre(e.target.value)} />
            </div>
            <div>
              <label className="lbl">Valor</label>
              <input
                className="inp"
                type="number"
                value={lvlValor}
                onChange={(e) => setLvlValor(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="lbl">Orden</label>
              <input
                className="inp"
                type="number"
                value={lvlOrden}
                onChange={(e) => setLvlOrden(Number(e.target.value))}
              />
            </div>
            <div className="end">
              <button className="btn tiny primary" onClick={createNivel} disabled={!lvlNombre.trim() || loading}>
                + Crear Nivel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Componentes */}
      <div className="card">
        <div className="card-head between">
          <div>Componentes de la Rúbrica</div>
          <span className={`pill ${totalActivo === 100 ? "ok" : ""}`}>
            Total activo: {totalActivo.toFixed(2)} %
          </span>
        </div>

        <div className="card-body">
          <div className="muted small">
            Recomendación: el total activo debería sumar 100%.
          </div>

          <div style={{ height: 12 }} />

          <div className="comp-row">
            <div>
              <label className="lbl">Nuevo componente</label>
              <input
                className="inp"
                placeholder="Ej: Presentación, Defensa, Contenido..."
                value={compNombre}
                onChange={(e) => setCompNombre(e.target.value)}
              />
            </div>

            <div>
              <label className="lbl">Tipo</label>
              <select className="inp" value={compTipo} onChange={(e) => setCompTipo(e.target.value as any)}>
                <option value="ORAL">ORAL</option>
                <option value="ESCRITA">ESCRITA</option>
              </select>
            </div>

            <div>
              <label className="lbl">Ponderación (%)</label>
              <input
                className="inp"
                type="number"
                value={compPond}
                onChange={(e) => setCompPond(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="lbl">Orden</label>
              <input
                className="inp"
                type="number"
                value={compOrden}
                onChange={(e) => setCompOrden(Number(e.target.value))}
              />
            </div>

            <div className="end">
              <button className="btn tiny primary" onClick={createComponente} disabled={!compNombre.trim() || loading}>
                + Crear Componente
              </button>
            </div>
          </div>

          <div className="grid-table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Componente</th>
                  <th>Tipo</th>
                  <th>Ponderación</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {componentes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="td-center">
                      Aún no hay componentes
                    </td>
                  </tr>
                )}
                {componentes.map((c) => (
                  <tr key={c.id_rubrica_componente}>
                    <td>{c.orden_componente}</td>
                    <td className="crit-cell">{c.nombre_componente}</td>
                    <td>{c.tipo_componente}</td>
                    <td>{Number(c.ponderacion_porcentaje).toFixed(2)}%</td>
                    <td>
                      <span className={`pill ${c.estado === 1 ? "ok" : ""}`}>
                        {c.estado === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && <div className="muted" style={{ marginTop: 10 }}>Cargando…</div>}
    </div>
  );
}
