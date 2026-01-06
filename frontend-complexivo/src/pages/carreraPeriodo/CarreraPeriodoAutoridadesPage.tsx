import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { carreraPeriodoService } from "../../services/carreraPeriodo.service";
import { docentesService } from "../../services/docentes.service";

import type { Docente } from "../../types/docente";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";
import type { CarreraPeriodoAdminsResponse } from "../../types/carreraPeriodoAdmin";

import { ArrowLeft, Save, UserCog, Search } from "lucide-react";
import "./CarreraPeriodoAutoridadesPage.css";

type ToastType = "success" | "error" | "info";

function docenteLabel(d: Docente) {
  const full = `${d.apellidos_docente} ${d.nombres_docente}`.trim();
  const user = d.nombre_usuario ? ` (${d.nombre_usuario})` : "";
  return full + user;
}

function adminLabel(a: any) {
  if (!a) return "— Sin asignar —";
  const full = `${a.apellidos_docente} ${a.nombres_docente}`.trim();
  const user = a.nombre_usuario ? ` (${a.nombre_usuario})` : "";
  return full + user;
}

export default function CarreraPeriodoAutoridadesPage() {
  const { id } = useParams();
  const idCarreraPeriodo = Number(id);
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [cp, setCp] = useState<CarreraPeriodo | null>(null);
  const [admins, setAdmins] = useState<CarreraPeriodoAdminsResponse | null>(null);

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [qDirector, setQDirector] = useState("");
  const [qApoyo, setQApoyo] = useState("");

  const [directorId, setDirectorId] = useState<number | null>(null);
  const [apoyoId, setApoyoId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);

  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    if (!Number.isFinite(idCarreraPeriodo) || idCarreraPeriodo <= 0) {
      showToast("ID de carrera-período inválido", "error");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCarreraPeriodo]);

  async function load() {
    try {
      setLoading(true);

      const [cpList, adm, docList] = await Promise.all([
        carreraPeriodoService.listAll({ includeInactive: true, page: 1, limit: 500 }),
        carreraPeriodoService.getAdmins(idCarreraPeriodo),
        docentesService.list(true),
      ]);

      const found = (cpList || []).find((x) => x.id_carrera_periodo === idCarreraPeriodo) || null;
      setCp(found);

      const activos = (docList || []).filter((d) => d.estado === 1);
      activos.sort((a, b) =>
        `${a.apellidos_docente} ${a.nombres_docente}`.localeCompare(
          `${b.apellidos_docente} ${b.nombres_docente}`,
          "es",
          { sensitivity: "base" }
        )
      );
      setDocentes(activos);

      setAdmins(adm);
      setDirectorId(adm.director ? adm.director.id_docente : null);
      setApoyoId(adm.apoyo ? adm.apoyo.id_docente : null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo cargar la pantalla de asignación.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  const docentesDirector = useMemo(() => {
    const q = qDirector.trim().toLowerCase();
    if (!q) return docentes;
    return docentes.filter((d) =>
      `${d.apellidos_docente} ${d.nombres_docente} ${d.nombre_usuario}`.toLowerCase().includes(q)
    );
  }, [docentes, qDirector]);

  const docentesApoyo = useMemo(() => {
    const q = qApoyo.trim().toLowerCase();
    if (!q) return docentes;
    return docentes.filter((d) =>
      `${d.apellidos_docente} ${d.nombres_docente} ${d.nombre_usuario}`.toLowerCase().includes(q)
    );
  }, [docentes, qApoyo]);

  async function onSave() {
    if (directorId && apoyoId && directorId === apoyoId) {
      showToast("Director y apoyo no pueden ser el mismo docente.", "error");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id_docente_director: directorId,
        id_docente_apoyo: apoyoId,
      };

      const updated = await carreraPeriodoService.setAdmins(idCarreraPeriodo, payload);

      setAdmins(updated);
      setDirectorId(updated.director ? updated.director.id_docente : null);
      setApoyoId(updated.apoyo ? updated.apoyo.id_docente : null);

      showToast("Autoridades guardadas correctamente.", "success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "No se pudo guardar la asignación.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="adminPage">
        <div className="adminCard">Cargando...</div>
      </div>
    );
  }

  const titulo = cp?.nombre_carrera || `Carrera-Periodo #${idCarreraPeriodo}`;
  const sub =
    cp
      ? `${cp.codigo_periodo || ""} • ${cp.codigo_carrera || ""} • ${cp.modalidad || ""} • ${cp.sede || ""}`.replace(
          /\s•\s•\s/g,
          " • "
        )
      : "";

  return (
    <div className="adminPage">
      <div className="adminCard">
        <div className="adminHeader">
          <button className="btnGhost" onClick={() => nav(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>

          <div className="adminTitle">
            <UserCog size={18} />
            <div>
              <div className="h1">Asignar autoridades</div>
              <div className="h2">{titulo}</div>
              {sub ? <div className="h3">{sub}</div> : null}
            </div>
          </div>

          <button className="btnPrimary" onClick={onSave} disabled={saving}>
            <Save size={16} /> {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        <div className="adminInfo">
          <div className="infoItem">
            <span className="k">Director actual</span>
            <span className="v">{admins ? adminLabel(admins.director) : "—"}</span>
          </div>
          <div className="infoItem">
            <span className="k">Apoyo actual</span>
            <span className="v">{admins ? adminLabel(admins.apoyo) : "—"}</span>
          </div>
        </div>

        <div className="grid2">
          {/* DIRECTOR */}
          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">Director</div>
              <div className="searchBox">
                <Search size={16} />
                <input
                  value={qDirector}
                  onChange={(e) => setQDirector(e.target.value)}
                  placeholder="Buscar docente..."
                />
              </div>
            </div>

            <div className="selectedRow">
              <span className="k">Seleccionado:</span>
              <span className="v">
                {directorId
                  ? docenteLabel(docentes.find((d) => d.id_docente === directorId)!)
                  : "— Sin asignar —"}
              </span>
              <button className="btnSmall" onClick={() => setDirectorId(null)}>
                Quitar
              </button>
            </div>

            <div className="list">
              {docentesDirector.map((d) => (
                <button
                  key={d.id_docente}
                  className={`listItem ${directorId === d.id_docente ? "active" : ""}`}
                  onClick={() => setDirectorId(d.id_docente)}
                >
                  <div className="liMain">{docenteLabel(d)}</div>
                  <div className="liSub">CI: {d.cedula} · Inst: {d.id_institucional_docente}</div>
                </button>
              ))}
            </div>
          </div>

          {/* APOYO */}
          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">Docente de apoyo</div>
              <div className="searchBox">
                <Search size={16} />
                <input
                  value={qApoyo}
                  onChange={(e) => setQApoyo(e.target.value)}
                  placeholder="Buscar docente..."
                />
              </div>
            </div>

            <div className="selectedRow">
              <span className="k">Seleccionado:</span>
              <span className="v">
                {apoyoId
                  ? docenteLabel(docentes.find((d) => d.id_docente === apoyoId)!)
                  : "— Sin asignar —"}
              </span>
              <button className="btnSmall" onClick={() => setApoyoId(null)}>
                Quitar
              </button>
            </div>

            <div className="list">
              {docentesApoyo.map((d) => (
                <button
                  key={d.id_docente}
                  className={`listItem ${apoyoId === d.id_docente ? "active" : ""}`}
                  onClick={() => setApoyoId(d.id_docente)}
                >
                  <div className="liMain">{docenteLabel(d)}</div>
                  <div className="liSub">CI: {d.cedula} · Inst: {d.id_institucional_docente}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
