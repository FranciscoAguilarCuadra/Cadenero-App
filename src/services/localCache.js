import { openDB } from "idb";

const DB_NAME = "cadenero-offline";
const DB_VERSION = 1;
const STORE_PRESTAMOS = "prestamos";
const STORE_COLA = "cola";
const STORE_META = "meta";

// El id de un arriendo viaja como texto en Supabase. Se normaliza al entrar y al
// salir del almacén para que una misma copia no viva dos veces (el número y el
// texto son claves distintas en IndexedDB).
function conIdTexto(registro) {
    return registro && registro.id !== undefined
        ? { ...registro, id: String(registro.id) }
        : registro;
}

async function getDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains(STORE_PRESTAMOS)) {
                db.createObjectStore(STORE_PRESTAMOS, { keyPath: "id" });
            }
            if (!db.objectStoreNames.contains(STORE_COLA)) {
                const colaStore = db.createObjectStore(STORE_COLA, {
                    keyPath: "operacionId",
                });
                colaStore.createIndex("porFecha", "timestamp");
            }
            if (!db.objectStoreNames.contains(STORE_META)) {
                db.createObjectStore(STORE_META, { keyPath: "clave" });
            }
        },
    });
}

// ─── Avisos de cambios en la cola ───────────────────

let listenersCola = [];

export function onColaChange(callback, { notificarAlInicio = false } = {}) {
    listenersCola.push(callback);

    if (notificarAlInicio) {
        // Quien se suscribe recibe también el estado actual, no solo los cambios.
        queueMicrotask(() => callback());
    }

    return () => {
        listenersCola = listenersCola.filter((fn) => fn !== callback);
    };
}

function notificarCambioCola() {
    listenersCola.forEach((fn) => fn());
}

// ─── Prestamos ─────────────────────────────────────

export async function guardarPrestamosLocal(prestamos) {
    const db = await getDB();
    const tx = db.transaction(STORE_PRESTAMOS, "readwrite");
    const store = tx.objectStore(STORE_PRESTAMOS);

    for (const prestamo of prestamos) {
        store.put(conIdTexto(prestamo));
    }

    await tx.done;
}

export async function agregarPrestamoLocal(prestamo) {
    const db = await getDB();
    await db.put(STORE_PRESTAMOS, conIdTexto(prestamo));
}

export async function actualizarPrestamoLocal(prestamo) {
    const db = await getDB();
    await db.put(STORE_PRESTAMOS, conIdTexto(prestamo));
}

export async function obtenerPrestamoLocal(id) {
    const db = await getDB();
    return db.get(STORE_PRESTAMOS, String(id));
}

export async function eliminarPrestamoLocal(id) {
    const db = await getDB();
    await db.delete(STORE_PRESTAMOS, String(id));
}

/**
 * Fusiona lo que viene del servidor con lo que hay en el teléfono.
 *
 * Un arriendo nunca se borra solo: se elimina únicamente lo que el servidor
 * confirma ausente y que además no tenga ninguna operación pendiente.
 */
export async function sincronizarPrestamosLocales(prestamos) {
    const db = await getDB();
    const tx = db.transaction([STORE_PRESTAMOS, STORE_COLA], "readwrite");
    const storePrestamos = tx.objectStore(STORE_PRESTAMOS);
    const storeCola = tx.objectStore(STORE_COLA);

    const locales = await storePrestamos.getAll();
    const operaciones = await storeCola.getAll();

    const idsRemotos = new Set(prestamos.map((prestamo) => String(prestamo.id)));
    const idsPendientes = new Set(
        operaciones.map((operacion) => String(operacion.datos?.id))
    );

    for (const prestamo of prestamos) {
        storePrestamos.put(conIdTexto(prestamo));
    }

    for (const local of locales) {
        const id = String(local.id);

        if (idsRemotos.has(id)) {
            // Copia anterior con el id en otro formato: ya entró la del servidor.
            if (typeof local.id !== "string") {
                storePrestamos.delete(local.id);
            }
            continue;
        }

        if (!idsPendientes.has(id)) {
            storePrestamos.delete(local.id);
        }
    }

    await tx.done;
}

export async function cargarPrestamosLocal() {
    const db = await getDB();
    return db.getAll(STORE_PRESTAMOS);
}

// ─── Cola de operaciones ───────────────────────────

export async function encolarOperacion(operacion) {
    const db = await getDB();
    const id = `op-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const entrada = {
        operacionId: id,
        ...operacion,
        timestamp: Date.now(),
        estado: "pendiente",
        intentos: 0,
    };

    if (entrada.datos && entrada.datos.id !== undefined) {
        entrada.datos = conIdTexto(entrada.datos);
    }

    await db.put(STORE_COLA, entrada);
    notificarCambioCola();
    return entrada;
}

export async function obtenerCola() {
    const db = await getDB();
    const todos = await db.getAll(STORE_COLA);
    return todos.sort((a, b) => a.timestamp - b.timestamp);
}

export async function eliminarDeCola(operacionId) {
    const db = await getDB();
    await db.delete(STORE_COLA, operacionId);
    notificarCambioCola();
}

export async function actualizarOperacionCola(operacion) {
    const db = await getDB();
    await db.put(STORE_COLA, operacion);
    notificarCambioCola();
}

export async function contarPendientes() {
    const db = await getDB();
    return db.count(STORE_COLA);
}

// ─── Meta (perfil, config) ─────────────────────────

export async function guardarMeta(clave, valor) {
    const db = await getDB();
    await db.put(STORE_META, { clave, valor, fecha: Date.now() });
}

export async function obtenerMeta(clave) {
    const db = await getDB();
    const entrada = await db.get(STORE_META, clave);
    return entrada?.valor ?? null;
}

export async function eliminarMeta(clave) {
    const db = await getDB();
    await db.delete(STORE_META, clave);
}
