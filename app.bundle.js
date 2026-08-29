// entry.jsx
import React2 from "react";
import { createRoot } from "react-dom/client";

// App.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin,
  Users,
  Plus,
  X,
  Check,
  Settings,
  Sparkles,
  Bell,
  ChevronRight,
  ChevronLeft,
  Phone,
  User,
  Trash2,
  CircleDot,
  Download,
  Pencil
} from "lucide-react";
var DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];
var HORAS = Array.from({ length: 13 }, (_, i) => {
  const totalMin = 9 * 60 + 30 + i * 60;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});
var UMBRAL_PROPUESTA = 8;
var PIN_PANEL_GESTION = "2026";
function localizarActividad(estado, activityId) {
  for (const [sedeId, sede] of Object.entries(estado.sedes)) {
    for (const [dia, porHora] of Object.entries(sede.activas || {})) {
      for (const [hora, lista] of Object.entries(porHora)) {
        const found = lista.find((a) => a.id === activityId);
        if (found)
          return {
            sedeId: Number(sedeId),
            sedeNombre: sede.nombre,
            dia,
            hora,
            nombre: found.nivel ? `${found.nombre} · ${found.nivel}` : found.nombre,
            tipo: "activa"
          };
      }
    }
    for (const [dia, porHora] of Object.entries(sede.propuestas || {})) {
      for (const [hora, lista] of Object.entries(porHora)) {
        const found = lista.find((a) => a.id === activityId);
        if (found)
          return { sedeId: Number(sedeId), sedeNombre: sede.nombre, dia, hora, nombre: found.nombre, tipo: "propuesta" };
      }
    }
  }
  return null;
}
function localizarObjetoActivo(estado, activityId) {
  for (const [sedeId, sede] of Object.entries(estado.sedes)) {
    for (const [dia, porHora] of Object.entries(sede.activas || {})) {
      for (const [hora, lista] of Object.entries(porHora)) {
        const idx = lista.findIndex((a) => a.id === activityId);
        if (idx !== -1) return { sedeId: Number(sedeId), dia, hora, act: lista[idx] };
      }
    }
  }
  return null;
}
var uid = () => Math.random().toString(36).slice(2, 10);
function horaAMinutos(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}
function finDeActividadMin(horaInicio, act) {
  return act.horaFin ? horaAMinutos(act.horaFin) : horaAMinutos(horaInicio) + 60;
}
function estaCubiertaPorOtraClase(hora, activasDia) {
  const minutos = horaAMinutos(hora);
  return Object.entries(activasDia || {}).some(([horaClave, lista]) => {
    if (horaClave === hora) return false;
    return lista.some((act) => minutos >= horaAMinutos(horaClave) && minutos < finDeActividadMin(horaClave, act));
  });
}
function minutosAHora(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function horasDisponiblesDeSala(ventanas) {
  const horas = /* @__PURE__ */ new Set();
  (ventanas || []).forEach(({ inicio, fin }) => {
    let actual = horaAMinutos(inicio);
    const finMin = horaAMinutos(fin);
    while (actual + 60 <= finMin) {
      horas.add(minutosAHora(actual));
      actual += 60;
    }
  });
  return horas;
}
function filtrarPorSala(porHora, sala) {
  const resultado = {};
  Object.entries(porHora || {}).forEach(([h, lista]) => {
    const filtrada = (lista || []).filter((x) => x.sala === sala);
    if (filtrada.length) resultado[h] = filtrada;
  });
  return resultado;
}
function telefonoValido(tel) {
  const limpio = (tel || "").trim();
  if (!/^\+?[0-9\s\-()]+$/.test(limpio)) return false;
  const digitos = limpio.replace(/\D/g, "");
  return digitos.length >= 9;
}
function telefonoParaWhatsApp(tel) {
  let digitos = (tel || "").replace(/\D/g, "");
  if (digitos.length === 9) digitos = "34" + digitos;
  if (digitos.startsWith("0034")) digitos = digitos.slice(2);
  return digitos;
}
function codificarParaUrl(texto) {
  return encodeURIComponent(texto).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function enlaceWhatsApp(telefono, mensaje) {
  const numero = telefonoParaWhatsApp(telefono);
  return `https://wa.me/${numero}?text=${codificarParaUrl(mensaje)}`;
}
function enviarAvisoEmail(aviso) {
  fetch("/api/avisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ aviso })
  }).catch(() => {
  });
}
function notificar(nuevo, aviso) {
  nuevo.avisos.unshift(aviso);
  enviarAvisoEmail(aviso);
}
function formatearFechaHora(ts) {
  if (!ts) return "";
  const f = new Date(ts);
  const dia = String(f.getDate()).padStart(2, "0");
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const anio = f.getFullYear();
  const horas = String(f.getHours()).padStart(2, "0");
  const min = String(f.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${anio} ${horas}:${min}`;
}
var semillaHorario = () => ({
  Lunes: {
    "11:30": [{ id: uid(), nombre: "Country", nivel: "" }],
    "12:30": [{ id: uid(), nombre: "Pilates", nivel: "" }],
    "18:30": [{ id: uid(), nombre: "Baile en línea", nivel: "" }],
    "19:30": [{ id: uid(), nombre: "Flamenco", nivel: "" }],
    "20:30": [{ id: uid(), nombre: "Bailes de salón", nivel: "" }],
    "21:30": [{ id: uid(), nombre: "Sevillanas", nivel: "" }]
  },
  Martes: {
    "18:30": [{ id: uid(), nombre: "Sevillanas", nivel: "" }],
    "19:30": [{ id: uid(), nombre: "Sevillanas y Flamenco", nivel: "" }],
    "20:30": [{ id: uid(), nombre: "Sevillanas", nivel: "Intensivo" }]
  },
  Miércoles: {
    "10:30": [{ id: uid(), nombre: "Baile en línea", nivel: "" }],
    "11:30": [{ id: uid(), nombre: "Baile en línea", nivel: "" }],
    "12:30": [{ id: uid(), nombre: "Pilates", nivel: "" }],
    "18:30": [{ id: uid(), nombre: "Country", nivel: "Avanzado" }],
    "19:30": [{ id: uid(), nombre: "Sevillanas", nivel: "Avanzado" }],
    "20:30": [{ id: uid(), nombre: "Bailes de salón", nivel: "" }]
  },
  Jueves: {
    "10:30": [{ id: uid(), nombre: "Sevillanas", nivel: "Intermedio" }],
    "18:30": [{ id: uid(), nombre: "Sevillanas", nivel: "Intermedio" }],
    "19:30": [{ id: uid(), nombre: "Flamenco", nivel: "" }],
    "20:30": [{ id: uid(), nombre: "Funny Dance", nivel: "" }]
  },
  Viernes: {
    "11:30": [{ id: uid(), nombre: "Pilates", nivel: "" }],
    "18:30": [{ id: uid(), nombre: "Bailes de salón", nivel: "Avanzado" }],
    "19:30": [{ id: uid(), nombre: "Bailes de salón", nivel: "Iniciación" }],
    "20:30": [{ id: uid(), nombre: "Bailes de salón", nivel: "Intermedio" }]
  },
  Sábado: {},
  Domingo: {}
});
var CATALOGO_INICIAL = [
  "Sevillanas",
  "Flamenco",
  "Bailes de salón",
  "Pilates",
  "Baile en línea",
  "Country",
  "Funny Dance",
  "Ballet",
  "Tai Chi",
  "Zumba"
];
var DISPONIBILIDAD_SEDE1 = {
  Lunes: { __unica__: [{ inicio: "09:30", fin: "22:30" }] },
  Martes: { __unica__: [{ inicio: "09:30", fin: "22:30" }] },
  Miércoles: { __unica__: [{ inicio: "09:30", fin: "22:30" }] },
  Jueves: { __unica__: [{ inicio: "09:30", fin: "22:30" }] },
  Viernes: { __unica__: [{ inicio: "09:30", fin: "22:30" }] },
  Sábado: { __unica__: [] },
  Domingo: { __unica__: [] }
};
var DISPONIBILIDAD_SEDE2 = {
  Lunes: {
    "Sala 1": [{ inicio: "09:00", fin: "14:00" }, { inicio: "17:00", fin: "18:30" }],
    "Sala 2": [{ inicio: "09:00", fin: "14:00" }, { inicio: "17:00", fin: "18:00" }]
  },
  Martes: {
    "Sala 1": [{ inicio: "09:00", fin: "11:00" }, { inicio: "12:00", fin: "19:00" }, { inicio: "21:00", fin: "22:00" }],
    "Sala 2": [{ inicio: "09:00", fin: "17:15" }, { inicio: "18:00", fin: "19:00" }, { inicio: "21:00", fin: "22:00" }]
  },
  Miércoles: {
    "Sala 1": [{ inicio: "09:00", fin: "14:30" }, { inicio: "15:30", fin: "18:30" }],
    "Sala 2": [{ inicio: "09:00", fin: "17:30" }, { inicio: "20:30", fin: "21:30" }]
  },
  Jueves: {
    "Sala 1": [{ inicio: "09:00", fin: "11:00" }, { inicio: "12:00", fin: "18:30" }, { inicio: "20:30", fin: "22:00" }],
    "Sala 2": [{ inicio: "09:00", fin: "17:15" }, { inicio: "21:00", fin: "22:00" }]
  },
  Viernes: {
    "Sala 1": [{ inicio: "09:00", fin: "18:00" }, { inicio: "21:00", fin: "22:00" }],
    "Sala 2": [{ inicio: "09:00", fin: "22:00" }]
  },
  Sábado: { "Sala 1": [], "Sala 2": [] },
  Domingo: { "Sala 1": [], "Sala 2": [] }
};
var estadoInicial = () => ({
  sedes: {
    1: {
      nombre: "Baildanzas",
      direccion: "Calle de los Narcisos, 14",
      activas: semillaHorario(),
      propuestas: {},
      disponibilidad: DISPONIBILIDAD_SEDE1
    },
    2: {
      nombre: "Baildanzas",
      direccion: "Calle de Víctor de la Serna, 37",
      activas: {},
      propuestas: {},
      salas: ["Sala 1", "Sala 2"],
      disponibilidad: DISPONIBILIDAD_SEDE2
    }
  },
  interesados: {},
  // { activityId: [{nombre, telefono, ts}] }
  avisos: [],
  // { id, sedeId, dia, hora, nombre, tipo, ts, resuelto }
  catalogoActividades: CATALOGO_INICIAL,
  sugerencias: [],
  // { id, sedeId, dia, hora, nombre, personas, ts, estado: 'pendiente'|'aprobada'|'rechazada' }
  listaEspera: {},
  // { activityId: [{nombre, telefono, ts}] } — gente que se apuntó cuando ya no había cupo
  vistoPropuestas: {},
  // { sedeId: timestamp de la última vez que el equipo entró a la pestaña Propuestas }
  historialConversiones: []
  // { id, sedeId, dia, hora, nombre, personas, ts } — copia de seguridad de propuestas convertidas en clase
});
var SUPABASE_URL = "https://gaubtsrveezvupuytijz.supabase.co";
var SUPABASE_KEY = "sb_publishable_n0jcPvKzJvzxjKAAG9R4Tw_IF_B6s6s";
async function cargarEstado() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/estado_app?id=eq.1&select=datos`, {
      headers: { apikey: SUPABASE_KEY }
    });
    if (!res.ok) return { datos: null, error: true };
    const filas = await res.json();
    if (filas && filas[0] && filas[0].datos && Object.keys(filas[0].datos).length > 0) {
      return { datos: filas[0].datos, error: false };
    }
    return { datos: null, error: false };
  } catch (e) {
    console.error("No se pudo leer el estado", e);
    return { datos: null, error: true };
  }
}
async function guardarEstado(estado) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/estado_app?id=eq.1`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ datos: estado, actualizado_en: (/* @__PURE__ */ new Date()).toISOString() })
    });
    return res.ok;
  } catch (e) {
    console.error("No se pudo guardar", e);
    return false;
  }
}
function contarInteresados(estado, activityId) {
  return (estado.interesados[activityId] || []).length;
}
function Baildanzas() {
  const [estado, setEstado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sedeId, setSedeId] = useState(1);
  const [diaIdx, setDiaIdx] = useState(0);
  const [salaSeleccionada, setSalaSeleccionada] = useState("Sala 1");
  const [modal, setModal] = useState(null);
  const [panelGestion, setPanelGestion] = useState(false);
  const [panelDesbloqueado, setPanelDesbloqueado] = useState(false);
  const [toast, setToast] = useState(null);
  const [errorCarga, setErrorCarga] = useState(false);
  useEffect(() => {
    (async () => {
      const resultado = await cargarEstado();
      const base = resultado.datos || estadoInicial();
      if (!base.catalogoActividades) base.catalogoActividades = CATALOGO_INICIAL;
      if (!base.sugerencias) base.sugerencias = [];
      if (!base.listaEspera) base.listaEspera = {};
      if (!base.vistoPropuestas) base.vistoPropuestas = {};
      if (!base.historialConversiones) base.historialConversiones = [];
      if (base.sedes[2] && !base.sedes[2].salas) {
        base.sedes[2].salas = ["Sala 1", "Sala 2"];
        base.sedes[2].disponibilidad = DISPONIBILIDAD_SEDE2;
      }
      if (base.sedes[1] && !base.sedes[1].disponibilidad) {
        base.sedes[1].disponibilidad = DISPONIBILIDAD_SEDE1;
      }
      if (base.sedes[1] && !base.sedes[1].direccion) {
        if (base.sedes[1].nombre === "Baildanzas I" || base.sedes[1].nombre === "Baildanzas Calle de los Narcisos, 14") {
          base.sedes[1].nombre = "Baildanzas";
        }
        base.sedes[1].direccion = "Calle de los Narcisos, 14";
      }
      if (base.sedes[2] && !base.sedes[2].direccion) {
        if (base.sedes[2].nombre === "Baildanzas II" || base.sedes[2].nombre === "Calle de Víctor de la Serna, 37") {
          base.sedes[2].nombre = "Baildanzas";
        }
        base.sedes[2].direccion = "Calle de Víctor de la Serna, 37";
      }
      setEstado(base);
      setCargando(false);
      if (resultado.error) setErrorCarga(true);
    })();
  }, []);
  const persistir = useCallback((nuevo) => {
    setEstado(nuevo);
    guardarEstado(nuevo).then((ok) => {
      if (!ok) {
        mostrarToast("⚠️ No se pudo guardar. Comprueba tu conexión e inténtalo de nuevo.");
      }
    });
  }, []);
  const mostrarToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 9600);
  };
  if (cargando || !estado) {
    return /* @__PURE__ */ React.createElement("div", { style: { background: PAL.papel }, className: "min-h-screen flex items-center justify-center" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-2xl italic animate-pulse" }, "Preparando el compás…"), /* @__PURE__ */ React.createElement(FontImport, null));
  }
  const diasVisibles = DIAS;
  const dia = diasVisibles[diaIdx % diasVisibles.length];
  const sede = estado.sedes[sedeId];
  const unirseAActiva = (personas) => {
    const nuevo = structuredClone(estado);
    const info = modal;
    const loc = localizarObjetoActivo(nuevo, info.activityId);
    const cupo = loc?.act?.cupo;
    const forzado = loc?.act?.forzarCompleto;
    if (!nuevo.interesados[info.activityId]) nuevo.interesados[info.activityId] = [];
    if (!nuevo.listaEspera[info.activityId]) nuevo.listaEspera[info.activityId] = [];
    const yaInscritos = nuevo.interesados[info.activityId].length;
    let confirmadas = personas;
    let enEspera = [];
    if (forzado) {
      confirmadas = [];
      enEspera = personas;
    } else if (cupo != null) {
      const huecosLibres = Math.max(cupo - yaInscritos, 0);
      confirmadas = personas.slice(0, huecosLibres);
      enEspera = personas.slice(huecosLibres);
    }
    confirmadas.forEach((p) => nuevo.interesados[info.activityId].push({ ...p, ts: Date.now() }));
    enEspera.forEach((p) => nuevo.listaEspera[info.activityId].push({ ...p, ts: Date.now() }));
    if (confirmadas.length > 0) {
      notificar(nuevo, {
        id: uid(),
        sedeId,
        dia: info.dia,
        hora: info.hora,
        nombre: info.nombreActividad,
        tipo: confirmadas.length > 1 ? `${confirmadas.length} personas nuevas interesadas en clase activa` : "Nueva persona interesada en clase activa",
        contactos: confirmadas,
        ts: Date.now(),
        resuelto: false
      });
    }
    if (enEspera.length > 0) {
      notificar(nuevo, {
        id: uid(),
        sedeId,
        dia: info.dia,
        hora: info.hora,
        nombre: info.nombreActividad,
        tipo: enEspera.length > 1 ? `${enEspera.length} personas en lista de espera (aforo completo)` : "Nueva persona en lista de espera (aforo completo)",
        contactos: enEspera,
        ts: Date.now(),
        resuelto: false
      });
    }
    persistir(nuevo);
    if (enEspera.length === 0) {
      mostrarToast(
        confirmadas.length > 1 ? `¡Genial! Apuntadas ${confirmadas.length} personas. Os avisaremos para confirmar plaza.` : `¡Genial, ${confirmadas[0].nombre}! Te avisaremos en cuanto confirmemos plaza.`
      );
    } else {
      const posicionFinal = nuevo.listaEspera[info.activityId].length;
      const posicionInicial = posicionFinal - enEspera.length + 1;
      const rango = enEspera.length > 1 ? `${posicionInicial} a ${posicionFinal}` : `${posicionFinal}`;
      if (confirmadas.length === 0) {
        mostrarToast(
          enEspera.length > 1 ? `Clase completa. Estáis en la lista de espera, en las posiciones ${rango}. Os avisaremos si se libera un hueco.` : `Clase completa. Estás en la lista de espera, en la posición ${rango}. Te avisaremos si se libera un hueco.`
        );
      } else {
        mostrarToast(
          `¡Apuntados ${confirmadas.length}! Los ${enEspera.length} restantes quedan en la lista de espera, en las posiciones ${rango}.`
        );
      }
    }
    setModal(null);
  };
  const unirseAPropuesta = (personas) => {
    const nuevo = structuredClone(estado);
    const info = modal;
    if (!nuevo.interesados[info.activityId]) nuevo.interesados[info.activityId] = [];
    const antes = nuevo.interesados[info.activityId].length;
    personas.forEach((p) => nuevo.interesados[info.activityId].push({ ...p, ts: Date.now() }));
    const despues = nuevo.interesados[info.activityId].length;
    if (antes < UMBRAL_PROPUESTA && despues >= UMBRAL_PROPUESTA) {
      notificar(nuevo, {
        id: uid(),
        sedeId,
        dia: info.dia,
        hora: info.hora,
        nombre: info.nombreActividad,
        tipo: `¡Umbral alcanzado! (${despues} personas)`,
        contactos: nuevo.interesados[info.activityId],
        ts: Date.now(),
        resuelto: false
      });
      mostrarToast(`¡Sois ${despues}! Avisaremos al equipo para organizar la clase.`);
    } else {
      mostrarToast(
        `¡Apuntados! Sois ${despues} de ${UMBRAL_PROPUESTA} para que la clase arranque.`
      );
    }
    persistir(nuevo);
    setModal(null);
  };
  const proponerYSugerir = (listaActividades, listaSugerencias, personas) => {
    const nuevo = structuredClone(estado);
    const info = modal;
    if (listaActividades.length > 0) {
      if (!nuevo.sedes[sedeId].propuestas[info.dia]) nuevo.sedes[sedeId].propuestas[info.dia] = {};
      if (!nuevo.sedes[sedeId].propuestas[info.dia][info.hora])
        nuevo.sedes[sedeId].propuestas[info.dia][info.hora] = [];
      const propuestasDelHueco = nuevo.sedes[sedeId].propuestas[info.dia][info.hora];
      listaActividades.forEach((nombreActividad) => {
        const existente = propuestasDelHueco.find(
          (p) => p.nombre.trim().toLowerCase() === nombreActividad.trim().toLowerCase() && p.sala === info.sala
        );
        if (existente) {
          if (!nuevo.interesados[existente.id]) nuevo.interesados[existente.id] = [];
          const antes = nuevo.interesados[existente.id].length;
          personas.forEach((p) => nuevo.interesados[existente.id].push({ ...p, ts: Date.now() }));
          const despues = nuevo.interesados[existente.id].length;
          if (antes < UMBRAL_PROPUESTA && despues >= UMBRAL_PROPUESTA) {
            notificar(nuevo, {
              id: uid(),
              sedeId,
              dia: info.dia,
              hora: info.hora,
              nombre: existente.nombre,
              tipo: `¡Umbral alcanzado! (${despues} personas)`,
              contactos: nuevo.interesados[existente.id],
              ts: Date.now(),
              resuelto: false
            });
          }
        } else {
          const nuevaPropuesta = { id: uid(), nombre: nombreActividad, sala: info.sala };
          propuestasDelHueco.push(nuevaPropuesta);
          nuevo.interesados[nuevaPropuesta.id] = personas.map((p) => ({ ...p, ts: Date.now() }));
          notificar(nuevo, {
            id: uid(),
            sedeId,
            dia: info.dia,
            hora: info.hora,
            nombre: nombreActividad,
            tipo: "Nueva propuesta de actividad",
            contactos: nuevo.interesados[nuevaPropuesta.id],
            ts: Date.now(),
            resuelto: false
          });
        }
      });
    }
    if (listaSugerencias.length > 0) {
      listaSugerencias.forEach((nombreActividad) => {
        nuevo.sugerencias.unshift({
          id: uid(),
          sedeId,
          dia: info.dia,
          hora: info.hora,
          nombre: nombreActividad,
          sala: info.sala,
          personas,
          ts: Date.now(),
          estado: "pendiente"
        });
      });
    }
    persistir(nuevo);
    const partes = [];
    if (listaActividades.length > 0) partes.push(`${listaActividades.length} propuesta${listaActividades.length > 1 ? "s" : ""}`);
    if (listaSugerencias.length > 0) partes.push(`${listaSugerencias.length} sugerencia${listaSugerencias.length > 1 ? "s" : ""} pendiente${listaSugerencias.length > 1 ? "s" : ""} de aprobar`);
    mostrarToast(`¡Listo! ${partes.join(" y ")} registradas para ${personas.length} persona${personas.length > 1 ? "s" : ""}.`);
    setModal(null);
  };
  const resolverAviso = (avisoId) => {
    const nuevo = structuredClone(estado);
    nuevo.avisos = nuevo.avisos.map((a) => a.id === avisoId ? { ...a, resuelto: true } : a);
    persistir(nuevo);
  };
  const anadirActividadBase = (dia2, hora, nombreActividad, nivel, cupo, horaFin, sala) => {
    const nuevo = structuredClone(estado);
    if (!nuevo.sedes[sedeId].activas[dia2]) nuevo.sedes[sedeId].activas[dia2] = {};
    if (!nuevo.sedes[sedeId].activas[dia2][hora]) nuevo.sedes[sedeId].activas[dia2][hora] = [];
    nuevo.sedes[sedeId].activas[dia2][hora].push({
      id: uid(),
      nombre: nombreActividad,
      nivel: nivel || "",
      cupo: cupo || void 0,
      horaFin: horaFin || void 0,
      sala: sala || void 0
    });
    persistir(nuevo);
    mostrarToast(
      `¡Añadido! "${nombreActividad}" el ${dia2.toLowerCase()} a las ${hora}${horaFin ? `–${horaFin}` : ""}${sala ? ` (${sala})` : ""} en ${nuevo.sedes[sedeId].nombre}.`
    );
  };
  const editarCupoActividad = (dia2, hora, activityId, nuevoCupo) => {
    const nuevo = structuredClone(estado);
    const lista = nuevo.sedes[sedeId].activas[dia2]?.[hora] || [];
    const act = lista.find((a) => a.id === activityId);
    if (act) act.cupo = nuevoCupo || void 0;
    persistir(nuevo);
  };
  const alternarForzarCompleto = (dia2, hora, activityId) => {
    const nuevo = structuredClone(estado);
    const lista = nuevo.sedes[sedeId].activas[dia2]?.[hora] || [];
    const act = lista.find((a) => a.id === activityId);
    if (act) act.forzarCompleto = !act.forzarCompleto;
    persistir(nuevo);
  };
  const editarDisponibilidad = (dia2, claveSala, ventanas) => {
    const nuevo = structuredClone(estado);
    if (!nuevo.sedes[sedeId].disponibilidad) nuevo.sedes[sedeId].disponibilidad = {};
    if (!nuevo.sedes[sedeId].disponibilidad[dia2]) nuevo.sedes[sedeId].disponibilidad[dia2] = {};
    nuevo.sedes[sedeId].disponibilidad[dia2][claveSala] = ventanas;
    persistir(nuevo);
  };
  const renombrarSede = (nuevoNombre) => {
    if (!nuevoNombre.trim()) return;
    const nuevo = structuredClone(estado);
    nuevo.sedes[sedeId].nombre = nuevoNombre.trim();
    persistir(nuevo);
  };
  const editarDireccionSede = (nuevaDireccion) => {
    const nuevo = structuredClone(estado);
    nuevo.sedes[sedeId].direccion = nuevaDireccion.trim();
    persistir(nuevo);
  };
  const borrarActividadBase = (dia2, hora, activityId) => {
    const nuevo = structuredClone(estado);
    nuevo.sedes[sedeId].activas[dia2][hora] = nuevo.sedes[sedeId].activas[dia2][hora].filter(
      (a) => a.id !== activityId
    );
    persistir(nuevo);
  };
  const editarClaseFija = (diaViejo, horaVieja, activityId, cambios) => {
    const nuevo = structuredClone(estado);
    const listaVieja = nuevo.sedes[sedeId].activas[diaViejo]?.[horaVieja] || [];
    const idx = listaVieja.findIndex((a) => a.id === activityId);
    if (idx === -1) return;
    const act = listaVieja[idx];
    const actualizada = {
      ...act,
      nombre: cambios.nombre.trim(),
      nivel: cambios.nivel.trim(),
      sala: cambios.sala || void 0
    };
    listaVieja.splice(idx, 1);
    if (!nuevo.sedes[sedeId].activas[cambios.dia]) nuevo.sedes[sedeId].activas[cambios.dia] = {};
    if (!nuevo.sedes[sedeId].activas[cambios.dia][cambios.hora]) nuevo.sedes[sedeId].activas[cambios.dia][cambios.hora] = [];
    nuevo.sedes[sedeId].activas[cambios.dia][cambios.hora].push(actualizada);
    persistir(nuevo);
  };
  const aprobarSugerencia = (sugerenciaId) => {
    const nuevo = structuredClone(estado);
    const s = nuevo.sugerencias.find((x) => x.id === sugerenciaId);
    if (!s) return;
    s.estado = "aprobada";
    if (!nuevo.sedes[s.sedeId].propuestas[s.dia]) nuevo.sedes[s.sedeId].propuestas[s.dia] = {};
    if (!nuevo.sedes[s.sedeId].propuestas[s.dia][s.hora]) nuevo.sedes[s.sedeId].propuestas[s.dia][s.hora] = [];
    const propuestasDelHueco = nuevo.sedes[s.sedeId].propuestas[s.dia][s.hora];
    const existente = propuestasDelHueco.find(
      (p) => p.nombre.trim().toLowerCase() === s.nombre.trim().toLowerCase() && p.sala === s.sala
    );
    let idPropuesta, totalInteresados;
    if (existente) {
      if (!nuevo.interesados[existente.id]) nuevo.interesados[existente.id] = [];
      s.personas.forEach((p) => nuevo.interesados[existente.id].push({ ...p, ts: Date.now() }));
      idPropuesta = existente.id;
      totalInteresados = nuevo.interesados[idPropuesta].length;
    } else {
      const nuevaPropuesta = { id: uid(), nombre: s.nombre, sala: s.sala };
      propuestasDelHueco.push(nuevaPropuesta);
      nuevo.interesados[nuevaPropuesta.id] = s.personas.map((p) => ({ ...p, ts: Date.now() }));
      idPropuesta = nuevaPropuesta.id;
      totalInteresados = nuevo.interesados[idPropuesta].length;
    }
    if (totalInteresados >= UMBRAL_PROPUESTA) {
      notificar(nuevo, {
        id: uid(),
        sedeId: s.sedeId,
        dia: s.dia,
        hora: s.hora,
        nombre: s.nombre,
        tipo: `¡Umbral alcanzado! (${totalInteresados} personas)`,
        contactos: nuevo.interesados[idPropuesta],
        ts: Date.now(),
        resuelto: false
      });
    }
    const nombreLimpio = s.nombre.trim();
    if (!nuevo.catalogoActividades.includes(nombreLimpio)) {
      nuevo.catalogoActividades = [...nuevo.catalogoActividades, nombreLimpio];
    }
    persistir(nuevo);
  };
  const rechazarSugerencia = (sugerenciaId) => {
    const nuevo = structuredClone(estado);
    nuevo.sugerencias = nuevo.sugerencias.map(
      (s) => s.id === sugerenciaId ? { ...s, estado: "rechazada" } : s
    );
    persistir(nuevo);
  };
  const anadirAlCatalogo = (nombreActividad) => {
    const nuevo = structuredClone(estado);
    if (!nuevo.catalogoActividades.includes(nombreActividad)) {
      nuevo.catalogoActividades = [...nuevo.catalogoActividades, nombreActividad];
      persistir(nuevo);
    }
  };
  const borrarDelCatalogo = (nombreActividad) => {
    const nuevo = structuredClone(estado);
    nuevo.catalogoActividades = nuevo.catalogoActividades.filter((a) => a !== nombreActividad);
    persistir(nuevo);
  };
  const buscarInteresado = (texto) => {
    const q = texto.trim().toLowerCase();
    if (!q) return [];
    const qTelefono = q.replace(/\s+/g, "");
    const resultados = [];
    Object.entries(estado.interesados).forEach(([activityId, personas]) => {
      personas.forEach((p, idx) => {
        const coincideTelefono = (p.telefono || "").replace(/\s+/g, "").includes(qTelefono);
        const coincideNombre = (p.nombre || "").toLowerCase().includes(q);
        if (coincideTelefono || coincideNombre) {
          const loc = localizarActividad(estado, activityId);
          if (loc) resultados.push({ activityId, idxPersona: idx, persona: p, origen: "interesados", ...loc });
        }
      });
    });
    Object.entries(estado.listaEspera).forEach(([activityId, personas]) => {
      personas.forEach((p, idx) => {
        const coincideTelefono = (p.telefono || "").replace(/\s+/g, "").includes(qTelefono);
        const coincideNombre = (p.nombre || "").toLowerCase().includes(q);
        if (coincideTelefono || coincideNombre) {
          const loc = localizarActividad(estado, activityId);
          if (loc) resultados.push({ activityId, idxPersona: idx, persona: p, origen: "espera", ...loc, tipo: "espera" });
        }
      });
    });
    return resultados;
  };
  const quitarInteresado = (activityId, idxPersona, origen = "interesados") => {
    const nuevo = structuredClone(estado);
    if (origen === "espera") {
      if (!nuevo.listaEspera[activityId]) return;
      nuevo.listaEspera[activityId].splice(idxPersona, 1);
      persistir(nuevo);
      mostrarToast("Baja de la lista de espera correcta.");
      return;
    }
    if (!nuevo.interesados[activityId]) return;
    nuevo.interesados[activityId].splice(idxPersona, 1);
    const loc = localizarActividad(nuevo, activityId);
    if (loc && loc.tipo === "propuesta" && nuevo.interesados[activityId].length === 0) {
      nuevo.sedes[loc.sedeId].propuestas[loc.dia][loc.hora] = nuevo.sedes[loc.sedeId].propuestas[loc.dia][loc.hora].filter((p) => p.id !== activityId);
      delete nuevo.interesados[activityId];
    }
    let promocionado = null;
    if (loc && loc.tipo === "activa" && (nuevo.listaEspera[activityId] || []).length > 0) {
      const objActivo = localizarObjetoActivo(nuevo, activityId);
      const cupo = objActivo?.act?.cupo;
      if (cupo == null || nuevo.interesados[activityId].length < cupo) {
        promocionado = nuevo.listaEspera[activityId].shift();
        nuevo.interesados[activityId].push({ ...promocionado, ts: Date.now() });
        notificar(nuevo, {
          id: uid(),
          sedeId: loc.sedeId,
          dia: loc.dia,
          hora: loc.hora,
          nombre: loc.nombre,
          tipo: "Se liberó un hueco: promocionada desde lista de espera",
          contactos: [promocionado],
          ts: Date.now(),
          resuelto: false
        });
      }
    }
    persistir(nuevo);
    mostrarToast(
      promocionado ? `Baja hecha. ${promocionado.nombre} pasa de la lista de espera a apuntado/a — avísale.` : "Inscripción dada de baja correctamente."
    );
  };
  const exportarCopiaSeguridad = () => {
    const contenido = JSON.stringify(estado, null, 2);
    const blob = new Blob([contenido], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const fecha = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `baildanzas-copia-${fecha}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };
  const marcarPropuestasVistas = () => {
    const nuevo = structuredClone(estado);
    nuevo.vistoPropuestas[sedeId] = Date.now();
    persistir(nuevo);
  };
  const convertirEnClaseActiva = (dia2, hora, propuestaId, nombreActividad, sala) => {
    const nuevo = structuredClone(estado);
    const personasTransferidas = nuevo.interesados[propuestaId] || [];
    nuevo.historialConversiones.unshift({
      id: uid(),
      sedeId,
      dia: dia2,
      hora,
      nombre: nombreActividad,
      personas: personasTransferidas,
      ts: Date.now()
    });
    nuevo.sedes[sedeId].propuestas[dia2][hora] = (nuevo.sedes[sedeId].propuestas[dia2][hora] || []).filter(
      (p) => p.id !== propuestaId
    );
    delete nuevo.interesados[propuestaId];
    if (!nuevo.sedes[sedeId].activas[dia2]) nuevo.sedes[sedeId].activas[dia2] = {};
    if (!nuevo.sedes[sedeId].activas[dia2][hora]) nuevo.sedes[sedeId].activas[dia2][hora] = [];
    const nuevaActivaId = uid();
    nuevo.sedes[sedeId].activas[dia2][hora].push({ id: nuevaActivaId, nombre: nombreActividad, nivel: "", cupo: void 0, sala: sala || void 0 });
    nuevo.interesados[nuevaActivaId] = personasTransferidas;
    persistir(nuevo);
    mostrarToast(
      personasTransferidas.length > 0 ? `¡Hecho! "${nombreActividad}" ya es una clase activa, con ${personasTransferidas.length} alumnos ya apuntados.` : `¡Hecho! "${nombreActividad}" ya es una clase activa los ${dia2.toLowerCase()} a las ${hora}.`
    );
  };
  const anadirAlumnoActiva = (dia2, hora, activityId, nombre, telefono) => {
    const nuevo = structuredClone(estado);
    if (!nuevo.interesados[activityId]) nuevo.interesados[activityId] = [];
    nuevo.interesados[activityId].push({ nombre, telefono, ts: Date.now() });
    persistir(nuevo);
    mostrarToast(`${nombre} añadido/a a la clase.`);
  };
  const fusionarPropuestas = (dia2, hora, idPrincipal, idASumar) => {
    const nuevo = structuredClone(estado);
    const lista = nuevo.sedes[sedeId].propuestas[dia2]?.[hora];
    if (!lista) return;
    if (!nuevo.interesados[idPrincipal]) nuevo.interesados[idPrincipal] = [];
    const personasASumar = nuevo.interesados[idASumar] || [];
    nuevo.interesados[idPrincipal].push(...personasASumar);
    delete nuevo.interesados[idASumar];
    nuevo.sedes[sedeId].propuestas[dia2][hora] = lista.filter((p) => p.id !== idASumar);
    persistir(nuevo);
    mostrarToast("Propuestas fusionadas.");
  };
  const editarInteresado = (activityId, idxPersona, origen, nuevoNombre, nuevoTelefono) => {
    const nuevo = structuredClone(estado);
    const coleccion = origen === "espera" ? nuevo.listaEspera : nuevo.interesados;
    if (!coleccion[activityId] || !coleccion[activityId][idxPersona]) return;
    coleccion[activityId][idxPersona] = {
      ...coleccion[activityId][idxPersona],
      nombre: nuevoNombre,
      telefono: nuevoTelefono
    };
    persistir(nuevo);
    mostrarToast("Datos corregidos.");
  };
  const avisosSinResolver = estado.avisos.filter((a) => a.sedeId === sedeId && !a.resuelto);
  return /* @__PURE__ */ React.createElement("div", { style: { background: PAL.papel, fontFamily: FONT.body, color: PAL.tinta }, className: "min-h-screen pb-24" }, /* @__PURE__ */ React.createElement(FontImport, null), /* @__PURE__ */ React.createElement(
    Cabecera,
    {
      sedeId,
      setSedeId: (id) => {
        setSedeId(id);
        if (id === 1 && diaIdx > 4) setDiaIdx(0);
      },
      sedes: estado.sedes,
      avisos: avisosSinResolver.length,
      onGestion: () => setPanelGestion(true)
    }
  ), /* @__PURE__ */ React.createElement(SelectorDia, { dia, diaIdx, setDiaIdx, dias: diasVisibles }), sede.salas && /* @__PURE__ */ React.createElement(SelectorSala, { salas: sede.salas, salaSeleccionada, setSalaSeleccionada }), /* @__PURE__ */ React.createElement("main", { className: "max-w-2xl mx-auto px-4 mt-6 space-y-3" }, (() => {
    const sala = sede.salas ? salaSeleccionada : null;
    const activasDia = sala ? filtrarPorSala(sede.activas[dia], sala) : sede.activas[dia] || {};
    const propuestasDia = sala ? filtrarPorSala(sede.propuestas[dia], sala) : sede.propuestas[dia] || {};
    const claveSala = sala || "__unica__";
    const horasBase = horasDisponiblesDeSala(sede.disponibilidad?.[dia]?.[claveSala]);
    const horas = Array.from(/* @__PURE__ */ new Set([...horasBase, ...Object.keys(activasDia), ...Object.keys(propuestasDia)])).filter((hora) => {
      const tieneActivas = (activasDia[hora] || []).length > 0;
      const tienePropuestas = (propuestasDia[hora] || []).length > 0;
      if (tieneActivas || tienePropuestas) return true;
      return !estaCubiertaPorOtraClase(hora, activasDia);
    }).sort();
    if (sala && horas.length === 0) {
      return /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-sm text-center py-10" }, "Este día, ", sala.toLowerCase(), " está cerrada.");
    }
    return horas.map((hora) => /* @__PURE__ */ React.createElement(
      FilaHora,
      {
        key: hora,
        hora,
        dia,
        activas: activasDia[hora] || [],
        propuestas: propuestasDia[hora] || [],
        estado,
        onAbrirModal: (payload) => setModal(sala ? { ...payload, sala } : payload)
      }
    ));
  })()), modal && /* @__PURE__ */ React.createElement(
    ModalHueco,
    {
      info: modal,
      estado,
      catalogo: estado.catalogoActividades,
      onCerrar: () => setModal(null),
      onUnirseActiva: unirseAActiva,
      onUnirsePropuesta: unirseAPropuesta,
      onEnviarHueco: proponerYSugerir
    }
  ), panelGestion && !panelDesbloqueado && /* @__PURE__ */ React.createElement(
    CandadoPIN,
    {
      onCerrar: () => setPanelGestion(false),
      onDesbloquear: () => setPanelDesbloqueado(true)
    }
  ), panelGestion && panelDesbloqueado && /* @__PURE__ */ React.createElement(
    PanelGestion,
    {
      sedeId,
      sede,
      sedes: estado.sedes,
      onCambiarSede: setSedeId,
      avisos: estado.avisos.filter((a) => a.sedeId === sedeId),
      sugerencias: estado.sugerencias.filter((s) => s.sedeId === sedeId),
      catalogo: estado.catalogoActividades,
      onCerrar: () => {
        setPanelGestion(false);
        setPanelDesbloqueado(false);
      },
      onResolver: resolverAviso,
      onAnadir: anadirActividadBase,
      onEditarCupo: editarCupoActividad,
      onAlternarForzarCompleto: alternarForzarCompleto,
      onEditarDisponibilidad: editarDisponibilidad,
      onEditarClaseFija: editarClaseFija,
      onRenombrarSede: renombrarSede,
      onEditarDireccionSede: editarDireccionSede,
      onBorrar: borrarActividadBase,
      onAprobarSugerencia: aprobarSugerencia,
      onRechazarSugerencia: rechazarSugerencia,
      onAnadirCatalogo: anadirAlCatalogo,
      onBorrarCatalogo: borrarDelCatalogo,
      onBuscarInteresado: buscarInteresado,
      onQuitarInteresado: quitarInteresado,
      onEditarInteresado: editarInteresado,
      onFusionarPropuestas: fusionarPropuestas,
      onConvertirEnActiva: convertirEnClaseActiva,
      onAnadirAlumno: anadirAlumnoActiva,
      interesados: estado.interesados,
      vistoPropuestasTs: estado.vistoPropuestas[sedeId] || 0,
      onMarcarPropuestasVistas: marcarPropuestasVistas,
      onExportar: exportarCopiaSeguridad
    }
  ), toast && /* @__PURE__ */ React.createElement(Toast, { mensaje: toast }), errorCarga && /* @__PURE__ */ React.createElement(
    BannerError,
    {
      mensaje: "No se pudieron cargar los últimos cambios guardados. Puede que veas información desactualizada.",
      onRecargar: () => window.location.reload(),
      onCerrar: () => setErrorCarga(false)
    }
  ));
}
var PAL = {
  papel: "#FBF3E7",
  tinta: "#241E31",
  morado: "#6B3FA0",
  moradoOscuro: "#552F82",
  carmin: "#B23A48",
  carminOscuro: "#8E2C38",
  petroleo: "#2E9E68",
  mostaza: "#E0A73E",
  verde: "#4C8C5C",
  linea: "#E4D5BE",
  blanco: "#FFFDF9"
};
var FONT = {
  display: "'Fraunces', serif",
  body: "'Work Sans', sans-serif",
  mono: "'Space Mono', monospace"
};
function FontImport() {
  return /* @__PURE__ */ React.createElement("style", null, `
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500;1,9..144,600&family=Work+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      :root { color-scheme: light; }
      input, select, textarea {
        color-scheme: light;
        color: #241E31 !important;
        background-color: #FFFDF9 !important;
        -webkit-text-fill-color: #241E31 !important;
        caret-color: #241E31;
      }
      input::placeholder, textarea::placeholder {
        color: #241E31;
        opacity: 0.6;
        -webkit-text-fill-color: #241E31;
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
      }
    `);
}
function Cabecera({ sedeId, setSedeId, sedes, avisos, onGestion }) {
  const [mostrarComoFunciona, setMostrarComoFunciona] = useState(false);
  return /* @__PURE__ */ React.createElement("header", { style: { borderBottom: `1px solid ${PAL.linea}` }, className: "pt-8 pb-5" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
    "img",
    {
      src: "data:image/png;base64,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",
      alt: "Baildanzas — Escuela de Danza y Arte",
      className: "h-14 w-auto object-contain"
    }
  ), /* @__PURE__ */ React.createElement(
    "p",
    {
      style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.76 },
      className: "text-[13px] uppercase tracking-[0.18em] mt-1.5"
    },
    "Elige tu ritmo · elige tu horario"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setMostrarComoFunciona(true),
      style: { fontFamily: FONT.body, color: PAL.morado },
      className: "text-xs underline mt-1.5"
    },
    "¿Cómo funciona?"
  )), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: onGestion,
      title: "Panel de gestión",
      style: { color: PAL.tinta, opacity: 0.65 },
      className: "p-2 hover:opacity-90 transition-opacity relative"
    },
    /* @__PURE__ */ React.createElement(Settings, { size: 18 }),
    avisos > 0 && /* @__PURE__ */ React.createElement(
      "span",
      {
        style: { background: PAL.carmin },
        className: "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center"
      },
      avisos
    )
  )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, className: "mt-6" }, Object.entries(sedes).map(([id, s]) => {
    const activo = Number(id) === sedeId;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        onClick: () => setSedeId(Number(id)),
        style: {
          fontFamily: FONT.mono,
          background: activo ? PAL.petroleo : "transparent",
          color: activo ? PAL.papel : PAL.petroleo,
          border: `1px solid ${PAL.petroleo}`,
          display: "flex",
          alignItems: "center",
          gap: 6
        },
        className: "px-4 py-2 text-xs uppercase tracking-widest rounded-full transition-colors"
      },
      /* @__PURE__ */ React.createElement(MapPin, { size: 12 }),
      /* @__PURE__ */ React.createElement("span", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 } }, /* @__PURE__ */ React.createElement("span", null, s.nombre), s.direccion && /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.85, fontSize: "13px", textTransform: "none", letterSpacing: "0.01em", fontWeight: 500 } }, s.direccion))
    );
  }))), mostrarComoFunciona && /* @__PURE__ */ React.createElement(ModalComoFunciona, { onCerrar: () => setMostrarComoFunciona(false) }));
}
function ModalComoFunciona({ onCerrar }) {
  const pasos = [
    {
      titulo: "Propón o súmate",
      texto: "Elige un hueco libre y propón la actividad que te apetece, o súmate a una propuesta que ya exista."
    },
    {
      titulo: "Comparte y espera",
      texto: "Cuéntaselo a amigos, o espera a que se vayan apuntando más personas al mismo hueco."
    },
    {
      titulo: "¡Al llegar a 8, arranca!",
      texto: "Cuando lleguéis a 8 personas apuntadas, la clase se confirma y os avisamos con la fecha de la clase de prueba."
    },
    {
      titulo: "Confirma tu asistencia",
      texto: "Nos dices que puedes ir ese día, ¡y nos vemos en Baildanzas!"
    }
  ];
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onCerrar,
      style: { background: "rgba(36,30,49,0.55)", height: "100dvh" },
      className: "fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        style: { background: PAL.papel, border: `1px solid ${PAL.linea}`, maxHeight: "85dvh" },
        className: "w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative overflow-y-auto my-auto sm:my-0"
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onCerrar,
          style: { background: PAL.blanco, color: PAL.tinta, border: `1px solid ${PAL.linea}` },
          className: "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm z-10"
        },
        /* @__PURE__ */ React.createElement(X, { size: 18 })
      ),
      /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-xl font-medium mb-1 pr-8" }, "¿Cómo funciona?"),
      /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.76 }, className: "text-sm mb-5" }, "Las clases no arrancan solas — sois vosotros quienes las hacéis realidad."),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 16 } }, pasos.map((paso, i) => /* @__PURE__ */ React.createElement("div", { key: i, style: { display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-start" } }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            background: PAL.petroleo,
            color: PAL.blanco,
            fontFamily: FONT.mono,
            width: 28,
            height: 28,
            minWidth: 28,
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          },
          className: "text-xs font-medium"
        },
        i + 1
      ), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, fontFamily: FONT.body }, className: "text-sm font-medium" }, paso.titulo), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.85 }, className: "text-sm leading-relaxed" }, paso.texto))))),
      /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.65 }, className: "text-[13px] text-center mt-6" }, '¿Ya hay una clase "en marcha"? Puedes apuntarte directamente, sin esperar a nadie.')
    )
  );
}
function SelectorDia({ dia, diaIdx, setDiaIdx, dias }) {
  return /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 mt-5 flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setDiaIdx((diaIdx + dias.length - 1) % dias.length),
      style: { color: PAL.tinta },
      className: "p-1.5 opacity-50 hover:opacity-100 transition-opacity"
    },
    /* @__PURE__ */ React.createElement(ChevronLeft, { size: 18 })
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-x-auto flex gap-1.5 no-scrollbar" }, dias.map((d, i) => {
    const activo = i === diaIdx;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: d,
        onClick: () => setDiaIdx(i),
        style: {
          fontFamily: FONT.mono,
          background: activo ? PAL.morado : PAL.blanco,
          color: activo ? PAL.blanco : PAL.tinta,
          border: `1px solid ${activo ? PAL.morado : PAL.linea}`
        },
        className: "shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium uppercase tracking-wider transition-colors"
      },
      d.slice(0, 3)
    );
  })), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setDiaIdx((diaIdx + 1) % dias.length),
      style: { color: PAL.tinta },
      className: "p-1.5 opacity-50 hover:opacity-100 transition-opacity"
    },
    /* @__PURE__ */ React.createElement(ChevronRight, { size: 18 })
  ));
}
function SelectorSala({ salas, salaSeleccionada, setSalaSeleccionada }) {
  return /* @__PURE__ */ React.createElement("div", { className: "max-w-2xl mx-auto px-4 mt-3 flex gap-1.5" }, salas.map((s) => {
    const activo = s === salaSeleccionada;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: s,
        onClick: () => setSalaSeleccionada(s),
        style: {
          fontFamily: FONT.mono,
          background: activo ? PAL.tinta : "transparent",
          color: activo ? PAL.papel : PAL.tinta,
          border: `1px solid ${PAL.tinta}`
        },
        className: "px-3.5 py-1.5 rounded-full text-xs uppercase tracking-wider transition-colors"
      },
      s
    );
  }));
}
function FilaHora({ hora, dia, activas, propuestas, estado, onAbrirModal }) {
  const vacio = activas.length === 0 && propuestas.length === 0;
  const sePuedeProponer = activas.length === 0;
  return /* @__PURE__ */ React.createElement("div", { className: "flex gap-3 items-start" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.88, fontWeight: 700 },
      className: "text-base pt-3.5 w-16 shrink-0 text-right"
    },
    hora
  ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0 space-y-2" }, activas.map((act) => {
    const n = contarInteresados(estado, act.id);
    const enEspera = (estado.listaEspera[act.id] || []).length;
    const lleno = act.cupo != null && n >= act.cupo || !!act.forzarCompleto;
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: act.id,
        onClick: () => onAbrirModal({
          dia,
          hora,
          modo: "activa",
          activityId: act.id,
          cupo: act.cupo,
          forzarCompleto: act.forzarCompleto,
          nombreActividad: act.nivel ? `${act.nombre} · ${act.nivel}` : act.nombre
        }),
        style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` },
        className: "w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between gap-2 hover:shadow-sm transition-shadow"
      },
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display }, className: "font-medium text-lg leading-tight" }, act.nombre, act.nivel && /* @__PURE__ */ React.createElement("span", { style: { color: PAL.morado, opacity: 0.9 }, className: "text-sm ml-1.5" }, act.nivel)), /* @__PURE__ */ React.createElement("div", { style: { color: lleno ? PAL.carmin : PAL.petroleo }, className: "text-sm mt-1 font-medium" }, lleno ? enEspera > 0 ? `Lista de Espera · ${enEspera}` : "Completa" : "Funcionando"))
    );
  }), propuestas.map((prop) => {
    const n = contarInteresados(estado, prop.id);
    return /* @__PURE__ */ React.createElement(
      "button",
      {
        key: prop.id,
        onClick: () => onAbrirModal({
          dia,
          hora,
          modo: "propuesta",
          activityId: prop.id,
          nombreActividad: prop.nombre
        }),
        style: { background: PAL.blanco, border: `1.5px dashed ${PAL.mostaza}` },
        className: "w-full text-left px-4 py-3.5 rounded-2xl flex items-center justify-between gap-2 flex-wrap hover:shadow-sm transition-shadow"
      },
      /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display }, className: "font-medium text-lg leading-tight" }, prop.nombre), /* @__PURE__ */ React.createElement("div", { style: { color: PAL.mostaza }, className: "text-sm mt-1 font-medium" }, "Propuesta del alumnado")),
      /* @__PURE__ */ React.createElement(DotsProgreso, { n })
    );
  }), sePuedeProponer && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => onAbrirModal({ dia, hora, modo: "vacio", nombreActividad: "este horario" }),
      style: { borderColor: PAL.linea, color: PAL.tinta },
      className: "w-full text-left px-4 py-3.5 rounded-2xl border border-dashed opacity-60 hover:opacity-90 transition-opacity flex items-center gap-2"
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 16 }),
    /* @__PURE__ */ React.createElement("span", { className: "text-[15px]" }, vacio ? "Libre — propón algo aquí" : "Proponer otra actividad aquí")
  )));
}
function colorDelTramo(posicion) {
  if (posicion <= 4) return PAL.carmin;
  if (posicion <= 7) return PAL.mostaza;
  return PAL.verde;
}
function DotsProgreso({ n }) {
  const colorActual = colorDelTramo(Math.max(n, 1));
  return /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 shrink-0" }, Array.from({ length: UMBRAL_PROPUESTA }).map((_, i) => {
    const posicion = i + 1;
    const rellena = posicion <= n;
    const color = colorDelTramo(posicion);
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        style: {
          background: rellena ? color : "transparent",
          border: `2px solid ${rellena ? color : PAL.linea}`
        },
        className: "w-2.5 h-2.5 rounded-full transition-colors"
      }
    );
  }), /* @__PURE__ */ React.createElement("span", { style: { fontFamily: FONT.mono, color: colorActual, fontWeight: 700 }, className: "text-sm ml-1" }, n, "/", UMBRAL_PROPUESTA));
}
function ModalHueco({ info, estado, catalogo, onCerrar, onUnirseActiva, onUnirsePropuesta, onEnviarHueco }) {
  const [mostrarPrivacidad, setMostrarPrivacidad] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [seleccion, setSeleccion] = useState("");
  const [textoOtro, setTextoOtro] = useState("");
  const [listaActividades, setListaActividades] = useState([]);
  const [listaSugerencias, setListaSugerencias] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [confirmando, setConfirmando] = useState(false);
  const esOtro = seleccion === "__otro__";
  const inscritosActuales = info.modo === "activa" ? contarInteresados(estado, info.activityId) : 0;
  const infoInscritosActiva = {
    inscritos: inscritosActuales,
    lleno: info.modo === "activa" && (info.cupo != null && inscritosActuales >= info.cupo || !!info.forzarCompleto)
  };
  const anadirALaLista = () => {
    if (esOtro) {
      const v = textoOtro.trim();
      if (!v || listaSugerencias.includes(v)) return;
      setListaSugerencias([...listaSugerencias, v]);
      setTextoOtro("");
    } else {
      if (!seleccion || listaActividades.includes(seleccion)) return;
      setListaActividades([...listaActividades, seleccion]);
    }
  };
  const cambiarSeleccion = (nuevoValor) => {
    if (esOtro) {
      const v = textoOtro.trim();
      if (v && !listaSugerencias.includes(v)) setListaSugerencias((prev) => [...prev, v]);
      setTextoOtro("");
    } else if (seleccion && !listaActividades.includes(seleccion)) {
      setListaActividades((prev) => [...prev, seleccion]);
    }
    setSeleccion(nuevoValor);
  };
  const quitarDeLaLista = (v) => setListaActividades(listaActividades.filter((a) => a !== v));
  const quitarSugerencia = (v) => setListaSugerencias(listaSugerencias.filter((a) => a !== v));
  const camposPersonaValidos = nombre.trim().length > 1 && telefonoValido(telefono);
  const anadirPersona = () => {
    if (!camposPersonaValidos) return;
    setPersonas([...personas, { nombre: nombre.trim(), telefono: telefono.trim() }]);
    setNombre("");
    setTelefono("");
  };
  const quitarPersona = (i) => setPersonas(personas.filter((_, idx) => idx !== i));
  const [editandoIndice, setEditandoIndice] = useState(null);
  const [edNombre, setEdNombre] = useState("");
  const [edTelefono, setEdTelefono] = useState("");
  const empezarEdicion = (i) => {
    setEditandoIndice(i);
    setEdNombre(personas[i].nombre);
    setEdTelefono(personas[i].telefono);
  };
  const guardarEdicion = () => {
    if (edNombre.trim().length < 2 || !telefonoValido(edTelefono)) return;
    setPersonas(personas.map((p, idx) => idx === editandoIndice ? { nombre: edNombre.trim(), telefono: edTelefono.trim() } : p));
    setEditandoIndice(null);
  };
  const cancelarEdicion = () => setEditandoIndice(null);
  const personasFinal = [...personas, ...camposPersonaValidos ? [{ nombre: nombre.trim(), telefono: telefono.trim() }] : []];
  const puedeEnviar = personasFinal.length > 0;
  const listaFinal = [...listaActividades, ...!esOtro && seleccion && !listaActividades.includes(seleccion) ? [seleccion] : []];
  const sugerenciasFinal = [
    ...listaSugerencias,
    ...esOtro && textoOtro.trim() && !listaSugerencias.includes(textoOtro.trim()) ? [textoOtro.trim()] : []
  ];
  const totalVacioFinal = listaFinal.length + sugerenciasFinal.length;
  const bloqueadoFinal = !puedeEnviar || info.modo === "vacio" && totalVacioFinal === 0;
  const enviar = () => {
    if (!puedeEnviar) return;
    if (info.modo === "activa") onUnirseActiva(personasFinal);
    else if (info.modo === "propuesta") onUnirsePropuesta(personasFinal);
    else if (info.modo === "vacio") {
      const lista = [...listaActividades];
      if (!esOtro && seleccion && !lista.includes(seleccion)) lista.push(seleccion);
      const sugerencias = [...listaSugerencias];
      if (esOtro && textoOtro.trim() && !sugerencias.includes(textoOtro.trim())) sugerencias.push(textoOtro.trim());
      if (lista.length > 0 || sugerencias.length > 0) onEnviarHueco(lista, sugerencias, personasFinal);
    }
  };
  if (confirmando) {
    const nombresActividades = info.modo === "vacio" ? [...listaFinal, ...sugerenciasFinal.map((s) => `${s} (sugerencia, pendiente de aprobar)`)] : [info.nombreActividad];
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: onCerrar,
        style: { background: "rgba(36,30,49,0.45)", height: "100dvh" },
        className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      },
      /* @__PURE__ */ React.createElement(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: { background: PAL.papel, border: `1px solid ${PAL.linea}`, maxHeight: "88dvh" },
          className: "w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative overflow-y-auto my-auto sm:my-0"
        },
        /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-2xl font-medium mb-1" }, "¿Revisamos los datos?"),
        /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.76 }, className: "text-sm mb-5" }, "Comprueba que está todo bien escrito antes de enviarlo — sobre todo el teléfono."),
        /* @__PURE__ */ React.createElement("div", { style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` }, className: "rounded-2xl p-4 mb-5" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.7 }, className: "text-[13px] uppercase tracking-widest mb-2" }, info.dia, " · ", info.hora, info.sala ? ` · ${info.sala}` : ""), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 mb-4" }, nombresActividades.map((n, i) => /* @__PURE__ */ React.createElement(
          "span",
          {
            key: i,
            style: { background: PAL.linea, color: PAL.tinta },
            className: "text-xs px-2.5 py-1 rounded-full"
          },
          n
        ))), personasFinal.map((p, i) => /* @__PURE__ */ React.createElement(FilaPersona, { key: i, nombre: p.nombre, telefono: p.telefono }))),
        /* @__PURE__ */ React.createElement("div", { className: "flex gap-2.5" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setConfirmando(false),
            style: { borderColor: PAL.linea, color: PAL.tinta },
            className: "flex-1 py-3 rounded-xl border font-medium text-sm"
          },
          "Corregir"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: enviar,
            style: { background: PAL.morado },
            className: "flex-1 py-3 rounded-xl text-white font-medium text-sm"
          },
          "Sí, enviar"
        ))
      )
    );
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onCerrar,
      style: { background: "rgba(36,30,49,0.45)", height: "100dvh" },
      className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        style: { background: PAL.papel, border: `1px solid ${PAL.linea}`, maxHeight: "88dvh" },
        className: "w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative overflow-y-auto my-auto sm:my-0"
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onCerrar,
          style: { background: PAL.blanco, color: PAL.tinta, border: `1px solid ${PAL.linea}` },
          className: "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        },
        /* @__PURE__ */ React.createElement(X, { size: 18 })
      ),
      /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.7 }, className: "text-[13px] uppercase tracking-widest pr-10" }, info.dia, " · ", info.hora, info.sala ? ` · ${info.sala}` : ""),
      /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-2xl font-medium mt-1 mb-4 pr-8" }, info.modo === "vacio" ? "Propón una actividad" : info.nombreActividad),
      info.modo === "activa" && /* @__PURE__ */ React.createElement("div", { className: "mb-5" }, infoInscritosActiva.lleno ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm mb-2 leading-relaxed" }, "Esta clase está completa."), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm mb-2 leading-relaxed" }, "Déjanos tus datos y te apuntamos en la lista de espera."), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm leading-relaxed" }, "Te diremos tu posición al momento, y te avisaremos si se libera un hueco.")) : /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm leading-relaxed" }, "Esta clase ya está funcionando. Déjanos tus datos y te avisaremos para confirmar tu plaza.")),
      info.modo === "propuesta" && /* @__PURE__ */ React.createElement("div", { className: "mb-5" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm mb-3 leading-relaxed" }, "Aún no hay grupo suficiente. Súmate y ayuda a que esta clase arranque."), /* @__PURE__ */ React.createElement(DotsProgreso, { n: contarInteresados(estado, info.activityId) })),
      info.modo === "vacio" && /* @__PURE__ */ React.createElement("div", { className: "mb-5" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm mb-3 leading-relaxed" }, "¿Qué actividad te gustaría hacer aquí? Puedes añadir más de una si te vale cualquiera de ellas."), listaActividades.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 mb-2" }, listaActividades.map((a) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: a,
          style: { background: PAL.tinta, color: PAL.papel, fontFamily: FONT.mono },
          className: "text-[13px] px-2.5 py-1 rounded-full flex items-center gap-1.5"
        },
        a,
        /* @__PURE__ */ React.createElement("button", { onClick: () => quitarDeLaLista(a), className: "opacity-70 hover:opacity-100" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))
      ))), listaSugerencias.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 mb-2.5" }, listaSugerencias.map((a) => /* @__PURE__ */ React.createElement(
        "span",
        {
          key: a,
          style: { background: PAL.mostaza, color: PAL.tinta, fontFamily: FONT.mono },
          className: "text-[13px] px-2.5 py-1 rounded-full flex items-center gap-1.5"
        },
        a,
        " · pendiente",
        /* @__PURE__ */ React.createElement("button", { onClick: () => quitarSugerencia(a), className: "opacity-70 hover:opacity-100" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))
      ))), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-2" }, /* @__PURE__ */ React.createElement(
        "select",
        {
          value: seleccion,
          onChange: (e) => cambiarSeleccion(e.target.value),
          style: { borderColor: PAL.linea, fontFamily: FONT.body },
          className: "flex-1 px-4 py-3 rounded-xl border bg-white text-sm outline-none"
        },
        /* @__PURE__ */ React.createElement("option", { value: "", disabled: true }, "Elige una actividad…"),
        catalogo.map((a) => /* @__PURE__ */ React.createElement("option", { key: a, value: a }, a)),
        /* @__PURE__ */ React.createElement("option", { value: "__otro__" }, "Otra actividad (proponer nueva)…")
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: anadirALaLista,
          disabled: esOtro ? !textoOtro.trim() : !seleccion,
          style: { borderColor: PAL.linea, color: PAL.tinta, opacity: (esOtro ? textoOtro.trim() : seleccion) ? 1 : 0.35 },
          className: "px-3.5 rounded-xl border shrink-0",
          title: "Añadir otra actividad"
        },
        /* @__PURE__ */ React.createElement(Plus, { size: 16 })
      )), esOtro && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        "input",
        {
          value: textoOtro,
          onChange: (e) => setTextoOtro(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              anadirALaLista();
            }
          },
          placeholder: "Escribe la actividad que propones…",
          style: { borderColor: PAL.linea, fontFamily: FONT.body },
          className: "w-full px-4 py-3 rounded-xl border bg-white text-sm outline-none focus:border-current"
        }
      ), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.65 }, className: "text-[13px] mt-1.5" }, "Esta propuesta no se publica al momento: la revisamos y la activamos si encaja."))),
      /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.76 }, className: "text-xs mb-2" }, personas.length === 0 ? "Tus datos: (si quieres apuntar a más personas contigo, añádelos también)" : "Añade a la siguiente persona"), personas.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, className: "mb-2.5" }, personas.map(
        (p, i) => editandoIndice === i ? /* @__PURE__ */ React.createElement(
          "div",
          {
            key: i,
            style: { background: PAL.blanco, border: `1.5px solid ${PAL.petroleo}` },
            className: "rounded-xl p-2.5 space-y-1.5"
          },
          /* @__PURE__ */ React.createElement(
            "input",
            {
              value: edNombre,
              onChange: (e) => setEdNombre(e.target.value),
              placeholder: "Nombre de pila",
              style: { borderColor: PAL.linea, fontFamily: FONT.body },
              className: "w-full px-2.5 py-1.5 rounded-lg border bg-white text-sm outline-none"
            }
          ),
          /* @__PURE__ */ React.createElement(
            "input",
            {
              value: edTelefono,
              onChange: (e) => setEdTelefono(e.target.value),
              placeholder: "Teléfono",
              style: { borderColor: PAL.linea, fontFamily: FONT.body },
              className: "w-full px-2.5 py-1.5 rounded-lg border bg-white text-sm outline-none"
            }
          ),
          /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8 } }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: guardarEdicion,
              disabled: edNombre.trim().length < 2 || !telefonoValido(edTelefono),
              style: {
                background: PAL.petroleo,
                color: PAL.blanco,
                opacity: edNombre.trim().length < 2 || !telefonoValido(edTelefono) ? 0.4 : 1,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4
              },
              className: "py-1.5 rounded-lg text-xs font-medium"
            },
            /* @__PURE__ */ React.createElement(Check, { size: 13 }),
            " Guardar"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: cancelarEdicion,
              style: { borderColor: PAL.linea, color: PAL.tinta, flex: 1 },
              className: "py-1.5 rounded-lg border text-xs font-medium"
            },
            "Cancelar"
          ))
        ) : /* @__PURE__ */ React.createElement(
          "span",
          {
            key: i,
            style: {
              background: PAL.petroleo,
              color: PAL.papel,
              fontFamily: FONT.mono,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              width: "fit-content"
            },
            className: "text-[13px] px-2.5 py-1 rounded-full"
          },
          /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => empezarEdicion(i),
              style: { display: "flex", alignItems: "center", gap: 4 },
              title: "Pulsa para corregir este nombre o teléfono"
            },
            /* @__PURE__ */ React.createElement(Pencil, { size: 10, style: { opacity: 0.7 } }),
            p.nombre
          ),
          /* @__PURE__ */ React.createElement("button", { onClick: () => quitarPersona(i), style: { opacity: 0.7 }, title: "Quitar" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))
        )
      )), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(Campo, { icon: /* @__PURE__ */ React.createElement(User, { size: 14 }), valor: nombre, onCambio: setNombre, placeholder: "Nombre de pila" }), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(Campo, { icon: /* @__PURE__ */ React.createElement(Phone, { size: 14 }), valor: telefono, onCambio: setTelefono, placeholder: "Teléfono (con prefijo si es extranjero, ej. +34)", tipo: "tel" }), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: anadirPersona,
          disabled: !camposPersonaValidos,
          style: { borderColor: PAL.linea, color: PAL.tinta, opacity: camposPersonaValidos ? 1 : 0.35 },
          className: "px-3.5 rounded-xl border shrink-0",
          title: "Añadir a otra persona"
        },
        /* @__PURE__ */ React.createElement(Plus, { size: 16 })
      )), telefono.trim().length > 0 && !telefonoValido(telefono) && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin, opacity: 0.85 }, className: "text-[13px]" }, "El teléfono debe tener al menos 9 dígitos (se admite el prefijo internacional, ej. +34).")), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-[13px] mt-2" }, "¿Vienen amigos y/o hijos contigo? Añádelos uno a uno con su nombre (puedes repetir el mismo teléfono si es el contacto familiar).")),
      (() => {
        const lista = listaFinal;
        const sugerencias = sugerenciasFinal;
        const totalVacio = totalVacioFinal;
        const bloqueado = bloqueadoFinal;
        const totalPersonas = personasFinal.length;
        let etiqueta;
        if (info.modo === "activa")
          etiqueta = infoInscritosActiva.lleno ? totalPersonas > 1 ? `Apuntar a ${totalPersonas} en lista de espera` : "Apuntarme a la lista de espera" : totalPersonas > 1 ? `Apuntar a ${totalPersonas} personas` : "Quiero apuntarme";
        else if (info.modo === "propuesta") etiqueta = totalPersonas > 1 ? `Sumar a ${totalPersonas} personas` : "Sumarme a la propuesta";
        else if (sugerencias.length > 0 && lista.length === 0) etiqueta = sugerencias.length > 1 ? `Enviar ${sugerencias.length} sugerencias` : "Enviar sugerencia";
        else if (totalVacio > 1) etiqueta = `Enviar ${totalVacio} propuestas`;
        else etiqueta = "Enviar propuesta";
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => !bloqueado && setConfirmando(true),
            disabled: bloqueado,
            style: { background: PAL.morado, opacity: bloqueado ? 0.35 : 1 },
            className: "w-full mt-5 py-3.5 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-opacity"
          },
          /* @__PURE__ */ React.createElement(Sparkles, { size: 15 }),
          etiqueta
        );
      })(),
      /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-[13px] text-center mt-3" }, "Usaremos tu teléfono para cualquier gestión relacionada con Baildanzas (clases, avisos, dudas). No se cede a terceros.", " ", /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => setMostrarPrivacidad(true),
          style: { color: PAL.tinta, opacity: 0.85 },
          className: "underline"
        },
        "Ver política de privacidad"
      ))
    ),
    mostrarPrivacidad && /* @__PURE__ */ React.createElement(ModalPrivacidad, { onCerrar: () => setMostrarPrivacidad(false) })
  );
}
function ModalPrivacidad({ onCerrar }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onCerrar,
      style: { background: "rgba(36,30,49,0.55)", height: "100dvh" },
      className: "fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        style: { background: PAL.papel, border: `1px solid ${PAL.linea}`, maxHeight: "85dvh" },
        className: "w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 relative overflow-y-auto my-auto sm:my-0"
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onCerrar,
          style: { background: PAL.blanco, color: PAL.tinta, border: `1px solid ${PAL.linea}` },
          className: "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm z-10"
        },
        /* @__PURE__ */ React.createElement(X, { size: 18 })
      ),
      /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-xl font-medium mb-4 pr-8" }, "Política de privacidad"),
      /* @__PURE__ */ React.createElement("div", { style: { color: PAL.tinta, opacity: 0.88 }, className: "text-sm space-y-3 leading-relaxed" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Responsable:"), " Baildanzas (escuela de danza y arte), sedes en Madrid."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "¿Qué datos pedimos?"), " Solo tu nombre de pila y tu número de teléfono, y los de las personas que apuntes contigo (amigos o hijos)."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "¿Para qué los usamos?"), " Para cualquier gestión relacionada con Baildanzas: contarte cuántos sois en una propuesta, avisarte cuando una clase arranca, confirmar tu plaza o tu puesto en lista de espera, y resolver dudas o avisos generales de la escuela."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "¿Con quién los compartimos?"), " Con nadie. No cedemos ni vendemos tus datos a terceros, ni se usan con fines publicitarios."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "¿Cuánto tiempo los guardamos?"), " Mientras seas alumno/a activo/a o tengas una propuesta en marcha. Puedes pedirnos que te demos de baja en cualquier momento."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Tus derechos:"), " Puedes pedirnos acceder a tus datos, corregirlos o eliminarlos por completo cuando quieras, escribiendo a Baildanzas directamente."), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Contacto:"), " baildanzas@gmail.com"))
    )
  );
}
function Campo({ icon, valor, onCambio, placeholder, tipo = "text" }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { borderColor: PAL.linea, background: PAL.blanco },
      className: "flex items-center gap-2.5 px-4 py-3 rounded-xl border"
    },
    /* @__PURE__ */ React.createElement("span", { style: { color: PAL.tinta, opacity: 0.6 } }, icon),
    /* @__PURE__ */ React.createElement(
      "input",
      {
        type: tipo,
        value: valor,
        onChange: (e) => onCambio(e.target.value),
        onFocus: (e) => {
          setTimeout(() => e.target.scrollIntoView({ block: "center", behavior: "smooth" }), 300);
        },
        placeholder,
        style: {
          fontFamily: FONT.body,
          color: PAL.tinta,
          background: PAL.blanco,
          caretColor: PAL.tinta,
          colorScheme: "light",
          WebkitTextFillColor: PAL.tinta
        },
        className: "flex-1 outline-none text-sm"
      }
    )
  );
}
function PanelGestion({
  sedeId,
  sede,
  sedes,
  onCambiarSede,
  avisos,
  sugerencias,
  catalogo,
  onCerrar,
  onResolver,
  onAnadir,
  onEditarCupo,
  onAlternarForzarCompleto,
  onEditarDisponibilidad,
  onEditarClaseFija,
  onRenombrarSede,
  onEditarDireccionSede,
  onBorrar,
  onAprobarSugerencia,
  onRechazarSugerencia,
  onAnadirCatalogo,
  onBorrarCatalogo,
  onBuscarInteresado,
  onQuitarInteresado,
  onEditarInteresado,
  onFusionarPropuestas,
  onConvertirEnActiva,
  onAnadirAlumno,
  vistoPropuestasTs,
  onMarcarPropuestasVistas,
  interesados,
  onExportar
}) {
  const [tab, setTab] = useState("avisos");
  const [nDia, setNDia] = useState(sedeId === 1 ? DIAS[0] : DIAS[0]);
  const [nHora, setNHora] = useState(HORAS[0]);
  const [nHoraFin, setNHoraFin] = useState("");
  const [nSala, setNSala] = useState(sede.salas ? sede.salas[0] : "");
  const [errorAnadirHorario, setErrorAnadirHorario] = useState("");
  const [nNombre, setNNombre] = useState("");
  const [nNivel, setNNivel] = useState("");
  const [nCupo, setNCupo] = useState("");
  const [nCatalogo, setNCatalogo] = useState("");
  const [telefonoBuscado, setTelefonoBuscado] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);
  const [editando, setEditando] = useState(null);
  const [confirmandoConversion, setConfirmandoConversion] = useState(null);
  const [fechaPrueba, setFechaPrueba] = useState("");
  const [expandidaActiva, setExpandidaActiva] = useState(null);
  const [editandoClaseId, setEditandoClaseId] = useState(null);
  const [ecNombre, setEcNombre] = useState("");
  const [ecNivel, setEcNivel] = useState("");
  const [ecDia, setEcDia] = useState("");
  const [ecHora, setEcHora] = useState("");
  const [ecSala, setEcSala] = useState("");
  const [nuevoAlumnoNombre, setNuevoAlumnoNombre] = useState("");
  const [nuevoAlumnoTelefono, setNuevoAlumnoTelefono] = useState("");
  const empezarEdicionClase = (d, h, act) => {
    setEditandoClaseId(act.id);
    setEcNombre(act.nombre);
    setEcNivel(act.nivel || "");
    setEcDia(d);
    setEcHora(h);
    setEcSala(act.sala || "");
  };
  const guardarEdicionClase = (diaViejo, horaVieja) => {
    if (ecNombre.trim().length < 2 || !ecDia || !ecHora) return;
    onEditarClaseFija(diaViejo, horaVieja, editandoClaseId, {
      nombre: ecNombre,
      nivel: ecNivel,
      dia: ecDia,
      hora: ecHora,
      sala: ecSala
    });
    setEditandoClaseId(null);
  };
  const pendientes = avisos.filter((a) => !a.resuelto);
  const resueltos = avisos.filter((a) => a.resuelto);
  const sugerenciasPendientes = sugerencias.filter((s) => s.estado === "pendiente");
  const diasSede = DIAS;
  const listaPropuestas = [];
  diasSede.forEach((d) => {
    const porHora = sede.propuestas[d] || {};
    Object.keys(porHora).sort().forEach((h) => {
      porHora[h].forEach((p) => {
        const personas = interesados[p.id] || [];
        const ultimoTs = personas.reduce((max, per) => Math.max(max, per.ts || 0), 0);
        listaPropuestas.push({
          id: p.id,
          dia: d,
          hora: h,
          nombre: p.nombre,
          sala: p.sala,
          personas,
          ultimoTs
        });
      });
    });
  });
  const totalInteresadosPropuestas = listaPropuestas.reduce((acc, p) => acc + p.personas.length, 0);
  const nuevasDesdeUltimaVez = listaPropuestas.reduce(
    (acc, p) => acc + p.personas.filter((per) => (per.ts || 0) > vistoPropuestasTs).length,
    0
  );
  const grupoDuplicado = (item) => listaPropuestas.filter(
    (p) => p.dia === item.dia && p.hora === item.hora && p.sala === item.sala && p.nombre.trim().toLowerCase() === item.nombre.trim().toLowerCase()
  );
  return /* @__PURE__ */ React.createElement("div", { style: { background: "rgba(36,30,49,0.45)" }, className: "fixed inset-0 z-50 flex justify-end" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { background: PAL.papel },
      className: "w-full sm:max-w-lg h-full overflow-y-auto p-6 shadow-2xl"
    },
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-2xl font-medium" }, "Panel de gestión"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onExportar,
        title: "Descargar copia de seguridad de todos los datos",
        style: { color: PAL.petroleo },
        className: "p-1.5"
      },
      /* @__PURE__ */ React.createElement(Download, { size: 19 })
    ), /* @__PURE__ */ React.createElement("button", { onClick: onCerrar, style: { color: PAL.tinta, opacity: 0.7 } }, /* @__PURE__ */ React.createElement(X, { size: 20 })))),
    /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, className: "mb-5" }, Object.entries(sedes).map(([id, s]) => {
      const activo = Number(id) === sedeId;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: id,
          onClick: () => onCambiarSede(Number(id)),
          style: {
            fontFamily: FONT.mono,
            background: activo ? PAL.petroleo : "transparent",
            color: activo ? PAL.papel : PAL.petroleo,
            border: `1px solid ${PAL.petroleo}`,
            display: "flex",
            alignItems: "center",
            gap: 6
          },
          className: "px-3.5 py-1.5 text-[13px] uppercase tracking-widest rounded-full"
        },
        /* @__PURE__ */ React.createElement(MapPin, { size: 12 }),
        /* @__PURE__ */ React.createElement("span", { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.2 } }, /* @__PURE__ */ React.createElement("span", null, s.nombre), s.direccion && /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.85, fontSize: "13px", textTransform: "none", letterSpacing: "0.01em", fontWeight: 500 } }, s.direccion))
      );
    })),
    /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-5 flex-wrap" }, [
      ["avisos", "Avisos", pendientes.length, PAL.carmin, 0],
      ["propuestas", "Propuestas", totalInteresadosPropuestas, PAL.petroleo, nuevasDesdeUltimaVez],
      ["sugerencias", "Sugerencias", sugerenciasPendientes.length, PAL.carmin, 0],
      ["buscar", "Buscar", null, PAL.carmin, 0],
      ["horario", "Horario base", null, PAL.carmin, 0],
      ["disponibilidad", "Disponibilidad", null, PAL.carmin, 0],
      ["catalogo", "Catálogo", null, PAL.carmin, 0]
    ].map(([id, label, badge, colorBadge, badgeExtra]) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: id,
        onClick: () => {
          setTab(id);
          if (id === "propuestas") onMarcarPropuestasVistas();
        },
        style: {
          fontFamily: FONT.mono,
          background: tab === id ? PAL.tinta : "transparent",
          color: tab === id ? PAL.papel : PAL.tinta,
          border: `1px solid ${PAL.tinta}`,
          marginRight: badgeExtra ? "10px" : 0
        },
        className: "relative px-3.5 py-1.5 text-[13px] uppercase tracking-wider rounded-full flex items-center gap-1.5"
      },
      !!badgeExtra && /* @__PURE__ */ React.createElement(
        "span",
        {
          style: { background: PAL.carmin, border: `1.5px solid ${PAL.papel}` },
          className: "absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[12px] font-bold flex items-center justify-center leading-none z-10",
          title: "Nuevas desde la última vez que entraste"
        },
        badgeExtra
      ),
      label,
      !!badge && /* @__PURE__ */ React.createElement(
        "span",
        {
          style: { background: colorBadge },
          className: "w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center"
        },
        badge
      )
    ))),
    tab === "avisos" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, pendientes.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-sm" }, "No hay avisos pendientes. Aquí verás cuándo alguien se apunta o cuándo una propuesta llega a ", UMBRAL_PROPUESTA, " personas."), pendientes.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` }, className: "p-4 rounded-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display }, className: "font-medium text-sm" }, a.nombre), /* @__PURE__ */ React.createElement("div", { style: { color: PAL.carmin }, className: "text-xs mt-0.5" }, a.tipo), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, opacity: 0.7 }, className: "text-[12px] mt-1" }, a.dia, " · ", a.hora)), /* @__PURE__ */ React.createElement("button", { onClick: () => onResolver(a.id), style: { color: PAL.petroleo }, className: "p-1.5 shrink-0" }, /* @__PURE__ */ React.createElement(Check, { size: 16 }))), /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, (a.contactos || (a.contacto ? [a.contacto] : [])).map((c, i) => /* @__PURE__ */ React.createElement(FilaPersona, { key: i, nombre: c.nombre, telefono: c.telefono, ts: c.ts }))))), resueltos.length > 0 && /* @__PURE__ */ React.createElement("details", { className: "pt-2" }, /* @__PURE__ */ React.createElement("summary", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-xs cursor-pointer" }, "Resueltos (", resueltos.length, ")"), /* @__PURE__ */ React.createElement("div", { className: "mt-2 space-y-2" }, resueltos.map((a) => /* @__PURE__ */ React.createElement("div", { key: a.id, style: { opacity: 0.65 }, className: "text-xs" }, a.nombre, " — ", a.dia, " ", a.hora))))),
    tab === "buscar" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs mb-3" }, "Busca por el nombre o el teléfono que os haya dado la persona para ver en qué está apuntada (en cualquiera de las dos sedes) y darla de baja si os lo pide."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: telefonoBuscado,
        onChange: (e) => setTelefonoBuscado(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setResultadosBusqueda(onBuscarInteresado(telefonoBuscado));
        },
        placeholder: "Nombre o teléfono…",
        type: "text",
        className: "flex-1 px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setResultadosBusqueda(onBuscarInteresado(telefonoBuscado)),
        style: { background: PAL.tinta },
        className: "px-4 rounded-lg text-white text-sm shrink-0"
      },
      "Buscar"
    )), resultadosBusqueda !== null && resultadosBusqueda.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-sm" }, "No hay ninguna inscripción con ese teléfono."), /* @__PURE__ */ React.createElement("div", { className: "space-y-2.5" }, (resultadosBusqueda || []).map((r) => {
      const colorTipo = r.tipo === "espera" ? PAL.carmin : r.tipo === "activa" ? PAL.petroleo : PAL.mostaza;
      const etiquetaTipo = r.tipo === "espera" ? "Lista de espera" : r.tipo === "activa" ? "Clase activa" : "Propuesta";
      const key = `${r.activityId}-${r.idxPersona}`;
      const estaEditando = editando && editando.activityId === r.activityId && editando.idxPersona === r.idxPersona;
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key,
          style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` },
          className: "p-3.5 rounded-2xl"
        },
        estaEditando ? /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            value: editando.nombre,
            onChange: (e) => setEditando({ ...editando, nombre: e.target.value }),
            placeholder: "Nombre",
            className: "w-full px-3 py-2 rounded-lg border text-sm",
            style: { borderColor: PAL.linea }
          }
        ), /* @__PURE__ */ React.createElement(
          "input",
          {
            value: editando.telefono,
            onChange: (e) => setEditando({ ...editando, telefono: e.target.value }),
            placeholder: "Teléfono",
            type: "tel",
            className: "w-full px-3 py-2 rounded-lg border text-sm",
            style: { borderColor: PAL.linea }
          }
        ), editando.nombre.trim().length > 1 && !telefonoValido(editando.telefono) && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin }, className: "text-[13px]" }, "El teléfono debe tener al menos 9 dígitos."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setEditando(null),
            style: { borderColor: PAL.linea, color: PAL.tinta },
            className: "flex-1 py-2 rounded-lg border text-sm"
          },
          "Cancelar"
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              if (editando.nombre.trim().length < 2 || !telefonoValido(editando.telefono)) return;
              const nNombre2 = editando.nombre.trim();
              const nTelefono = editando.telefono.trim();
              onEditarInteresado(r.activityId, r.idxPersona, r.origen, nNombre2, nTelefono);
              setEditando(null);
              setResultadosBusqueda(
                (prev) => prev.map(
                  (x) => x.activityId === r.activityId && x.idxPersona === r.idxPersona && x.origen === r.origen ? { ...x, persona: { ...x.persona, nombre: nNombre2, telefono: nTelefono } } : x
                )
              );
            },
            style: { background: PAL.morado },
            className: "flex-1 py-2 rounded-lg text-white text-sm"
          },
          "Guardar"
        ))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
          "span",
          {
            style: { background: PAL.linea, color: PAL.tinta },
            className: "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
          },
          (r.persona.nombre || "?").trim().charAt(0).toUpperCase()
        ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { style: { color: PAL.tinta }, className: "text-sm font-medium truncate" }, r.persona.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.73 }, className: "text-[13px] truncate" }, r.persona.telefono, r.persona.ts && /* @__PURE__ */ React.createElement("span", { className: "opacity-70" }, " · ", formatearFechaHora(r.persona.ts))))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => setEditando({
              activityId: r.activityId,
              idxPersona: r.idxPersona,
              origen: r.origen,
              nombre: r.persona.nombre,
              telefono: r.persona.telefono
            }),
            style: { background: PAL.blanco, color: PAL.morado, border: `1px solid ${PAL.linea}` },
            className: "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
            title: "Corregir nombre o teléfono"
          },
          /* @__PURE__ */ React.createElement(Pencil, { size: 14 })
        ), /* @__PURE__ */ React.createElement(
          "button",
          {
            onClick: () => {
              onQuitarInteresado(r.activityId, r.idxPersona, r.origen);
              setResultadosBusqueda(
                (prev) => prev.filter((x) => !(x.activityId === r.activityId && x.idxPersona === r.idxPersona && x.origen === r.origen))
              );
            },
            style: { background: PAL.blanco, color: PAL.carmin, border: `1px solid ${PAL.linea}` },
            className: "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
            title: "Dar de baja de esta actividad"
          },
          /* @__PURE__ */ React.createElement(Trash2, { size: 14 })
        ))),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: { borderColor: PAL.linea },
            className: "mt-2.5 pt-2.5 border-t flex items-center gap-1.5 flex-wrap"
          },
          /* @__PURE__ */ React.createElement("span", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-sm font-medium" }, r.nombre),
          /* @__PURE__ */ React.createElement("span", { style: { color: PAL.tinta, opacity: 0.65 }, className: "text-xs" }, "· ", r.sedeNombre, " · ", r.dia, " ", r.hora),
          /* @__PURE__ */ React.createElement(
            "span",
            {
              style: { background: colorTipo, color: PAL.blanco },
              className: "text-[12px] px-2 py-0.5 rounded-full font-medium ml-auto"
            },
            etiquetaTipo
          )
        )
      );
    }))),
    tab === "horario" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` }, className: "p-4 rounded-2xl mb-5" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, opacity: 0.7 }, className: "text-[13px] uppercase tracking-widest mb-3" }, "Añadir clase fija"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-2" }, /* @__PURE__ */ React.createElement("select", { value: nDia, onChange: (e) => setNDia(e.target.value), className: "px-3 py-2 rounded-lg border text-sm", style: { borderColor: PAL.linea } }, diasSede.map((d) => /* @__PURE__ */ React.createElement("option", { key: d }, d))), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: nNombre,
        onChange: (e) => setNNombre(e.target.value),
        placeholder: "Nombre de la actividad",
        className: "px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-[12px] block mb-0.5" }, "Empieza"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: nHora,
        onChange: (e) => setNHora(e.target.value),
        className: "w-full px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-[12px] block mb-0.5" }, "Termina (opcional)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: nHoraFin,
        onChange: (e) => setNHoraFin(e.target.value),
        className: "w-full px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ))), sede.salas && /* @__PURE__ */ React.createElement(
      "select",
      {
        value: nSala,
        onChange: (e) => setNSala(e.target.value),
        className: "w-full px-3 py-2 rounded-lg border text-sm mb-2",
        style: { borderColor: PAL.linea }
      },
      sede.salas.map((s) => /* @__PURE__ */ React.createElement("option", { key: s }, s))
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: nNivel,
        onChange: (e) => setNNivel(e.target.value),
        placeholder: "Nivel o edad (ej: 3 a 5 años) — opcional",
        className: "w-full px-3 py-2 rounded-lg border text-sm mb-2",
        style: { borderColor: PAL.linea }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: nCupo,
        onChange: (e) => setNCupo(e.target.value.replace(/\D/g, "")),
        placeholder: "Cupo máximo (opcional)",
        inputMode: "numeric",
        className: "w-full px-3 py-2 rounded-lg border text-sm mb-3",
        style: { borderColor: PAL.linea }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (!nNombre.trim() || !nHora) {
            setErrorAnadirHorario("Falta el nombre de la actividad o la hora de inicio.");
            return;
          }
          setErrorAnadirHorario("");
          onAnadir(nDia, nHora, nNombre.trim(), nNivel.trim(), nCupo ? Number(nCupo) : void 0, nHoraFin || void 0, sede.salas ? nSala : void 0);
          setNNombre("");
          setNNivel("");
          setNCupo("");
          setNHoraFin("");
        },
        style: { background: PAL.tinta },
        className: "w-full py-2.5 rounded-lg text-white text-sm"
      },
      "Añadir al horario"
    ), errorAnadirHorario && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin }, className: "text-xs mt-2" }, errorAnadirHorario)), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, diasSede.map((d) => {
      const horasDelDia = Object.keys(sede.activas[d] || {});
      if (horasDelDia.length === 0) return null;
      return /* @__PURE__ */ React.createElement("div", { key: d }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, opacity: 0.7 }, className: "text-[13px] uppercase tracking-widest mt-3 mb-1" }, d), horasDelDia.sort().map(
        (h) => sede.activas[d][h].map((act) => {
          const alumnos = interesados[act.id] || [];
          const desplegada = expandidaActiva === act.id;
          return /* @__PURE__ */ React.createElement("div", { key: act.id, className: "py-1.5" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => setExpandidaActiva(desplegada ? null : act.id),
              className: "w-full flex items-center justify-between gap-2 text-sm text-left"
            },
            /* @__PURE__ */ React.createElement("span", { className: "min-w-0" }, h, act.horaFin ? `–${act.horaFin}` : "", " — ", act.nombre, " ", act.nivel && /* @__PURE__ */ React.createElement("em", { style: { opacity: 0.76 } }, "(", act.nivel, ")"), act.sala && /* @__PURE__ */ React.createElement("span", { style: { color: PAL.morado, opacity: 0.8 }, className: "text-xs" }, " · ", act.sala)),
            /* @__PURE__ */ React.createElement(
              "span",
              {
                style: { fontFamily: FONT.mono, color: PAL.petroleo },
                className: "text-xs shrink-0"
              },
              alumnos.length,
              act.cupo ? `/${act.cupo}` : ""
            )
          ), desplegada && /* @__PURE__ */ React.createElement("div", { style: { background: PAL.papel, border: `1px solid ${PAL.linea}` }, className: "rounded-xl p-3 mt-2" }, editandoClaseId === act.id ? /* @__PURE__ */ React.createElement("div", { className: "space-y-2 mb-3" }, /* @__PURE__ */ React.createElement(
            "input",
            {
              value: ecNombre,
              onChange: (e) => setEcNombre(e.target.value),
              placeholder: "Nombre de la actividad",
              className: "w-full px-2.5 py-1.5 rounded-lg border text-sm",
              style: { borderColor: PAL.linea }
            }
          ), /* @__PURE__ */ React.createElement(
            "input",
            {
              value: ecNivel,
              onChange: (e) => setEcNivel(e.target.value),
              placeholder: "Nivel o edad (opcional)",
              className: "w-full px-2.5 py-1.5 rounded-lg border text-sm",
              style: { borderColor: PAL.linea }
            }
          ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5" }, /* @__PURE__ */ React.createElement(
            "select",
            {
              value: ecDia,
              onChange: (e) => setEcDia(e.target.value),
              className: "flex-1 px-2 py-1.5 rounded-lg border text-sm",
              style: { borderColor: PAL.linea }
            },
            DIAS.map((dd) => /* @__PURE__ */ React.createElement("option", { key: dd }, dd))
          ), /* @__PURE__ */ React.createElement(
            "input",
            {
              type: "time",
              value: ecHora,
              onChange: (e) => setEcHora(e.target.value),
              className: "px-2 py-1.5 rounded-lg border text-sm",
              style: { borderColor: PAL.linea }
            }
          )), sede.salas && /* @__PURE__ */ React.createElement(
            "select",
            {
              value: ecSala,
              onChange: (e) => setEcSala(e.target.value),
              className: "w-full px-2 py-1.5 rounded-lg border text-sm",
              style: { borderColor: PAL.linea }
            },
            sede.salas.map((s) => /* @__PURE__ */ React.createElement("option", { key: s }, s))
          ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => guardarEdicionClase(d, h),
              style: { background: PAL.petroleo },
              className: "flex-1 py-1.5 rounded-lg text-white text-xs font-medium flex items-center justify-center gap-1"
            },
            /* @__PURE__ */ React.createElement(Check, { size: 13 }),
            " Guardar cambios"
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => setEditandoClaseId(null),
              style: { borderColor: PAL.linea, color: PAL.tinta },
              className: "flex-1 py-1.5 rounded-lg border text-xs font-medium"
            },
            "Cancelar"
          )), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.55 }, className: "text-[11px]" }, "El alumnado y las plazas ya apuntadas se mantienen aunque cambies el día o la hora.")) : /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => empezarEdicionClase(d, h, act),
              style: { borderColor: PAL.linea, color: PAL.tinta },
              className: "w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs font-medium mb-2"
            },
            /* @__PURE__ */ React.createElement(Pencil, { size: 12 }),
            " Editar nombre, nivel, día u hora"
          ), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 mb-2 flex-wrap" }, /* @__PURE__ */ React.createElement(
            "input",
            {
              defaultValue: act.cupo || "",
              onBlur: (e) => {
                const v = e.target.value.replace(/\D/g, "");
                onEditarCupo(d, h, act.id, v ? Number(v) : void 0);
              },
              placeholder: "cupo",
              inputMode: "numeric",
              title: "Cupo máximo (vacío = sin límite)",
              className: "w-16 px-1.5 py-1 rounded-md border text-xs text-center",
              style: { borderColor: PAL.linea, background: PAL.blanco }
            }
          ), /* @__PURE__ */ React.createElement("span", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-[13px]" }, "cupo máximo (vacío = sin límite)"), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => onBorrar(d, h, act.id),
              style: { color: PAL.carmin, opacity: 0.76 },
              className: "ml-auto shrink-0",
              title: "Eliminar esta clase del horario"
            },
            /* @__PURE__ */ React.createElement(Trash2, { size: 13 })
          )), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => onAlternarForzarCompleto(d, h, act.id),
              style: {
                background: act.forzarCompleto ? PAL.carmin : PAL.blanco,
                color: act.forzarCompleto ? PAL.blanco : PAL.tinta,
                border: `1px solid ${act.forzarCompleto ? PAL.carmin : PAL.linea}`
              },
              className: "w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium mb-2",
              title: "Marca esta clase como completa a mano, sin importar cuántas plazas queden libres de verdad"
            },
            act.forzarCompleto ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Check, { size: 13 }), " Marcada como completa a mano — pulsa para reactivarla") : "Marcar como completa a mano"
          ), alumnos.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { background: PAL.blanco, border: `1px solid ${PAL.linea}` }, className: "rounded-lg px-2 mb-2" }, alumnos.map((al, idx) => /* @__PURE__ */ React.createElement(
            FilaPersona,
            {
              key: idx,
              nombre: al.nombre,
              telefono: al.telefono,
              ts: al.ts,
              onQuitar: () => onQuitarInteresado(act.id, idx),
              tituloQuitar: "Quitar de esta clase",
              onGuardarEdicion: (n, t) => onEditarInteresado(act.id, idx, "interesados", n, t)
            }
          ))) : /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-xs mb-2" }, "Todavía no hay alumnado apuntado en esta clase."), /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ React.createElement(
            "input",
            {
              value: nuevoAlumnoNombre,
              onChange: (e) => setNuevoAlumnoNombre(e.target.value),
              placeholder: "Nombre",
              className: "w-full min-w-0 px-2.5 py-1.5 rounded-lg border text-xs",
              style: { borderColor: PAL.linea, background: PAL.blanco }
            }
          ), /* @__PURE__ */ React.createElement(
            "input",
            {
              value: nuevoAlumnoTelefono,
              onChange: (e) => setNuevoAlumnoTelefono(e.target.value),
              placeholder: "Teléfono",
              type: "tel",
              className: "w-full min-w-0 px-2.5 py-1.5 rounded-lg border text-xs",
              style: { borderColor: PAL.linea, background: PAL.blanco }
            }
          ), /* @__PURE__ */ React.createElement(
            "button",
            {
              onClick: () => {
                if (nuevoAlumnoNombre.trim().length < 2 || !telefonoValido(nuevoAlumnoTelefono)) return;
                onAnadirAlumno(d, h, act.id, nuevoAlumnoNombre.trim(), nuevoAlumnoTelefono.trim());
                setNuevoAlumnoNombre("");
                setNuevoAlumnoTelefono("");
              },
              disabled: nuevoAlumnoNombre.trim().length < 2 || !telefonoValido(nuevoAlumnoTelefono),
              style: {
                background: PAL.petroleo,
                opacity: nuevoAlumnoNombre.trim().length < 2 || !telefonoValido(nuevoAlumnoTelefono) ? 0.4 : 1
              },
              className: "w-full py-1.5 rounded-lg text-white text-xs flex items-center justify-center gap-1",
              title: "Añadir a esta clase"
            },
            /* @__PURE__ */ React.createElement(Plus, { size: 14 }),
            " Añadir a la clase"
          ))));
        })
      ));
    }))),
    tab === "disponibilidad" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { border: `1px solid ${PAL.linea}` }, className: "rounded-xl p-3 mb-4 space-y-3" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs block mb-1.5" }, "Nombre de esta sede (se ve en el selector y en todo el calendario público)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        key: "nombre-" + sede.nombre,
        defaultValue: sede.nombre,
        onBlur: (e) => onRenombrarSede(e.target.value),
        className: "w-full px-2.5 py-1.5 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    )), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("label", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs block mb-1.5" }, "Dirección (se muestra debajo del nombre, más pequeña)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        key: "direccion-" + sede.direccion,
        defaultValue: sede.direccion || "",
        onBlur: (e) => onEditarDireccionSede(e.target.value),
        placeholder: "Ej: Calle de los Narcisos, 14",
        className: "w-full px-2.5 py-1.5 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ))), /* @__PURE__ */ React.createElement(EditorDisponibilidad, { sede, onEditarDisponibilidad })),
    tab === "propuestas" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs mb-1" }, "Todas las propuestas abiertas del catálogo, con quién se ha apuntado a cada una."), listaPropuestas.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-sm" }, "No hay ninguna propuesta abierta ahora mismo."), listaPropuestas.slice().sort((a, b) => b.ultimoTs - a.ultimoTs).map((p) => {
      const duplicados = grupoDuplicado(p).filter((d) => d.id !== p.id);
      return /* @__PURE__ */ React.createElement("div", { key: p.id, style: { background: PAL.blanco, border: `1.5px dashed ${PAL.mostaza}` }, className: "p-4 rounded-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2 mb-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display }, className: "font-medium text-sm" }, p.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, opacity: 0.7 }, className: "text-[12px] mt-1" }, p.dia, " · ", p.hora, p.sala ? ` · ${p.sala}` : "")), /* @__PURE__ */ React.createElement(DotsProgreso, { n: p.personas.length })), duplicados.length > 0 && /* @__PURE__ */ React.createElement("div", { style: { background: PAL.papel, border: `1px solid ${PAL.carmin}` }, className: "rounded-xl p-2.5 mb-3" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin }, className: "text-[13px] mb-1.5" }, "Hay ", duplicados.length + 1, ' propuestas de "', p.nombre, '" en este mismo hueco — probablemente por error.'), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onFusionarPropuestas(p.dia, p.hora, p.id, duplicados[0].id),
          style: { background: PAL.carmin },
          className: "text-white text-xs px-3 py-1.5 rounded-lg"
        },
        "Fusionar con la otra (",
        duplicados[0].personas.length,
        " persona",
        duplicados[0].personas.length !== 1 ? "s" : "",
        ")"
      )), p.personas.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.62 }, className: "text-xs" }, "Nadie apuntado todavía.") : /* @__PURE__ */ React.createElement("div", null, p.personas.map((persona, idx) => /* @__PURE__ */ React.createElement(
        FilaPersona,
        {
          key: idx,
          nombre: persona.nombre,
          telefono: persona.telefono,
          ts: persona.ts,
          onQuitar: () => onQuitarInteresado(p.id, idx),
          tituloQuitar: "Dar de baja de esta propuesta",
          onGuardarEdicion: (n, t) => onEditarInteresado(p.id, idx, "interesados", n, t)
        }
      ))), confirmandoConversion === p.id ? /* @__PURE__ */ React.createElement("div", { style: { background: PAL.papel, border: `1.5px solid ${PAL.petroleo}` }, className: "rounded-xl p-3 mt-3" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta }, className: "text-xs mb-2 leading-relaxed" }, "Vas a convertir ", /* @__PURE__ */ React.createElement("strong", null, '"', p.nombre, '"'), " en clase activa.", " ", p.personas.length === 0 ? "Ahora mismo no hay nadie apuntado todavía." : `${p.personas.length} persona${p.personas.length !== 1 ? "s" : ""} pasará${p.personas.length !== 1 ? "n" : ""} directamente a ser alumnado de esa clase:`), p.personas.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "mb-3" }, /* @__PURE__ */ React.createElement("label", { style: { color: PAL.tinta, opacity: 0.85 }, className: "text-[13px] block mb-1" }, "¿Qué día es la clase de prueba a la que deben confirmar asistencia?"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: fechaPrueba,
          onChange: (e) => setFechaPrueba(e.target.value),
          style: { borderColor: PAL.linea, fontFamily: FONT.body },
          className: "w-full px-3 py-2 rounded-lg border bg-white text-xs outline-none"
        }
      ), !fechaPrueba && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.mostaza }, className: "text-[12px] mt-1" }, "Indica la fecha para poder avisar por WhatsApp — sin ella, el botón queda desactivado.")), p.personas.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "mb-3 space-y-1" }, p.personas.map((per, i) => {
        const hayQuorum = p.personas.length >= UMBRAL_PROPUESTA;
        const habilitado = hayQuorum && !!fechaPrueba;
        const fechaFormateada = fechaPrueba ? fechaPrueba.split("-").reverse().join("/") : "";
        const mensaje = `¡Hola ${per.nombre}!

¡Enhorabuena! 🎉

Gracias a tu propuesta (y a las demás personas interesadas), ya somos suficientes para que arranque la clase:

*${p.nombre} — ${p.dia} a las ${p.hora}h${p.sala ? `, ${p.sala}` : ""}*

*Tu clase de prueba* será el *${fechaFormateada}*. Por favor, confírmanos que puedes asistir ese día.

¡Nos vemos en Baildanzas! 💃🎉`;
        return /* @__PURE__ */ React.createElement("li", { key: i, className: "flex items-center justify-between gap-2" }, /* @__PURE__ */ React.createElement("span", { style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.85 }, className: "text-[13px]" }, "· ", per.nombre, " — ", per.telefono), habilitado ? /* @__PURE__ */ React.createElement(
          "a",
          {
            href: enlaceWhatsApp(per.telefono, mensaje),
            target: "_blank",
            rel: "noopener noreferrer",
            style: { background: "#25D366", color: "white" },
            className: "text-[12px] px-2 py-1 rounded-full font-medium shrink-0 flex items-center gap-1",
            title: "Avisar por WhatsApp"
          },
          /* @__PURE__ */ React.createElement(Phone, { size: 10 }),
          " WhatsApp"
        ) : /* @__PURE__ */ React.createElement(
          "span",
          {
            style: { background: PAL.linea, color: PAL.tinta, opacity: 0.7 },
            className: "text-[12px] px-2 py-1 rounded-full font-medium shrink-0 flex items-center gap-1 cursor-not-allowed",
            title: !hayQuorum ? `Se habilita al llegar a ${UMBRAL_PROPUESTA} personas` : "Indica primero la fecha de la clase de prueba"
          },
          /* @__PURE__ */ React.createElement(Phone, { size: 10 }),
          " WhatsApp"
        ));
      })), /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-[13px] mb-3" }, "No se pierde a nadie: pasan a la lista de la clase, y además queda una copia en la copia de seguridad exportable."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setConfirmandoConversion(null);
            setFechaPrueba("");
          },
          style: { borderColor: PAL.linea, color: PAL.tinta },
          className: "flex-1 py-2 rounded-lg border text-xs font-medium"
        },
        "Cancelar"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            onConvertirEnActiva(p.dia, p.hora, p.id, p.nombre, p.sala);
            setConfirmandoConversion(null);
            setFechaPrueba("");
          },
          style: { background: PAL.petroleo },
          className: "flex-1 py-2 rounded-lg text-white text-xs font-medium"
        },
        "Sí, convertir"
      ))) : /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => {
            setConfirmandoConversion(p.id);
            setFechaPrueba("");
          },
          style: {
            background: p.personas.length >= UMBRAL_PROPUESTA ? PAL.petroleo : "transparent",
            color: p.personas.length >= UMBRAL_PROPUESTA ? PAL.blanco : PAL.petroleo,
            border: `1.5px solid ${PAL.petroleo}`
          },
          className: "w-full mt-3 py-2 rounded-xl text-xs font-medium"
        },
        "Convertir en clase activa"
      ));
    })),
    tab === "sugerencias" && /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs mb-1" }, 'Actividades "Otra" propuestas por alumnos. No aparecen en el calendario hasta que las apruebes.'), sugerenciasPendientes.length === 0 && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-sm" }, "No hay sugerencias pendientes."), sugerenciasPendientes.map((s) => /* @__PURE__ */ React.createElement("div", { key: s.id, style: { background: PAL.blanco, border: `1.5px dashed ${PAL.mostaza}` }, className: "p-4 rounded-2xl" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-start justify-between gap-2" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.display }, className: "font-medium text-sm" }, s.nombre), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, opacity: 0.7 }, className: "text-[12px] mt-1" }, s.dia, " · ", s.hora)), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 shrink-0" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onRechazarSugerencia(s.id),
        style: { color: PAL.carmin, borderColor: PAL.linea },
        className: "p-1.5 border rounded-lg",
        title: "Rechazar"
      },
      /* @__PURE__ */ React.createElement(X, { size: 14 })
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onAprobarSugerencia(s.id),
        style: { background: PAL.petroleo },
        className: "p-1.5 rounded-lg text-white",
        title: "Aprobar y publicar como propuesta"
      },
      /* @__PURE__ */ React.createElement(Check, { size: 14 })
    ))), /* @__PURE__ */ React.createElement("div", { className: "mt-2" }, s.personas.map((c, i) => /* @__PURE__ */ React.createElement(FilaPersona, { key: i, nombre: c.nombre, telefono: c.telefono, ts: c.ts })))))),
    tab === "catalogo" && /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs mb-3" }, "Estas son las actividades que la gente puede elegir al proponer algo en un hueco libre."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: nCatalogo,
        onChange: (e) => setNCatalogo(e.target.value),
        placeholder: "Nueva actividad del catálogo",
        className: "flex-1 px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (!nCatalogo.trim()) return;
          onAnadirCatalogo(nCatalogo.trim());
          setNCatalogo("");
        },
        style: { background: PAL.tinta },
        className: "px-4 rounded-lg text-white text-sm shrink-0"
      },
      "Añadir"
    )), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5" }, catalogo.map((a) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: a,
        style: { background: PAL.blanco, border: `1px solid ${PAL.linea}`, color: PAL.tinta },
        className: "text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5"
      },
      a,
      /* @__PURE__ */ React.createElement("button", { onClick: () => onBorrarCatalogo(a), style: { color: PAL.carmin, opacity: 0.76 } }, /* @__PURE__ */ React.createElement(X, { size: 12 }))
    ))))
  ));
}
function EditorDisponibilidad({ sede, onEditarDisponibilidad }) {
  const salas = sede.salas || null;
  const [salaActiva, setSalaActiva] = useState(salas ? salas[0] : "__unica__");
  const [nuevoInicio, setNuevoInicio] = useState({});
  const [nuevoFin, setNuevoFin] = useState({});
  const ventanasDe = (dia) => sede.disponibilidad?.[dia]?.[salaActiva] || [];
  const anadirVentana = (dia) => {
    const inicio = nuevoInicio[dia];
    const fin = nuevoFin[dia];
    if (!inicio || !fin || inicio >= fin) return;
    const actuales = ventanasDe(dia);
    onEditarDisponibilidad(dia, salaActiva, [...actuales, { inicio, fin }].sort((a, b) => a.inicio.localeCompare(b.inicio)));
    setNuevoInicio((s) => ({ ...s, [dia]: "" }));
    setNuevoFin((s) => ({ ...s, [dia]: "" }));
  };
  const quitarVentana = (dia, idx) => {
    const actuales = ventanasDe(dia);
    onEditarDisponibilidad(dia, salaActiva, actuales.filter((_, i) => i !== idx));
  };
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.7 }, className: "text-xs mb-4" }, "Marca aquí qué días y a qué horas está abierta ", salas ? "cada sala" : "esta sede", ". Fuera de estas franjas, el hueco no aparece en el calendario público — ni para propuestas ni para clases."), salas && /* @__PURE__ */ React.createElement("div", { className: "flex gap-2 mb-4" }, salas.map((s) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: s,
      onClick: () => setSalaActiva(s),
      style: {
        background: salaActiva === s ? PAL.morado : "transparent",
        color: salaActiva === s ? PAL.blanco : PAL.tinta,
        border: `1px solid ${PAL.morado}`
      },
      className: "px-3 py-1.5 rounded-full text-xs font-medium"
    },
    s
  ))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, DIAS.map((dia) => {
    const ventanas = ventanasDe(dia);
    return /* @__PURE__ */ React.createElement("div", { key: dia, style: { border: `1px solid ${PAL.linea}` }, className: "rounded-xl p-3" }, /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono }, className: "text-[13px] uppercase tracking-wider mb-2" }, dia), ventanas.length === 0 ? /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin, opacity: 0.85 }, className: "text-xs mb-2" }, "Cerrado — ningún hueco disponible este día") : /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-1.5 mb-2" }, ventanas.map((v, i) => /* @__PURE__ */ React.createElement(
      "span",
      {
        key: i,
        style: { background: PAL.petroleo, color: PAL.papel, fontFamily: FONT.mono },
        className: "text-[12px] px-2.5 py-1 rounded-full flex items-center gap-1.5"
      },
      v.inicio,
      "–",
      v.fin,
      /* @__PURE__ */ React.createElement("button", { onClick: () => quitarVentana(dia, i), style: { opacity: 0.75 }, title: "Quitar esta franja" }, /* @__PURE__ */ React.createElement(X, { size: 11 }))
    ))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: nuevoInicio[dia] || "",
        onChange: (e) => setNuevoInicio((s) => ({ ...s, [dia]: e.target.value })),
        style: { borderColor: PAL.linea },
        className: "px-2 py-1 rounded-md border text-xs"
      }
    ), /* @__PURE__ */ React.createElement("span", { style: { opacity: 0.6 }, className: "text-xs" }, "a"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "time",
        value: nuevoFin[dia] || "",
        onChange: (e) => setNuevoFin((s) => ({ ...s, [dia]: e.target.value })),
        style: { borderColor: PAL.linea },
        className: "px-2 py-1 rounded-md border text-xs"
      }
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => anadirVentana(dia),
        disabled: !nuevoInicio[dia] || !nuevoFin[dia],
        style: { background: PAL.tinta, opacity: !nuevoInicio[dia] || !nuevoFin[dia] ? 0.4 : 1 },
        className: "px-3 py-1 rounded-md text-white text-xs"
      },
      "Añadir franja"
    )));
  })));
}
function FilaPersona({ nombre, telefono, ts, onQuitar, tituloQuitar, onGuardarEdicion }) {
  const [editando, setEditando] = useState(false);
  const [n, setN] = useState(nombre);
  const [t, setT] = useState(telefono);
  if (editando) {
    return /* @__PURE__ */ React.createElement("div", { style: { borderColor: PAL.linea }, className: "py-2.5 border-b last:border-b-0 space-y-2" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: n,
        onChange: (e) => setN(e.target.value),
        placeholder: "Nombre",
        className: "w-full px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: t,
        onChange: (e) => setT(e.target.value),
        placeholder: "Teléfono",
        type: "tel",
        className: "w-full px-3 py-2 rounded-lg border text-sm",
        style: { borderColor: PAL.linea }
      }
    ), n.trim().length > 1 && !telefonoValido(t) && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin }, className: "text-[13px]" }, "El teléfono debe tener al menos 9 dígitos."), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          setEditando(false);
          setN(nombre);
          setT(telefono);
        },
        style: { borderColor: PAL.linea, color: PAL.tinta },
        className: "flex-1 py-1.5 rounded-lg border text-xs"
      },
      "Cancelar"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => {
          if (n.trim().length < 2 || !telefonoValido(t)) return;
          onGuardarEdicion(n.trim(), t.trim());
          setEditando(false);
        },
        style: { background: PAL.morado },
        className: "flex-1 py-1.5 rounded-lg text-white text-xs"
      },
      "Guardar"
    )));
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { borderColor: PAL.linea },
      className: "flex items-center justify-between gap-2 py-2 border-b last:border-b-0"
    },
    /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: { background: PAL.linea, color: PAL.tinta },
        className: "w-6 h-6 rounded-full flex items-center justify-center text-[13px] font-medium shrink-0"
      },
      (nombre || "?").trim().charAt(0).toUpperCase()
    ), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("div", { style: { color: PAL.tinta }, className: "text-sm font-medium truncate" }, nombre), /* @__PURE__ */ React.createElement("div", { style: { fontFamily: FONT.mono, color: PAL.tinta, opacity: 0.73 }, className: "text-[13px] truncate" }, telefono, ts && /* @__PURE__ */ React.createElement("span", { className: "opacity-70" }, " · ", formatearFechaHora(ts))))),
    /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-0.5 shrink-0" }, onGuardarEdicion && /* @__PURE__ */ React.createElement("button", { onClick: () => setEditando(true), style: { color: PAL.morado, opacity: 0.8 }, className: "p-1.5", title: "Corregir nombre o teléfono" }, /* @__PURE__ */ React.createElement(Pencil, { size: 13 })), onQuitar && /* @__PURE__ */ React.createElement("button", { onClick: onQuitar, style: { color: PAL.carmin, opacity: 0.73 }, className: "p-1.5", title: tituloQuitar }, /* @__PURE__ */ React.createElement(Trash2, { size: 14 })))
  );
}
function Toast({ mensaje }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { background: PAL.tinta, color: PAL.papel, fontFamily: FONT.body },
      className: "fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm shadow-xl z-50 max-w-[90vw] text-center"
    },
    mensaje
  );
}
function BannerError({ mensaje, onRecargar, onCerrar }) {
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      style: { background: PAL.carmin, color: "white", fontFamily: FONT.body },
      className: "fixed top-0 left-0 right-0 z-[70] px-4 py-2.5 text-xs sm:text-sm flex items-center justify-center gap-3 flex-wrap text-center"
    },
    /* @__PURE__ */ React.createElement("span", null, "⚠️ ", mensaje),
    /* @__PURE__ */ React.createElement("button", { onClick: onRecargar, className: "underline font-medium shrink-0" }, "Recargar"),
    /* @__PURE__ */ React.createElement("button", { onClick: onCerrar, className: "opacity-80 hover:opacity-100 shrink-0" }, /* @__PURE__ */ React.createElement(X, { size: 14 }))
  );
}
function CandadoPIN({ onCerrar, onDesbloquear }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const comprobar = () => {
    if (pin === PIN_PANEL_GESTION) {
      onDesbloquear();
    } else {
      setError(true);
      setPin("");
    }
  };
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: onCerrar,
      style: { background: "rgba(36,30,49,0.55)", height: "100dvh" },
      className: "fixed inset-0 z-50 flex items-center justify-center p-4"
    },
    /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: (e) => e.stopPropagation(),
        style: { background: PAL.papel, border: `1px solid ${PAL.linea}` },
        className: "w-full max-w-xs rounded-3xl p-6 relative"
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onCerrar,
          style: { background: PAL.blanco, color: PAL.tinta, border: `1px solid ${PAL.linea}` },
          className: "absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
        },
        /* @__PURE__ */ React.createElement(X, { size: 18 })
      ),
      /* @__PURE__ */ React.createElement("div", { style: { color: PAL.morado }, className: "flex justify-center mb-3" }, /* @__PURE__ */ React.createElement(Settings, { size: 28 })),
      /* @__PURE__ */ React.createElement("h2", { style: { fontFamily: FONT.display, color: PAL.tinta }, className: "text-xl font-medium text-center mb-1" }, "Acceso del equipo"),
      /* @__PURE__ */ React.createElement("p", { style: { color: PAL.tinta, opacity: 0.76 }, className: "text-sm text-center mb-5" }, "Introduce el PIN para entrar al panel de gestión."),
      /* @__PURE__ */ React.createElement(
        "input",
        {
          value: pin,
          onChange: (e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          },
          onKeyDown: (e) => e.key === "Enter" && comprobar(),
          type: "password",
          inputMode: "numeric",
          autoFocus: true,
          placeholder: "PIN",
          style: { borderColor: error ? PAL.carmin : PAL.linea, background: PAL.blanco, color: PAL.tinta },
          className: "w-full px-4 py-3 rounded-xl border text-center text-lg tracking-[0.3em] outline-none mb-2"
        }
      ),
      error && /* @__PURE__ */ React.createElement("p", { style: { color: PAL.carmin }, className: "text-xs text-center mb-2" }, "PIN incorrecto, inténtalo de nuevo."),
      /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: comprobar,
          style: { background: PAL.morado },
          className: "w-full mt-3 py-3 rounded-xl text-white font-medium text-sm"
        },
        "Entrar"
      )
    )
  );
}

// entry.jsx
var root = createRoot(document.getElementById("root"));
root.render(React2.createElement(Baildanzas));
