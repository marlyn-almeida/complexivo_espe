// src/pages/rubricas/RubricaEditorPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

import { ArrowLeft, List, Trash2, Plus, Save, XCircle } from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./RubricaEditorPage.css";

type Rubrica = {
  id_rubrica: number;
  id_periodo: number;
  ponderacion_global: number;
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
  tipo_componente: "ESCRITA" | "ORAL" | "OTRO";
  ponderacion: number;
  orden: number;
  estado: number;
};

type RubricaCriterio = {
  id_rubrica_criterio: number;
  id_rubrica_componente: number;
  nombre_criterio: string;
  orden: number;
  estado: number;
};

type RubricaCriterioNivel = {
  id_rubrica_criterio_nivel: number;
  id_rubrica_criterio: number;
  id_rubrica_nivel: number;
  descripcion: string;
  estado: number;
  nombre_nivel?: string;
  valor_nivel?: number;
  orden_nivel?: number;
};

/** ✅ FIX: soporta "40,00" => 40.00 */
function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

export default function RubricaEditorPage() {
  const { idRubrica } = useParams();
  const rid = Number(idRubrica);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [rubrica, setRubrica] = useState<Rubrica | null>(null);

  // Info general
  const [nombreRubrica, setNombreRubrica] = useState("");
  const [descRubrica, setDescRubrica] = useState<string>("");

  // Niveles
  const [niveles, setNiveles] = useState<RubricaNivel[]>([]);

  // Componentes
  const [componentes, setComponentes] = useState<RubricaComponente[]>([]);

  // Criterios por componente
  const [criteriosByComp, setCriteriosByComp] = useState<Record<number, RubricaCriterio[]>>({});

  // Celdas por criterio: { criterioId: { nivelId: celda } }
  const [celdasByCriterio, setCeldasByCriterio] = useState<
    Record<number, Record<number, RubricaCriterioNivel>>
  >({});

  // Drafts: `${criterioId}-${nivelId}`
  const [draftCell, setDraftCell] = useState<Record<string, string>>({});

  // Debounce timers
  const saveTimers = useRef<Record<string, any>>({});

  // ✅ VOLVER SIEMPRE AL VIEW DEL PERIODO (RubricasVerPage)
  function goBack() {
    const pid = rubrica?.id_periodo;
    if (pid) navigate(`/rubricas/periodo/${pid}`);
    else navigate("/rubricas");
  }

  const nivelesActivos = useMemo(
    () =>
      niveles
        .filter((n) => n.estado === 1)
        .slice()
        .sort((a, b) => a.orden_nivel - b.orden_nivel),
    [niveles]
  );

  const componentesActivos = useMemo(
    () =>
      componentes
        .filter((c) => c.estado === 1)
        .slice()
        .sort((a, b) => a.orden - b.orden),
    [componentes]
  );

  const totalPonderacionActiva = useMemo(() => {
    return componentesActivos.reduce((acc, c) => acc + toNum(c.ponderacion, 0), 0);
  }, [componentesActivos]);

  // ---------------------------
  // LOADERS
  // ---------------------------
  const loadRubrica = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}`);
    const r = res.data as Rubrica;
    setRubrica(r);
    setNombreRubrica(r?.nombre_rubrica ?? "");
    setDescRubrica(r?.descripcion_rubrica ?? "");
  };

  /** ✅ Normaliza TODO a number al guardar en estado */
  const loadNiveles = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}/niveles`, {
      params: { includeInactive: true },
    });

    const raw = (res.data ?? []) as any[];
    const norm: RubricaNivel[] = raw.map((n) => ({
      id_rubrica_nivel: toNum(n.id_rubrica_nivel, 0),
      id_rubrica: toNum(n.id_rubrica, rid),
      nombre_nivel: String(n.nombre_nivel ?? ""),
      valor_nivel: toNum(n.valor_nivel, 0),
      orden_nivel: toNum(n.orden_nivel ?? n.orden, 0),
      estado: toNum(n.estado, 1),
    }));

    setNiveles(norm);
  };

  /** ✅ Normaliza TODO a number al guardar en estado */
  const loadComponentes = async () => {
    const res = await axiosClient.get(`/rubricas/${rid}/componentes`, {
      params: { includeInactive: true },
    });

    const raw = (res.data ?? []) as any[];
    const norm: RubricaComponente[] = raw.map((c) => ({
      id_rubrica_componente: toNum(c.id_rubrica_componente, 0),
      id_rubrica: toNum(c.id_rubrica, rid),
      nombre_componente: String(c.nombre_componente ?? ""),
      tipo_componente: (c.tipo_componente ?? "OTRO") as "ESCRITA" | "ORAL" | "OTRO",
      ponderacion: toNum(c.ponderacion, 0), // ✅ aquí arregla "40,00"
      orden: toNum(c.orden, 0),
      estado: toNum(c.estado, 1),
    }));

    setComponentes(norm);
  };

  const loadCriteriosDeComponente = async (idComp: number) => {
    const res = await axiosClient.get(`/componentes/${idComp}/criterios`, {
      params: { includeInactive: true },
    });

    const raw = (res.data ?? []) as any[];
    const norm: RubricaCriterio[] = raw.map((x) => ({
      id_rubrica_criterio: toNum(x.id_rubrica_criterio, 0),
      id_rubrica_componente: toNum(x.id_rubrica_componente, idComp),
      nombre_criterio: String(x.nombre_criterio ?? ""),
      orden: toNum(x.orden, 0),
      estado: toNum(x.estado, 1),
    }));

    setCriteriosByComp((prev) => ({ ...prev, [idComp]: norm }));
    return norm;
  };

  const loadCeldasDeCriterio = async (criterioId: number) => {
    const res = await axiosClient.get(`/criterios/${criterioId}/niveles`, {
      params: { includeInactive: true },
    });
    const arr = (res.data ?? []) as RubricaCriterioNivel[];

    const map: Record<number, RubricaCriterioNivel> = {};
    for (const rcn of arr) {
      map[toNum((rcn as any).id_rubrica_nivel)] = rcn;
    }
    setCeldasByCriterio((prev) => ({ ...prev, [criterioId]: map }));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRubrica(), loadNiveles(), loadComponentes()]);

      // criterios
      const compArr = await (async () => {
        const res = await axiosClient.get(`/rubricas/${rid}/componentes`, {
          params: { includeInactive: true },
        });
        const raw = (res.data ?? []) as any[];
        const norm: RubricaComponente[] = raw.map((c) => ({
          id_rubrica_componente: toNum(c.id_rubrica_componente, 0),
          id_rubrica: toNum(c.id_rubrica, rid),
          nombre_componente: String(c.nombre_componente ?? ""),
          tipo_componente: (c.tipo_componente ?? "OTRO") as "ESCRITA" | "ORAL" | "OTRO",
          ponderacion: toNum(c.ponderacion, 0),
          orden: toNum(c.orden, 0),
          estado: toNum(c.estado, 1),
        }));
        setComponentes(norm);
        return norm;
      })();

      const criteriosArrays = await Promise.all(
        compArr.map((c) => loadCriteriosDeComponente(c.id_rubrica_componente))
      );

      const allCriterios = criteriosArrays.flat();
      await Promise.all(allCriterios.map((cr) => loadCeldasDeCriterio(cr.id_rubrica_criterio)));
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

  // ---------------------------
  // ACCIONES: RUBRICA
  // ---------------------------
  const saveRubrica = async () => {
    try {
      setLoading(true);
      await axiosClient.put(`/rubricas/${rid}`, {
        nombre_rubrica: nombreRubrica.trim(),
        descripcion_rubrica: descRubrica.trim() ? descRubrica.trim() : null,
        ponderacion_global: 100,
      });
      await loadRubrica();
      alert("Rúbrica actualizada");
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar la rúbrica");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------
  // ACCIONES: NIVELES
  // ---------------------------
  const addNivel = async () => {
    try {
      const orden = (nivelesActivos.at(-1)?.orden_nivel ?? 0) + 1;
      await axiosClient.post(`/rubricas/${rid}/niveles`, {
        nombre_nivel: "Nuevo nivel",
        valor_nivel: 0,
        orden_nivel: orden,
      });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el nivel");
    }
  };

  const updateNivel = async (nivelId: number, patch: Partial<RubricaNivel>) => {
    const current = niveles.find((n) => n.id_rubrica_nivel === nivelId);
    if (!current) return;

    try {
      await axiosClient.put(`/rubricas/${rid}/niveles/${nivelId}`, {
        nombre_nivel: patch.nombre_nivel ?? current.nombre_nivel,
        valor_nivel: patch.valor_nivel ?? current.valor_nivel,
        orden_nivel: patch.orden_nivel ?? current.orden_nivel,
      });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el nivel");
    }
  };

  const deleteNivel = async (nivelId: number) => {
    if (!confirm("¿Eliminar este nivel?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/niveles/${nivelId}/estado`, { estado: false });
      await loadNiveles();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el nivel");
    }
  };

  // ---------------------------
  // ACCIONES: COMPONENTES
  // ---------------------------
  const addComponente = async () => {
    try {
      const orden = (componentesActivos.at(-1)?.orden ?? 0) + 1;
      await axiosClient.post(`/rubricas/${rid}/componentes`, {
        nombre_componente: `Componente ${orden}`,
        tipo_componente: "OTRO",
        ponderacion: 0,
        orden,
      });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el componente");
    }
  };

  const updateComponente = async (comp: RubricaComponente, patch: Partial<RubricaComponente>) => {
    try {
      await axiosClient.put(`/rubricas/${rid}/componentes/${comp.id_rubrica_componente}`, {
        nombre_componente: patch.nombre_componente ?? comp.nombre_componente,
        tipo_componente: patch.tipo_componente ?? comp.tipo_componente,
        ponderacion: patch.ponderacion ?? comp.ponderacion,
        orden: patch.orden ?? comp.orden,
      });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el componente");
    }
  };

  const deleteComponente = async (compId: number) => {
    if (!confirm("¿Eliminar este componente?")) return;
    try {
      await axiosClient.patch(`/rubricas/${rid}/componentes/${compId}/estado`, { estado: false });
      await loadComponentes();
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el componente");
    }
  };

  // ---------------------------
  // ACCIONES: CRITERIOS
  // ---------------------------
  const addCriterio = async (compId: number) => {
    try {
      const arr = criteriosByComp[compId] ?? [];
      const orden =
        (arr
          .filter((x) => x.estado === 1)
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .at(-1)?.orden ?? 0) + 1;

      await axiosClient.post(`/componentes/${compId}/criterios`, {
        nombre_criterio: "Nuevo criterio",
        orden,
      });

      const nuevos = await loadCriteriosDeComponente(compId);
      const creado = nuevos.find((x) => x.orden === orden) ?? nuevos.at(-1);

      if (creado?.id_rubrica_criterio) {
        await loadCeldasDeCriterio(creado.id_rubrica_criterio);
      }
    } catch (e) {
      console.error(e);
      alert("No se pudo añadir el criterio");
    }
  };

  const updateCriterio = async (
    compId: number,
    criterio: RubricaCriterio,
    patch: Partial<RubricaCriterio>
  ) => {
    try {
      await axiosClient.put(`/componentes/${compId}/criterios/${criterio.id_rubrica_criterio}`, {
        nombre_criterio: patch.nombre_criterio ?? criterio.nombre_criterio,
        orden: patch.orden ?? criterio.orden,
      });
      await loadCriteriosDeComponente(compId);
    } catch (e) {
      console.error(e);
      alert("No se pudo actualizar el criterio");
    }
  };

  const deleteCriterio = async (compId: number, criterioId: number) => {
    if (!confirm("¿Eliminar este criterio?")) return;
    try {
      await axiosClient.patch(`/componentes/${compId}/criterios/${criterioId}/estado`, {
        estado: false,
      });
      await loadCriteriosDeComponente(compId);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar el criterio");
    }
  };

  // ---------------------------
  // CELDAS (UPSERT)
  // ---------------------------
  const getCellKey = (criterioId: number, nivelId: number) => `${criterioId}-${nivelId}`;

  const getCellValue = (criterioId: number, nivelId: number) => {
    const key = getCellKey(criterioId, nivelId);
    if (draftCell[key] !== undefined) return draftCell[key];
    const cell = celdasByCriterio[criterioId]?.[nivelId];
    return cell?.descripcion ?? "";
  };

  const scheduleUpsert = (criterioId: number, nivelId: number, value: string) => {
    const key = getCellKey(criterioId, nivelId);

    setDraftCell((prev) => ({ ...prev, [key]: value }));

    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await axiosClient.post(`/criterios/${criterioId}/niveles`, {
          id_rubrica_nivel: nivelId,
          descripcion: value ?? "",
        });
        await loadCeldasDeCriterio(criterioId);
      } catch (e) {
        console.error(e);
      }
    }, 280);
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div className="wrap rubricaEditorPage">
      <div className="containerFull">
        {/* HERO */}
        <div className="hero">
          <div className="heroLeft">
            <img className="heroLogo" src={escudoESPE} alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">{rubrica ? "EDITAR RÚBRICA" : "RÚBRICA"}</h1>
              <p className="heroSubtitle">Configuración de criterios y niveles de evaluación</p>
            </div>
          </div>

          <button className="heroBtn" onClick={goBack} type="button">
            <ArrowLeft className="iconSm" /> Volver
          </button>
        </div>

        {/* BOX */}
        <div className="box">
          <div className="boxHead">
            <div className="sectionTitle">
              <span className="sectionTitleIcon">
                <List className="iconSm" />
              </span>
              {nombreRubrica?.trim() ? `Rúbrica: ${nombreRubrica}` : "Rúbrica (sin nombre)"}
            </div>

            <div className={`rePill ${Math.abs(totalPonderacionActiva - 100) < 0.001 ? "ok" : ""}`}>
              Total ponderación: <b>{totalPonderacionActiva.toFixed(2)}%</b>
            </div>
          </div>

          {/* ... tu resto del render se queda IGUAL ... */}
          {/* (No lo repito aquí para no hacerte copiar gigante otra vez) */}
        </div>
      </div>
    </div>
  );
}
