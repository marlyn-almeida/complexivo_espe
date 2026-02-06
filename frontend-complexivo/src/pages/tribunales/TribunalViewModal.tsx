import { useEffect, useMemo, useState } from "react";
import "./TribunalViewModal.css";

import type { Tribunal } from "../../types/tribunal";
import type { TribunalEstudiante } from "../../types/tribunalEstudiante";

import { tribunalEstudiantesService } from "../../services/tribunalEstudiantes.service";

type Props = {
  open: boolean;
  onClose: () => void;

  tribunal: Tribunal | null;

  cpLabel: string;
  isActivo: (v: any) => boolean;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;

  onOpenAsignaciones?: (t: Tribunal) => void;
};

export default function TribunalViewModal({
  open,
  onClose,
  tribunal,
  cpLabel,
  isActivo,
  showToast,
  onOpenAsignaciones,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [asignaciones, setAsignaciones] = useState<TribunalEstudiante[]>([]);
  const [mostrarInactivas, setMostrarInactivas] = useState(true);

  useEffect(() => {
    if (!open || !tribunal) return;

    (async () => {
      try {
        setLoading(true);
        const data = await tribunalEstudiantesService.list({
          tribunalId: tribunal.id_tribunal,
          includeInactive: true,
          page: 1,
          limit: 200,
        });
        setAsignaciones(data ?? []);
      } catch {
        setAsignaciones([]);
        showToast?.("No se pudieron cargar las asignaciones del tribunal.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, tribunal, showToast]);

  const rows = useMemo(() => {
    const base = asignaciones ?? [];
    if (mostrarInactivas) return base;
    return base.filter((x) => isActivo(x.estado));
  }, [asignaciones, mostrarInactivas, isActivo]);

  if (!open || !tribunal) return null;

  const activo = isActivo(tribunal.estado);

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalCard modalWide tribunalViewCard" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="tvHeaderLeft">
            <h3 className="modalTitle">Detalle del tribunal</h3>
            <p className="tvSubtitle">
              {cpLabel ? (
                <>
                  Carrera–Período: <b>{cpLabel}</b>
                </>
              ) : (
                <span className="muted">Carrera–Período: —</span>
              )}
            </p>
          </div>

          <div className="tvHeaderRight">
            {onOpenAsignaciones ? (
              <button className="btnSecondary" onClick={() => onOpenAsignaciones(tribunal)} type="button">
                Ver / administrar asignaciones
              </button>
            ) : null}
            <button className="btnClose" onClick={onClose} type="button">
              ✕
            </button>
          </div>
        </div>

        <div className="modalBody tvBody">
          <div className="tvGrid">
            <div className="tvItem">
              <div className="tvKey">Nombre</div>
              <div className="tvVal">{tribunal.nombre_tribunal?.trim() ? tribunal.nombre_tribunal : "—"}</div>
            </div>

            <div className="tvItem">
              <div className="tvKey">Caso</div>
              <div className="tvVal">{tribunal.caso == null ? "—" : tribunal.caso}</div>
            </div>

            <div className="tvItem tvItemFull">
              <div className="tvKey">Descripción</div>
              <div className="tvVal">{tribunal.descripcion_tribunal?.trim() ? tribunal.descripcion_tribunal : "—"}</div>
            </div>

            <div className="tvItem">
              <div className="tvKey">Estado</div>
              <div className="tvVal">
                <span className={`badge ${activo ? "badgeActive" : "badgeInactive"}`}>
                  {activo ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="tvItem">
              <div className="tvKey">ID Tribunal</div>
              <div className="tvVal">#{tribunal.id_tribunal}</div>
            </div>
          </div>

          <div className="separator" />

          <div className="tvAsignHeader">
            <div>
              <h4 className="tvSectionTitle">Asignaciones</h4>
              <p className="tvSectionSub">Estudiantes asignados con su franja horaria.</p>
            </div>

            <label className="toggle tvToggle">
              <input
                type="checkbox"
                checked={mostrarInactivas}
                onChange={(e) => setMostrarInactivas(e.target.checked)}
              />
              <span className="slider" />
              <span className="toggleText">Mostrar inactivas</span>
            </label>
          </div>

          <div className="tvTableWrap">
            <table className="table tvTable">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Franja</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="empty">
                      Cargando asignaciones...
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty">
                      No hay asignaciones registradas para este tribunal.
                    </td>
                  </tr>
                ) : (
                  rows.map((a) => {
                    const ok = isActivo(a.estado);

                    const estudianteTxt =
                      a.apellidos_estudiante && a.nombres_estudiante
                        ? `${a.apellidos_estudiante} ${a.nombres_estudiante}`
                        : `ID estudiante: ${a.id_estudiante}`;

                    const franjaTxt =
                      a.fecha && a.hora_inicio && a.hora_fin
                        ? `${a.fecha} ${a.hora_inicio}–${a.hora_fin} • ${a.laboratorio ?? ""}`
                        : `ID franja: ${a.id_franja_horario}`;

                    return (
                      <tr key={a.id_tribunal_estudiante}>
                        <td>
                          <div className="tdTitle">{estudianteTxt}</div>
                          {a.id_institucional_estudiante ? <div className="tdSub">{a.id_institucional_estudiante}</div> : null}
                        </td>
                        <td>{franjaTxt}</td>
                        <td>
                          <span className={`badge ${ok ? "badgeActive" : "badgeInactive"}`}>
                            {ok ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="hint tvHint">
            Tip: Si quieres editar/activar/desactivar asignaciones, usa el botón <b>“Ver / administrar asignaciones”</b>.
          </div>
        </div>

        <div className="modalFooter">
          <button className="btnPrimary" onClick={onClose} type="button">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
