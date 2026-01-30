import type { Docente } from "../../types/docente";
import {
  BadgeCheck,
  BadgeX,
  Eye,
  Hash,
  Mail,
  Phone,
  User,
  Building2,
  Shield,
} from "lucide-react";
import "./DocenteViewModal.css";


function onlyDigits(v: string) {
  return String(v ?? "").replace(/\D+/g, "");
}

export default function DocenteViewModal({
  docente,
  onClose,
}: {
  docente: Docente;
  onClose: () => void;
}) {
  const fullName = `${docente.apellidos_docente || ""} ${docente.nombres_docente || ""}`.trim() || "-";
  const cedula = onlyDigits(docente.cedula || "") || "-";
  const idInst = (docente.id_institucional_docente || "-").toUpperCase();
  const usuario = docente.nombre_usuario || "-";
  const correo = docente.correo_docente || "-";
  const telefono = onlyDigits((docente as any).telefono_docente || "") || "-";

  // Si tu backend manda el nombre del departamento úsalo, si no cae a id_departamento
  const departamento =
    (docente as any).nombre_departamento ||
    (docente as any).departamento ||
    ((docente as any).id_departamento ? `ID: ${(docente as any).id_departamento}` : "-");

  const isSuperAdmin = (docente as any).super_admin === 1;

  return (
    <div className="dmOverlay" onMouseDown={onClose}>
      <div className="dmCard dmCardWide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dmHeader">
          <div className="dmHeaderLeft">
            <div className="dmHeaderIcon">
              <Eye size={18} />
            </div>
            <div>
              <div className="dmTitle">Detalle de docente</div>
              <div className="dmSub">Información registrada del docente</div>
            </div>
          </div>

          <button className="dmClose" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="dmBody">
          {/* ✅ Barra superior tipo “resumen” (más pro y horizontal) */}
          <div className="dmTop">
            <div className="dmAvatar">
              <User size={20} />
            </div>

            <div className="dmTopMain">
              <div className="dmNameRow">
                <div className="dmName">{fullName}</div>

                {isSuperAdmin && (
                  <span className="dmPill dmPillPurple">
                    <Shield size={14} /> SUPER_ADMIN
                  </span>
                )}

                {docente.estado ? (
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
                  <Hash size={14} /> <span className="mono">{usuario}</span>
                </span>
                <span className="dmMiniDot">•</span>
                <span className="dmMiniItem">
                  <Mail size={14} /> <span className="dmEllipsis">{correo}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ✅ Grid en 3 columnas (más horizontal) */}
          <div className="dmGrid">
            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> ID institucional
              </div>
              <div className="dmValue mono">{idInst}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> Cédula
              </div>
              <div className="dmValue mono">{cedula}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Phone size={16} /> Teléfono
              </div>
              <div className="dmValue">{telefono}</div>
            </div>

            <div className="dmField dmFull">
              <div className="dmLabel">
                <Mail size={16} /> Correo
              </div>
              <div className="dmValue dmWrap">{correo}</div>
            </div>

            <div className="dmField dmFull">
              <div className="dmLabel">
                <Building2 size={16} /> Departamento
              </div>
              <div className="dmValue">{departamento}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> Usuario
              </div>
              <div className="dmValue mono">{usuario}</div>
            </div>

            <div className="dmField">
              <div className="dmLabel">
                <Hash size={16} /> Estado
              </div>
              <div className="dmValue">
                {docente.estado ? (
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

            <div className="dmField">
              <div className="dmLabel">
                <User size={16} /> Rol global
              </div>
              <div className="dmValue">{isSuperAdmin ? "SUPER_ADMIN" : "-"}</div>
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
