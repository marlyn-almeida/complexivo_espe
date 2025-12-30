import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "./RubricasVerPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  tipo_rubrica: "ORAL" | "ESCRITA";
  ponderacion_global: string | number;
  nombre_rubrica: string;
  descripcion_rubrica?: string | null;
  estado: number;
};

export default function RubricasVerPage() {
  const { idPeriodo } = useParams();
  const periodoId = Number(idPeriodo);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rubricas, setRubricas] = useState<Rubrica[]>([]);

  useEffect(() => {
    if (!periodoId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/rubricas", {
        params: { periodoId, includeInactive: true },
      });
      setRubricas(res.data ?? []);
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar las rúbricas del período");
    } finally {
      setLoading(false);
    }
  };

  const oral = useMemo(
    () => rubricas.find((r) => r.tipo_rubrica === "ORAL") ?? null,
    [rubricas]
  );
  const escrita = useMemo(
    () => rubricas.find((r) => r.tipo_rubrica === "ESCRITA") ?? null,
    [rubricas]
  );

  const ensureAndGo = async (tipo: "ORAL" | "ESCRITA") => {
    if (!periodoId) return;

    setLoading(true);
    try {
      const res = await axiosClient.post("/rubricas/ensure", {
        id_periodo: periodoId,
        tipo_rubrica: tipo,
      });

      const idRubrica = res.data?.rubrica?.id_rubrica;
      if (!idRubrica) throw new Error("No vino id_rubrica");

      // ✅ refresca lista para que al volver ya se vea creada/activa
      await load();

      // ✅ ir al editor grande
      navigate(`/rubricas/diseno/${idRubrica}`);
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir/crear la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  const cardStatus = (r: Rubrica | null) => {
    if (!r) return { text: "No creada", cls: "off" };
    if (r.estado === 1) return { text: "Activa", cls: "ok" };
    return { text: "Inactiva", cls: "off" };
  };

  const btnText = (r: Rubrica | null) => (!r ? "Crear" : "Editar");

  return (
    <div className="rv-page">
      <div className="rv-panel">
        <div>
          <h1 className="rv-title">Rúbricas del Período #{periodoId}</h1>
          <p className="rv-subtitle">
            Deben existir dos rúbricas: ORAL y ESCRITA.
          </p>
        </div>

        <button className="rv-btn back" onClick={() => navigate("/rubricas")}>
          Volver
        </button>
      </div>

      <div className="rv-grid">
        {/* ORAL */}
        <div className="rv-card">
          <div className="rv-card-head">
            <h2>ORAL</h2>
            <span className={`badge ${cardStatus(oral).cls}`}>
              {cardStatus(oral).text}
            </span>
          </div>

          <div className="rv-body">
            <div className="rv-row">
              <span className="k">Nombre</span>
              <span className="v">{oral?.nombre_rubrica ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Ponderación global</span>
              <span className="v">{oral?.ponderacion_global ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Descripción</span>
              <span className="v">{oral?.descripcion_rubrica ?? "—"}</span>
            </div>

            <button
              className="rv-btn oral"
              onClick={() => ensureAndGo("ORAL")}
              disabled={loading}
            >
              {btnText(oral)} / Diseñar ORAL
            </button>
          </div>
        </div>

        {/* ESCRITA */}
        <div className="rv-card">
          <div className="rv-card-head">
            <h2>ESCRITA</h2>
            <span className={`badge ${cardStatus(escrita).cls}`}>
              {cardStatus(escrita).text}
            </span>
          </div>

          <div className="rv-body">
            <div className="rv-row">
              <span className="k">Nombre</span>
              <span className="v">{escrita?.nombre_rubrica ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Ponderación global</span>
              <span className="v">{escrita?.ponderacion_global ?? "—"}</span>
            </div>
            <div className="rv-row">
              <span className="k">Descripción</span>
              <span className="v">{escrita?.descripcion_rubrica ?? "—"}</span>
            </div>

            <button
              className="rv-btn escrita"
              onClick={() => ensureAndGo("ESCRITA")}
              disabled={loading}
            >
              {btnText(escrita)} / Diseñar ESCRITA
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="rv-muted">Cargando…</div>}
    </div>
  );
}
