import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricaCrearDisenarPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  tipo_rubrica: "ORAL" | "ESCRITA";
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

type ComponenteCatalogo = {
  id_componente: number;
  nombre_componente: string;
  descripcion_componente?: string | null;
  estado: number;
};

type RubricaComponente = {
  id_rubrica_componente: number;
  id_rubrica: number;
  id_componente: number;
  ponderacion_porcentaje: string | number;
  orden_componente: number;
  estado: number;

  // si tu backend hace join, pueden venir:
  nombre_componente?: string;
};

const n = (v: any) => (v === null || v === undefined ? "" : String(v));
const num = (v: any) => Number(String(v ?? "").replace(",", "."));

export default function RubricaCrearDisenarPage() {
  const { idRubrica } = useParams();
  const navigate = useNavigate();
  const rid = Number(idRubrica);

  const [loading, setLoading] = useState(false);
  const [rubrica, setRubrica] = useState<Rubrica | null>(null);
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);
  const [catalogo, setCatalogo] = useState<ComponenteCatalogo[]>([]);

  // form add
  const [idComponente, setIdComponente] = useState<number>(0);
  const [ponderacion, setPonderacion] = useState<string>("0");
  const [orden, setOrden] = useState<string>("1");

  const totalPonderacion = useMemo(() => {
    return componentes
      .filter((c) => c.estado === 1)
      .reduce((acc, c) => acc + num(c.ponderacion_porcentaje), 0);
  }, [componentes]);

  useEffect(() => {
    if (!rid) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rid]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        axiosClient.get(`/rubricas/${rid}`),
        axiosClient.get("/rubricas-componentes", { params: { rubricaId: rid, includeInactive: true } }),
        axiosClient.get("/componentes", { params: { includeInactive: true } }),
      ]);

      setRubrica(r1.data);
      setComponentes(r2.data ?? []);
      setCatalogo(r3.data ?? []);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const addComponente = async () => {
    if (!idComponente) return alert("Selecciona un componente");
    if (!ponderacion || isNaN(num(ponderacion))) return alert("Ponderación inválida");
    if (!orden || isNaN(Number(orden))) return alert("Orden inválido");

    try {
      await axiosClient.post("/rubricas-componentes", {
        id_rubrica: rid,
        id_componente: idComponente,
        ponderacion_porcentaje: num(ponderacion),
        orden_componente: Number(orden),
      });
      await reloadComponentes();
      setIdComponente(0);
      setPonderacion("0");
      setOrden("1");
    } catch (e) {
      console.error(e);
      alert("No se pudo agregar el componente (¿duplicado?)");
    }
  };

  const reloadComponentes = async () => {
    const r = await axiosClient.get("/rubricas-componentes", {
      params: { rubricaId: rid, includeInactive: true },
    });
    setComponentes(r.data ?? []);
  };

  const toggleEstado = async (row: RubricaComponente) => {
    try {
      await axiosClient.patch(`/rubricas-componentes/${row.id_rubrica_componente}/estado`, {
        estado: row.estado !== 1,
      });
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo cambiar estado");
    }
  };

  const saveRow = async (row: RubricaComponente) => {
    try {
      await axiosClient.put(`/rubricas-componentes/${row.id_rubrica_componente}`, {
        ponderacion_porcentaje: num(row.ponderacion_porcentaje),
        orden_componente: Number(row.orden_componente),
      });
      await reloadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar cambios");
    }
  };

  const setRowField = (id: number, field: keyof RubricaComponente, value: any) => {
    setComponentes((prev) =>
      prev.map((r) => (r.id_rubrica_componente === id ? { ...r, [field]: value } : r))
    );
  };

  const nombreComponente = (row: RubricaComponente) => {
    if (row.nombre_componente) return row.nombre_componente;
    const c = catalogo.find((x) => x.id_componente === row.id_componente);
    return c?.nombre_componente ?? `Componente #${row.id_componente}`;
  };

  return (
    <div className="rd-page">
      <div className="rd-panel">
        <div>
          <h1 className="rd-title">Diseño de Rúbrica</h1>
          <p className="rd-subtitle">
            {rubrica ? (
              <>
                <b>{rubrica.tipo_rubrica}</b> — {rubrica.nombre_rubrica} (Período #{rubrica.id_periodo})
              </>
            ) : (
              "Cargando..."
            )}
          </p>
        </div>

        <button className="rd-btn back" onClick={() => navigate("/rubricas")}>
          Volver
        </button>
      </div>

      <div className="rd-card">
        <div className="rd-card-head">
          <div className="rd-head-left">
            <h2>Componentes</h2>
            <span className={`pill ${totalPonderacion === 100 ? "ok" : ""}`}>
              Total activo: {totalPonderacion.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* FORM AGREGAR */}
        <div className="rd-form">
          <div className="field">
            <label>Componente</label>
            <select value={idComponente} onChange={(e) => setIdComponente(Number(e.target.value))}>
              <option value={0}>— Selecciona —</option>
              {catalogo
                .filter((c) => c.estado === 1)
                .map((c) => (
                  <option key={c.id_componente} value={c.id_componente}>
                    {c.nombre_componente}
                  </option>
                ))}
            </select>
          </div>

          <div className="field">
            <label>Ponderación (%)</label>
            <input value={ponderacion} onChange={(e) => setPonderacion(e.target.value)} />
          </div>

          <div className="field">
            <label>Orden</label>
            <input value={orden} onChange={(e) => setOrden(e.target.value)} />
          </div>

          <button className="rd-btn primary" onClick={addComponente} disabled={loading}>
            Agregar
          </button>
        </div>

        {/* TABLA */}
        <div className="rd-table-scroll">
          <table className="rd-table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Componente</th>
                <th>Ponderación</th>
                <th>Estado</th>
                <th className="actions-col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="td-center">Cargando…</td>
                </tr>
              ) : componentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td-center">Aún no hay componentes</td>
                </tr>
              ) : (
                componentes.map((row) => (
                  <tr key={row.id_rubrica_componente}>
                    <td>
                      <input
                        className="mini"
                        value={n(row.orden_componente)}
                        onChange={(e) => setRowField(row.id_rubrica_componente, "orden_componente", e.target.value)}
                      />
                    </td>
                    <td className="td-strong">{nombreComponente(row)}</td>
                    <td>
                      <input
                        className="mini"
                        value={n(row.ponderacion_porcentaje)}
                        onChange={(e) => setRowField(row.id_rubrica_componente, "ponderacion_porcentaje", e.target.value)}
                      />
                    </td>
                    <td>
                      {row.estado === 1 ? (
                        <span className="badge ok">Activo</span>
                      ) : (
                        <span className="badge off">Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="rd-btn tiny" onClick={() => saveRow(row)}>
                          Guardar
                        </button>
                        <button
                          className={`rd-btn tiny ${row.estado === 1 ? "danger" : "ghost"}`}
                          onClick={() => toggleEstado(row)}
                        >
                          {row.estado === 1 ? "Desactivar" : "Activar"}
                        </button>

                        {/* siguiente: criterios/niveles por componente */}
                        <button
                          className="rd-btn tiny ghost"
                          onClick={() => navigate(`/rubricas/componentes/${row.id_rubrica_componente}`)}
                        >
                          Criterios
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rd-footer">
          <div className="hint">
            Recomendación: el total activo debería sumar 100%.
          </div>
        </div>
      </div>
    </div>
  );
}
