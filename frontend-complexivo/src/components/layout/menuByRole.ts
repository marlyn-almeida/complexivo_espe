// src/components/layout/menuByRole.ts
import type { RolId } from "../../utils/auth";

export type IconName =
  | "principal"
  | "perfil"
  | "carreras"
  | "periodos"
  | "rubricas"
  | "docentes"
  | "carrera_periodo"
  | "acta";

export type MenuItem = {
  label: string;
  to: string;
  roles: RolId[];
  icon: IconName; // ✅ requerido
};

export type MenuSection = {
  title: string;
  roles: RolId[];
  items: MenuItem[];
};

// 1 = SUPER_ADMIN, 2 = ADMIN, 3 = DOCENTE
export const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Inicio",
    roles: [1, 2, 3],
    items: [
      { label: "Principal", to: "/", roles: [1, 2, 3], icon: "principal" },
      { label: "Mi perfil", to: "/perfil", roles: [1, 2, 3], icon: "perfil" },
    ],
  },

  /* =========================
     SUPER_ADMIN (1)
     ========================= */
  {
    title: "Configuración global",
    roles: [1],
    items: [
      { label: "Carreras", to: "/carreras", roles: [1], icon: "carreras" },
      { label: "Períodos académicos", to: "/periodos", roles: [1], icon: "periodos" },
      { label: "Rúbricas", to: "/rubricas", roles: [1], icon: "rubricas" },
    ],
  },

  {
    title: "Administración del sistema",
    roles: [1],
    items: [
      { label: "Docentes", to: "/docentes", roles: [1], icon: "docentes" },
      { label: "Carrera-Período", to: "/carrera-periodo", roles: [1], icon: "carrera_periodo" },
      { label: "Plantillas Acta Word", to: "/plantillas-acta", roles: [1], icon: "acta" },
    ],
  },

  /* =========================
     ADMIN (2)
     ========================= */
  {
    title: "Gestión por carrera",
    roles: [2],
    items: [
      { label: "Docentes", to: "/docentes", roles: [2], icon: "docentes" },
      { label: "Estudiantes", to: "/estudiantes", roles: [2], icon: "docentes" }, // si luego tienes icon estudiante lo cambiamos
      { label: "Franjas horarias", to: "/franjas", roles: [2], icon: "periodos" }, // luego lo mejoramos
    ],
  },

  {
    title: "Tribunales",
    roles: [2],
    items: [
      { label: "Tribunales", to: "/tribunales", roles: [2], icon: "carrera_periodo" },
    ],
  },

  /* =========================
     DOCENTE (3)
     ========================= */
  {
    title: "Tribunales",
    roles: [3],
    items: [
      { label: "Mis tribunales", to: "/mis-tribunales", roles: [3], icon: "carrera_periodo" },
      { label: "Actas", to: "/actas", roles: [3], icon: "acta" },
    ],
  },
];
