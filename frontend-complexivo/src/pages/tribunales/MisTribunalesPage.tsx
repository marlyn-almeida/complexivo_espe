// src/pages/docentes/MisTribunalesPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Pencil, RefreshCcw } from "lucide-react";

import {
  tribunalesDocenteService,
  type MiTribunalItem,
} from "../../services/tribunalesDocente.service";

import escudoESPE from "../../assets/escudo.png";
import "./MisTribunalesPage.css";

type ToastType = "success" | "error" | "info";

export default function MisTribunalesPage() {
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MiTribunalItem[]>([]);
  const [q, setQ] = useState("");

  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(
    null
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => {
      const base = `${r.estudiante} ${r.carrera ?? ""} ${r.fecha ?? ""}`.toLowerCase();
      return base.includes(s);
    });
  }, [rows, q]);

  async function load() {
    setLoading(true);
    setToast(null);
    try {
      const res = await tribunalesDocenteService.misTribunales();
      setRows(res.data || []);
    } catch (e: any) {
      setToast({
        type: "error",
        msg: e?.response?.data?.message || "No se pudo cargar tus tribunales.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="misTribunalesPage">
      <header className="misTribunalesHeader">
        <div className="left">
          <img className="logo" src={escudoESPE} alt="ESPE" />
          <div>
            <h1>Mis Evaluaciones de Tribunales</h1>
            <p>Agenda del docente para calificar criterios asignados según el Plan de Evaluación.</p>
          </div>
        </div>

        <div className="right">
          <button
            className="btn btnGhost"
            onClick={load}
            disabled={loading}
            title="Recargar"
          >
            <RefreshCcw size={18} />
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </header>

      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.msg}</span>
          <button className="toastClose" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="searchBox">
          <ClipboardList size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por estudiante / carrera / fecha..."
          />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Carrera</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Estado</th>
              <th style={{ width: 170 }}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 18 }}>
                  {loading ? "Cargando..." : "No tienes tribunales asignados."}
                </td>
              </tr>
            ) : (
              filtered.map((r) => {
                const hora = `${r.hora_inicio ?? "--:--"} - ${r.hora_fin ?? "--:--"}`;
                const cerrado = Number(r.cerrado ?? 0) === 1;

                return (
                  <tr key={r.id_tribunal_estudiante}>
                    <td>{r.estudiante}</td>
                    <td>{r.carrera ?? "—"}</td>
                    <td>{r.fecha ?? "—"}</td>
                    <td>{hora}</td>
                    <td>
                      <span className={`badge ${cerrado ? "badgeOff" : "badgeOn"}`}>
                        {cerrado ? "CERRADO" : "ABIERTO"}
                      </span>
                    </td>

                    <td>
                      <button
                        className="btn btnPrimary"
                        onClick={() =>
                          nav(`/docente/calificaciones/${r.id_tribunal_estudiante}`)
                        }
                        disabled={cerrado}
                        title={
                          cerrado
                            ? "Este tribunal está cerrado (no se puede calificar)"
                            : "Abrir pantalla de calificación"
                        }
                      >
                        <Pencil size={18} />
                        Calificar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Si quieres un pie informativo como el screenshot */}
        <div style={{ padding: "10px 14px", color: "#5b6b63", fontSize: 13 }}>
          Nota: aquí verás tus tribunales asignados. Al entrar, solo podrás calificar
          los criterios que te corresponden según el Plan de Evaluación.
        </div>
      </div>
    </div>
  );
}
