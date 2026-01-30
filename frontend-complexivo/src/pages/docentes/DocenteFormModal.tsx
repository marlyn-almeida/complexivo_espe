import { useEffect, useMemo, useState } from "react";

import type { Docente } from "../../types/docente";
import type { Departamento } from "../../types/departamento";

import { docentesService } from "../../services/docentes.service";

import {
  Mail,
  Phone,
  Hash,
  User,
  Save,
  X,
  Building2,
  IdCard,
  AtSign,
  BadgeInfo,
} from "lucide-react";

import "./DocenteModal.css";

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

export default function DocenteFormModal({
  mode,
  docente,
  departamentos,
  onClose,
  onSaved,
  onToast,
}: {
  mode: "create" | "edit";
  docente: Docente | null;
  departamentos: Departamento[];
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onToast: (msg: string, type?: ToastType) => void;
}) {
  const isEdit = mode === "edit";
  const title = isEdit ? "Editar docente" : "Crear nuevo docente";
  const sub = isEdit
    ? "Actualiza la información del docente."
    : "Completa la información. La contraseña inicial será la cédula y deberá cambiarse al primer inicio.";

  const [saving, setSaving] = useState(false);

  // ✅ 8 campos que tú pediste
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [idInst, setIdInst] = useState("");
  const [telefono, setTelefono] = useState("");
  const [usuario, setUsuario] = useState("");
  const [depId, setDepId] = useState<number | "">("");

  const depOptions = useMemo(() => {
    return departamentos
      .slice()
      .sort((a, b) => a.nombre_departamento.localeCompare(b.nombre_departamento, "es"));
  }, [departamentos]);

  useEffect(() => {
    if (isEdit && docente) {
      setNombres(docente.nombres_docente || "");
      setApellidos(docente.apellidos_docente || "");
      setCorreo(docente.correo_docente || "");
      setCedula(onlyDigits(docente.cedula || ""));
      setIdInst(safeUpper(docente.id_institucional_docente));
      setTelefono(onlyDigits(docente.telefono_docente || ""));
      setUsuario(docente.nombre_usuario || "");

      const maybeDepId = Number((docente as any)?.id_departamento || 0);
      setDepId(maybeDepId > 0 ? maybeDepId : "");
    } else {
      setNombres("");
      setApellidos("");
      setCorreo("");
      setCedula("");
      setIdInst("");
      setTelefono("");
      setUsuario("");
      setDepId(depOptions.length ? Number(depOptions[0].id_departamento) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, docente, depOptions.length]);

  function validate(): string | null {
    if (!nombres.trim()) return "Nombres es obligatorio.";
    if (!apellidos.trim()) return "Apellidos es obligatorio.";

    if (!correo.trim()) return "Correo es obligatorio.";
    if (!isEmail(correo)) return "Correo no tiene formato válido.";

    if (!cedula.trim()) return "Cédula es obligatoria.";
    if (onlyDigits(cedula).length < 10) return "Cédula debe tener al menos 10 dígitos.";

    if (!idInst.trim()) return "ID institucional es obligatorio.";
    if (!usuario.trim()) return "Usuario es obligatorio.";

    if (!depId) return "Departamento es obligatorio.";
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
    return "No se pudo guardar el docente.";
  }

  async function onSubmit() {
    const err = validate();
    if (err) {
      onToast(err, "info");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        id_institucional_docente: safeUpper(idInst),
        id_departamento: Number(depId),
        cedula: onlyDigits(cedula),
        nombres_docente: nombres.trim(),
        apellidos_docente: apellidos.trim(),
        correo_docente: correo.trim(),
        telefono_docente: telefono ? onlyDigits(telefono) : null,
        nombre_usuario: usuario.trim(),
      };

      if (!isEdit) {
        await docentesService.create(payload);
        onToast("Docente creado correctamente.", "success");
      } else {
        if (!docente) {
          onToast("No se encontró el docente para editar.", "error");
          return;
        }
        await docentesService.update(docente.id_docente, payload);
        onToast("Docente actualizado correctamente.", "success");
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
          {/* ✅ bloque superior (para que luego el CSS lo deje “pro”) */}
          <div className="dmFormTop">
            <div className="dmFormHint">
              <BadgeInfo size={16} />
              <span>
                Campos obligatorios marcados con <b>*</b>.
              </span>
            </div>
          </div>

          {/* ✅ grid (lo dejamos listo para que luego se vea como tu ejemplo bonito) */}
          <div className="dmFormGrid">
            {/* Nombres */}
            <div className="dmInput">
              <label>
                <User size={14} /> Nombres <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  placeholder="Ej: Juan Carlos"
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
                  placeholder="Ej: Pérez López"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Correo */}
            <div className="dmInput dmSpan2">
              <label>
                <Mail size={14} /> Correo <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@espe.edu.ec"
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

            {/* ID institucional */}
            <div className="dmInput">
              <label>
                <Hash size={14} /> ID institucional <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={idInst}
                  onChange={(e) => setIdInst(e.target.value)}
                  placeholder="Ej: L00012345"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Teléfono */}
            <div className="dmInput">
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

            {/* Usuario */}
            <div className="dmInput">
              <label>
                <AtSign size={14} /> Usuario <span className="req">*</span>
              </label>
              <div className="dmInputBox">
                <input
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej: jperez"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Departamento */}
            <div className="dmInput dmSpan2">
              <label>
                <Building2 size={14} /> Departamento <span className="req">*</span>
              </label>
              <div className="dmSelectBox">
                <select
                  value={depId}
                  onChange={(e) => setDepId(e.target.value ? Number(e.target.value) : "")}
                  disabled={saving}
                >
                  <option value="">Seleccione un departamento</option>
                  {depOptions.map((d) => (
                    <option key={d.id_departamento} value={d.id_departamento}>
                      {d.nombre_departamento}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="dmFooter">
            <button className="dmBtnGhost" onClick={onClose} disabled={saving}>
              <X size={16} /> Cancelar
            </button>

            <button className="dmBtnPrimary" onClick={onSubmit} disabled={saving}>
              <Save size={16} /> {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear docente"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
