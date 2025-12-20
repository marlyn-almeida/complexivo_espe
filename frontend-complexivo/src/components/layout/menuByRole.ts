import type { RolId } from "../../utils/auth";

export type MenuItem = {
  label: string;
  to: string;
  roles: RolId[];
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
      { label: "Dashboard", to: "/", roles: [1, 2, 3] },
      { label: "Mi perfil", to: "/perfil", roles: [1, 2, 3] },
    ],
  },

  /* =========================
     SUPER_ADMIN (1)
     ========================= */
  {
    title: "Configuración global",
    roles: [1],
    items: [
      { label: "Carreras", to: "/carreras", roles: [1] },
      { label: "Períodos académicos", to: "/periodos", roles: [1] },
      { label: "Rúbricas", to: "/rubricas", roles: [1] },
    ],
  },

  {
    title: "Administración del sistema",
    roles: [1],
    items: [
      // ✅ Docentes SOLO aquí para SUPER_ADMIN
      { label: "Docentes", to: "/docentes", roles: [1] },

      // ✅ nuevo nombre pro
      { label: "Asignación de personal por carrera", to: "/asignacion-personal", roles: [1] },

      // si lo necesitas para tus reglas (a veces es útil)
      { label: "Carrera-Período", to: "/carrera-periodo", roles: [1] },
    ],
  },

  {
    title: "Seguridad",
    roles: [1],
    items: [
      { label: "Roles", to: "/roles", roles: [1] },
      { label: "Permisos", to: "/permisos", roles: [1] },
    ],
  },

  /* =========================
     ADMIN (2) - por carrera
     ========================= */
  {
    title: "Gestión por carrera",
    roles: [2],
    items: [
      { label: "Docentes", to: "/docentes", roles: [2] },
      { label: "Estudiantes", to: "/estudiantes", roles: [2] },
      { label: "Franjas horarias", to: "/franjas", roles: [2] },
    ],
  },

  {
    title: "Tribunales",
    roles: [2],
    items: [
      { label: "Tribunales", to: "/tribunales", roles: [2] },
      { label: "Asignación Docente-Tribunal", to: "/tribunal-docentes", roles: [2] },
    ],
  },

  {
    title: "Actas y calificaciones",
    roles: [2],
    items: [
      { label: "Actas", to: "/actas", roles: [2] },
      { label: "Calificaciones", to: "/calificaciones", roles: [2] },
    ],
  },

  /* =========================
     DOCENTE (3)
     ========================= */
  {
    title: "Tribunales",
    roles: [3],
    items: [
      { label: "Mis tribunales", to: "/mis-tribunales", roles: [3] },
      { label: "Calificar", to: "/calificar", roles: [3] },
    ],
  },

  {
    title: "Actas y calificaciones",
    roles: [3],
    items: [
      { label: "Actas", to: "/actas", roles: [3] },
      { label: "Calificaciones", to: "/calificaciones", roles: [3] },
    ],
  },
];
