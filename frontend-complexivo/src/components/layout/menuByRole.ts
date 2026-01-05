// src/components/layout/menuByRole.ts
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

      // ❌ Quitado por pedido
      // { label: "Asignación de personal por carrera", to: "/asignacion-personal", roles: [1] },

      // Si lo necesitas para tus reglas (a veces es útil)
      { label: "Carrera-Período", to: "/carrera-periodo", roles: [1] },
    ],
  },

  {
    title: "Seguridad",
    roles: [1],
    items: [
      // ✅ Comentado por si luego lo necesitas
      // { label: "Roles", to: "/roles", roles: [1] },

      // ❌ Quitado por pedido
      // { label: "Permisos", to: "/permisos", roles: [1] },
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

      // ❌ Quitado por pedido (no quieres esa pantalla)
      // { label: "Asignación Docente-Tribunal", to: "/tribunal-docentes", roles: [2] },
    ],
  },

  {
    title: "Actas y calificaciones",
    roles: [2],
    items: [
      // ✅ Comentado por si luego se necesita para rol 2
      // { label: "Actas", to: "/actas", roles: [2] },
      // { label: "Calificaciones", to: "/calificaciones", roles: [2] },
    ],
  },

  /* =========================
     DOCENTE (3)
     ========================= */
  {
    title: "Tribunales",
    roles: [3],
    items: [
      // ✅ lo nuevo que dijimos: todo centrado en tribunales
      { label: "Mis tribunales", to: "/mis-tribunales", roles: [3] },
      { label: "Mi agenda", to: "/mi-agenda", roles: [3] },          // (la creamos luego)
      { label: "Calificar", to: "/calificar", roles: [3] },          // (la mejoramos luego)
      { label: "Actas", to: "/actas", roles: [3] },                  // (puede existir o lo creamos)
      // Si luego quieres: { label: "Historial de calificaciones", to: "/calificaciones", roles: [3] },
    ],
  },
];
