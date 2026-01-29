import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Carrera } from "../../types/carrera";
import type { Docente } from "../../types/docente";

import { docentesService } from "../../services/docentes.service";
import { carrerasService } from "../../services/carreras.service";

import {
  Save,
  ArrowLeft,
  UserPlus,
  Hash,
  Mail,
  Phone,
  User,
} from "lucide-react";

import escudoESPE from "../../assets/escudo.png";
import "./DocenteFormPage.css";

/* ===============================
   TIPOS
   =============================== */
type ToastType = "success" | "error" | "info";

type DocenteFormState = {
  id_institucional_docente: string;
  cedula: string;
  nombres_docente: string;
  apellidos_docente: string;
  correo_docente: string;
  telefono_docente: string;
  nombre_usuario: string;
  id_carrera: string; // solo crear
};

/* ===============================
   HELPERS
   =============================== */
const onlyDigits = (v: string) => v.replace(/\D+/g, "");
const normalizeSpaces = (v: string) => v.replace(/\s+/g, " ").trim();
const cleanNameLike = (v: string) =>
  v.replace(/[^A-Za-zÁÉÍÓÚÜáéíóúüÑñ\s-]+/g, "").replace(/\s+/g, " ").trim();
const cleanInstitucional = (v: string) =>
  v.replace(/[.]+/g, "").replace(/\s+/g, " ").trim();
const cleanUsername = (v: string) =>
  v.replace(/[^a-zA-Z0-9._-]+/g, "").trim();

const isValidEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v);

/* ===============================
   COMPONENTE
   =============================== */
export default function DocenteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const docenteId = id ? Number(id) : null;
  const isEdit = useMemo(
    () => Boolean(docenteId && !Number.isNaN(docenteId)),
    [docenteId]
  );

  const [loading, setLoading] = useState(false);
  const [loadingCarreras, setLoadingCarreras] = useState(false);

  const [carreras, setCarreras] = useState<Carrera[]>([]);

  const [form, setForm] = useState<DocenteFormState>({
    id_institucional_docente: "",
    cedula: "",
    nombres_docente: "",
    apellidos_docente: "",
    correo_docente: "",
    telefono_docente: "",
    nombre_usuario: "",
    id_carrera: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(
    null
  );

  /* ===============================
     TOAST
     =============================== */
  function showToast(msg: string, type: ToastType = "info") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  function extractBackendError(err: any): string {
    const msg = err?.response?.data?.message;
    const list = err?.response?.data?.errors;
    if (Array.isArray(list) && list.length && list[0]?.msg)
      return String(list[0].msg);
    if (typeof msg === "string" && msg.trim()) return msg;
    return "Error al guardar docente";
  }

  /* ===============================
     LOADERS
     =============================== */
  useEffect(() => {
    loadCarreras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEdit && docenteId) loadDocente(docenteId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, docenteId]);

  async function loadCarreras() {
    try {
      setLoadingCarreras(true);
      const data = await carrerasService.list(false);
      setCarreras((data ?? []).filter((c) => c.estado === 1));
    } catch {
      showToast("Error al cargar carreras", "error");
    } finally {
      setLoadingCarreras(false);
    }
  }

  async function loadDocente(id: number) {
    try {
      setLoading(true);
      const d: Docente = await docentesService.get(id);

      setForm({
        id_institucional_docente: d.id_institucional_docente ?? "",
        cedula: d.cedula ?? "",
        nombres_docente: d.nombres_docente ?? "",
        apellidos_docente: d.apellidos_docente ?? "",
        correo_docente: d.correo_docente ?? "",
        telefono_docente: d.telefono_docente ?? "",
        nombre_usuario: d.nombre_usuario ?? "",
        id_carrera: "",
      });
    } catch {
      showToast("No se pudo cargar el docente.", "error");
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     VALIDACIÓN
     =============================== */
  function validateForm() {
    const e: Record<string, string> = {};

    if (!form.id_institucional_docente)
      e.id_institucional_docente = "ID institucional obligatorio.";

    if (!onlyDigits(form.cedula) || form.cedula.length !== 10)
      e.cedula = "Cédula inválida (10 dígitos).";

    if (cleanNameLike(form.nombres_docente).length < 3)
      e.nombres_docente = "Nombres obligatorios.";

    if (cleanNameLike(form.apellidos_docente).length < 3)
      e.apellidos_docente = "Apellidos obligatorios.";

    if (form.correo_docente && !isValidEmail(form.correo_docente))
      e.correo_docente = "Correo no válido.";

    if (!cleanUsername(form.nombre_usuario))
      e.nombre_usuario = "Usuario obligatorio.";

    if (!isEdit && !form.id_carrera)
      e.id_carrera = "Selecciona una carrera.";

    return e;
  }

  /* ===============================
     SAVE
     =============================== */
  async function onSave() {
    const e = validateForm();
    setErrors(e);

    if (Object.keys(e).length) {
      showToast("Revisa los campos obligatorios.", "error");
      return;
    }

    try {
      setLoading(true);

      const payload: any = {
        id_institucional_docente: cleanInstitucional(
          form.id_institucional_docente
        ),
        cedula: onlyDigits(form.cedula),
        nombres_docente: cleanNameLike(form.nombres_docente),
        apellidos_docente: cleanNameLike(form.apellidos_docente),
        correo_docente: form.correo_docente || undefined,
        telefono_docente: onlyDigits(form.telefono_docente) || undefined,
        nombre_usuario: cleanUsername(form.nombre_usuario),
      };

      if (!isEdit) payload.id_carrera = Number(form.id_carrera);

      if (isEdit && docenteId) {
        await docentesService.update(docenteId, payload);
        showToast("Docente actualizado.", "success");
      } else {
        await docentesService.create(payload);
        showToast("Docente creado.", "success");
      }

      navigate("/docentes");
    } catch (err: any) {
      showToast(extractBackendError(err), "error");
    } finally {
      setLoading(false);
    }
  }

  /* ===============================
     RENDER
     =============================== */
  return (
    <div className="docenteFormPage">
      <div className="wrap">
        <div className="hero">
          <div className="heroLeft">
            <img src={escudoESPE} className="heroLogo" alt="ESPE" />
            <div className="heroText">
              <h1 className="heroTitle">
                {isEdit ? "Editar docente" : "Nuevo docente"}
              </h1>
              <p className="heroSubtitle">
                {isEdit
                  ? "Actualiza la información del docente."
                  : "Registro institucional de docentes."}
              </p>
            </div>
          </div>

          <div className="heroActions">
            <button className="heroBtn ghost" onClick={() => navigate("/docentes")}>
              <ArrowLeft /> Volver
            </button>
            <button
              className="heroBtn primary"
              onClick={onSave}
              disabled={loading}
            >
              <Save /> Guardar
            </button>
          </div>
        </div>

        <div className="box">
          <div className="sectionTitle">
            <span className="sectionTitleIcon">
              <UserPlus size={18} />
            </span>
            Formulario
          </div>

          {/* aquí va el formulario (ya lo tienes y es compatible con este TSX) */}
        </div>
      </div>

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
