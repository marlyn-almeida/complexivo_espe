import type { Estudiante } from "../../types/estudiante";
import { BadgeCheck, BadgeX, Eye, Hash, Mail, Phone, User, GraduationCap } from "lucide-react";
import "./EstudianteViewModal.css";

function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

export default function EstudianteViewModal({
  estudiante,
  selectedCPLabel,
  onClose,
}: {
  estudiante: Estudiante;
  selectedCPLabel?: string; // ✅ coincide con tu Page
  onClose: () => void;
}) {
  const fullName =
    `${estudiante.apellidos_estudiante || ""} ${estudiante.nombres_estudiante || ""}`.trim() || "-";

  const idInst = (estudiante.id_institucional_estudiante || "-").toUpperCase();
  const correo = estudiante.correo_estudiante || "-";
  const telefono = onlyDigits(estudiante.telefono_estudiante || "") || "-";

  // ✅ Prioridad: lo que calcula tu Page (porque viene de carreraPeriodos)
  const cp =
    selectedCPLabel ||
    ((estudiante as any).nombre_carrera && (estudiante as any).codigo_periodo
      ? `${(estudiante as any).nombre_carrera} — ${(estudiante as any).codigo_periodo}`
      : estudiante.id_carrera_periodo
      ? `ID: ${estudiante.id_carrera_periodo}`
      : "-");

  const activo = Number(estudiante.estado) === 1;

  return (
    <div className="dmOverlay" onMouseDown={onClose}>
      <div className="dmCard dmCardWide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <Eye size={18} />
            </div>
            <div className="dmHeaderText">
              <div className="dmTitle">Detalle de estudiante</div>
              <div className="dmSub">Información registrada del estudiante</div>
            </div>
          </div>

          <button className="dmClose" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="dmBody">
          <div className="dmTop">
            <div className="dmAvatar">
              <User size={20} />
            </div>

            <div className="dmTopMain">
              <div className="dmNameRow">
                <div className="dmName">{fullName}</div>

                {activo ? (
                  <span className="dmPill dmPillGreen">
                    <BadgeCheck size={14} /> ACTIVO
                  </span>
                ) : (
                  <span className="dmPill dmPillGray">
                    <BadgeX size={14} /> INACTIVO
                  </span>
                )}
              </div>

              <div className="dmMiniRow">
                <span className="dmMiniItem">
                  <Hash size={14} /> <span className="mono">{idInst}</span>
                </span>
                <span className="dmMiniDot">•</span>
                <span className="dmMiniItem">
                  <Mail size={14} /> <span className="dmEllipsis">{correo}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="dmGrid">
            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> ID institucional
              </div>
              <div className="dmValue mono">{idInst}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Phone size={16} /> Teléfono
              </div>
              <div className="dmValue">{telefono}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> Estado
              </div>
              <div className="dmValue">
                {activo ? (
                  <span className="dmBadge dmBadgeOk">
                    <BadgeCheck size={16} /> ACTIVO
                  </span>
                ) : (
                  <span className="dmBadge dmBadgeOff">
                    <BadgeX size={16} /> INACTIVO
                  </span>
                )}
              </div>
            </div>

            <div className="dmField dmFull">
              <div className="dmLabel">
                <Mail size={16} /> Correo
              </div>
              <div className="dmValue dmWrap">{correo}</div>
            </div>

            <div className="dmField dmFull">
              <div className="dmLabel">
                <GraduationCap size={16} /> Carrera–Período
              </div>
              <div className="dmValue">{cp}</div>
            </div>
          </div>

          <div className="dmFooter">
            <button className="dmBtnGhost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
