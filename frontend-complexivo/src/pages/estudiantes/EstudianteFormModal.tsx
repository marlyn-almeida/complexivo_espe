import { useEffect, useMemo, useState } from "react";

import type { Estudiante } from "../../types/estudiante";
import type { CarreraPeriodo } from "../../types/carreraPeriodo";

import { estudiantesService } from "../../services/estudiantes.service";

import {
  Mail,
  Phone,
  Hash,
  User,
  Save,
  X,
  GraduationCap,
  BadgeInfo,
  IdCard,
} from "lucide-react";

import "./EstudianteModal.css";

type ToastType = "success" | "error" | "info";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function safeUpper(v?: string | null) {
  const x = String(v ?? "").trim();
  return x ? x.toUpperCase() : "";
}

export default function EstudianteFormModal({
  mode,
  estudiante,
  carreraPeriodos,
  selectedCarreraPeriodoId,
  onClose,
  onSaved,
  onToast,
}: {
  mode: "create" | "edit";
  estudiante: Estudiante | null;
  carreraPeriodos: CarreraPeriodo[];
  // ✅ este nombre coincide con el Page que te pasé
  selectedCarreraPeriodoId?: number;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onToast: (msg: string, type?: ToastType) => void;
}) {
  const isEdit = mode === "edit";
  const title = isEdit ? "Editar estudiante" : "Crear nuevo estudiante";
  const sub = isEdit ? "Actualiza la información del estudiante." : "Completa la información del estudiante.";

  const [saving, setSaving] = useState(false);

  const [cpId, setCpId] = useState<number | "">("");
  const [idInst, setIdInst] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");

  const cpOptions = useMemo(() => {
    return (carreraPeriodos ?? []).slice().sort((a: any, b: any) => {
      const aCarrera = String(a?.nombre_carrera ?? "");
      const bCarrera = String(b?.nombre_carrera ?? "");
      const aPeriodo = String(a?.codigo_periodo ?? a?.descripcion_periodo ?? "");
      const bPeriodo = String(b?.codigo_periodo ?? b?.descripcion_periodo ?? "");
      return `${aCarrera} ${aPeriodo}`.localeCompare(`${bCarrera} ${bPeriodo}`, "es");
    });
  }, [carreraPeriodos]);

  useEffect(() => {
    if (isEdit && estudiante) {
      setCpId(Number((estudiante as any).id_carrera_periodo) || "");
      setIdInst(safeUpper((estudiante as any).id_institucional_estudiante));
      setCedula(onlyDigits(String((estudiante as any).cedula ?? "")));
      setNombres(String((estudiante as any).nombres_estudiante ?? ""));
      setApellidos(String((estudiante as any).apellidos_estudiante ?? ""));
      setCorreo(String((estudiante as any).correo_estudiante ?? ""));
      setTelefono(onlyDigits(String((estudiante as any).telefono_estudiante ?? "")));
      return;
    }

    // create
    const initCp =
      selectedCarreraPeriodoId && Number(selectedCarreraPeriodoId) > 0
        ? Number(selectedCarreraPeriodoId)
        : cpOptions.length
        ? Number((cpOptions[0] as any).id_carrera_periodo)
        : "";

    setCpId(initCp || "");
    setIdInst("");
    setCedula("");
    setNombres("");
    setApellidos("");
    setCorreo("");
    setTelefono("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, estudiante, selectedCarreraPeriodoId, cpOptions.length]);

  function validate(): string | null {
    if (!cpId) return "Carrera–Período es obligatorio.";

    if (!idInst.trim()) return "ID institucional es obligatorio.";
    if (safeUpper(idInst).length < 4) return "ID institucional inválido.";

    // ✅ BD: usualmente obligatorio
    if (!cedula.trim()) return "Cédula es obligatoria.";
    if (onlyDigits(cedula).length < 10) return "Cédula debe tener al menos 10 dígitos.";

    if (!nombres.trim()) return "Nombres es obligatorio.";
    if (nombres.trim().length < 3) return "Nombres debe tener al menos 3 caracteres.";

    if (!apellidos.trim()) return "Apellidos es obligatorio.";
    if (apellidos.trim().length < 3) return "Apellidos debe tener al menos 3 caracteres.";

    if (correo.trim() && !isEmail(correo)) return "Correo no tiene formato válido.";

    return null;
  }

  function extractBackendError(err: any) {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;

    if (Array.isArray(list) && list.length) {
      const first = list[0];
      if (first?.msg) return String(first.msg);
    }
    if (typeof msg === "string" && msg.trim()) return msg;

    return "No se pudo guardar el estudiante.";
  }

  async function onSubmit() {
    const err = validate();
    if (err) {
      onToast(err, "info");
      return;
    }

    try {
      setSaving(true);

      // ✅ payload alineado a BD (incluye cedula)
      const payload = {
        id_carrera_periodo: Number(cpId),
        id_institucional_estudiante: safeUpper(idInst),
        cedula: onlyDigits(cedula),
        nombres_estudiante: nombres.trim(),
        apellidos_estudiante: apellidos.trim(),
        correo_estudiante: correo.trim() ? correo.trim() : null,
        telefono_estudiante: telefono.trim() ? onlyDigits(telefono) : null,
      };

      if (!isEdit) {
        await estudiantesService.create(payload as any);
        onToast("Estudiante creado correctamente.", "success");
      } else {
        if (!estudiante) {
          onToast("No se encontró el estudiante para editar.", "error");
          return;
        }
        await estudiantesService.update((estudiante as any).id_estudiante, payload as any);
        onToast("Estudiante actualizado correctamente.", "success");
      }

      await onSaved();
      onClose();
    } catch (e: any) {
      onToast(extractBackendError(e), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dmOverlay" onMouseDown={saving ? undefined : onClose} role="dialog" aria-modal="true">
      <div className="dmCard dmWide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <User size={18} />
            </div>
            <div className="dmHeaderText">
              <div className="dmTitle">{title}</div>
              <div className="dmSub">{sub}</div>
            </div>
          </div>

          <button className="dmClose" onClick={onClose} aria-label="Cerrar" disabled={saving}>
            ✕
          </button>
        </div>

        <div className="dmBody">
          <div className="dmFormTop">
            <div className="dmFormHint">
              <BadgeInfo size={16} />
              <span>
                Campos obligatorios marcados con <b>*</b>.
              </span>
            </div>
          </div>

          <div className="dmFormGrid">
            {/* Carrera–Período */}
            <div className="dmInput dmSpan2">
              <label>
                <GraduationCap size={14} /> Carrera–Período <span className="req">*</span>
              </label>

              <div className="dmSelectBox">
                <select
                  value={cpId}
                  onChange={(e) => setCpId(e.target.value ? Number(e.target.value) : "")}
                  disabled={saving}
                >
                  <option value="">Seleccione Carrera–Período</option>
                  {cpOptions.map((cp: any) => {
                    const carrera = cp.nombre_carrera ?? `Carrera ${cp.id_carrera}`;
                    const periodo = cp.codigo_periodo ?? cp.descripcion_periodo ?? `Período ${cp.id_periodo}`;
                    return (
                      <option key={cp.id_carrera_periodo} value={cp.id_carrera_periodo}>
                        {carrera} — {periodo}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* ID institucional */}
            <div className="dmInput">
              <label>
                <Hash size={14} /> ID institucional <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={idInst}
                  onChange={(e) => setIdInst(e.target.value)}
                  placeholder="Ej: ESPE-2025-00123"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Cédula */}
            <div className="dmInput">
              <label>
                <IdCard size={14} /> Cédula <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={cedula}
                  onChange={(e) => setCedula(onlyDigits(e.target.value))}
                  placeholder="10 dígitos"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Nombres */}
            <div className="dmInput">
              <label>
                <User size={14} /> Nombres <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej: María Fernanda"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Apellidos */}
            <div className="dmInput">
              <label>
                <User size={14} /> Apellidos <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Ej: Almeida Quiroz"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Correo */}
            <div className="dmInput dmSpan2">
              <label>
                <Mail size={14} /> Correo
              </label>
              <div className="dmInputBox">
                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="correo@espe.edu.ec"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="dmInput dmSpan2">
              <label>
                <Phone size={14} /> Teléfono
              </label>
              <div className="dmInputBox">
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(onlyDigits(e.target.value))}
                  placeholder="Opcional"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="dmFooter">
            <button className="dmBtnGhost" onClick={onClose} disabled={saving}>
              <X size={16} /> Cancelar
            </button>

            <button className="dmBtnPrimary" onClick={onSubmit} disabled={saving}>
              <Save size={16} /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear estudiante"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
