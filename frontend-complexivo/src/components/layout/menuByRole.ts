// ✅ src/components/layout/menuByRole.ts
import type { RolId } from "../../utils/auth";

export type IconName =
  | "principal"
  | "perfil"
  | "carreras"
  | "periodos"
  | "rubricas"
  | "docentes"
  | "acta"
  | "tribunales"
  | "estudiantes"
  | "casosEstudio"
  | "entregasCaso"
  | "planEvaluacion"
  | "calificadores"
  | "notaTeorico"
  | "ponderaciones";

export type MenuItem = {
  label: string;
  to: string;
  roles: RolId[];
  icon: IconName;
};

export type MenuSection = {
  title: string;
  roles: RolId[];
  items: MenuItem[];
};

// 1 = SUPER_ADMIN, 2 = ADMIN (Director / Apoyo), 3 = DOCENTE
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
      { label: "Plantillas Acta Word", to: "/plantillas-acta", roles: [1], icon: "acta" },
    ],
  },

  /* =========================
     ADMIN / DIRECTOR / APOYO (2)
     ========================= */
  {
    title: "Gestión",
    roles: [2],
    items: [
      { label: "Docentes", to: "/docentes", roles: [2], icon: "docentes" },
      { label: "Estudiantes", to: "/estudiantes", roles: [2], icon: "estudiantes" },
      { label: "Tribunales", to: "/tribunales", roles: [2], icon: "tribunales" },
      { label: "Casos de estudio", to: "/casos-estudio", roles: [2], icon: "casosEstudio" },

      { label: "Calificaciones", to: "/calificaciones", roles: [2], icon: "rubricas" },

      // ✅ YA: repositorio para ver PDFs firmados
      { label: "Actas firmadas", to: "/actas-firmadas", roles: [2], icon: "acta" },
    ],
  },

  /* =========================
     DOCENTE (3)
     ========================= */
  {
    title: "Tribunales",
    roles: [3],
    items: [
      { label: "Mis tribunales", to: "/mis-tribunales", roles: [3], icon: "tribunales" },
      { label: "Actas", to: "/actas", roles: [3], icon: "acta" },
    ],
  },
];