import { openDB } from "idb";

const DB_NAME = "cadenero-offline";
const DB_VERSION = 1;
const STORE_PRESTAMOS = "prestamos";
const STORE_COLA = "cola";
const STORE_META = "meta";

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

// ─── Prestamos ─────────────────────────────────────

export async function guardarPrestamosLocal(prestamos) {
    const db = await getDB();
    const tx = db.transaction(STORE_PRESTAMOS, "readwrite");
    const store = tx.objectStore(STORE_PRESTAMOS);

    for (const prestamo of prestamos) {
        store.put(prestamo);
    }

    await tx.done;
}

export async function agregarPrestamoLocal(prestamo) {
    const db = await getDB();
    await db.put(STORE_PRESTAMOS, prestamo);
}

export async function actualizarPrestamoLocal(prestamo) {
    const db = await getDB();
    await db.put(STORE_PRESTAMOS, prestamo);
}

export async function obtenerPrestamoLocal(id) {
    const db = await getDB();
    return db.get(STORE_PRESTAMOS, id);
}

export async function eliminarPrestamoLocal(id) {
    const db = await getDB();
    await db.delete(STORE_PRESTAMOS, id);
}

export async function reemplazarPrestamosLocal(prestamos) {
    const db = await getDB();
    const tx = db.transaction(STORE_PRESTAMOS, "readwrite");
    await tx.objectStore(STORE_PRESTAMOS).clear();
    for (const p of prestamos) {
        tx.objectStore(STORE_PRESTAMOS).put(p);
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

    await db.put(STORE_COLA, entrada);
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
}

export async function actualizarOperacionCola(operacion) {
    const db = await getDB();
    await db.put(STORE_COLA, operacion);
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
