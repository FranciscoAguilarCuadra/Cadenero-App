import {
    obtenerCola,
    eliminarDeCola,
    actualizarOperacionCola,
    contarPendientes,
} from "./localCache";
import {
    guardarPrestamo,
    marcarPrestamoDevuelto,
    reactivarPrestamo,
    eliminarPrestamo,
} from "./prestamosService";

let estaSincronizando = false;
let listenersProgreso = [];

export function onSyncProgress(callback) {
    listenersProgreso.push(callback);
    return () => {
        listenersProgreso = listenersProgreso.filter((fn) => fn !== callback);
    };
}

function notificarProgreso({ sincronizando, pendientes, completadas }) {
    listenersProgreso.forEach((fn) =>
        fn({ sincronizando, pendientes, completadas })
    );
}

/**
 * Sube todo lo pendiente. Ninguna operación se descarta jamás: si algo falla,
 * se queda en la cola y se reintenta en la próxima oportunidad, porque un
 * arriendo capturado no puede perderse.
 */
export async function sincronizarCola() {
    if (estaSincronizando) return { exito: true, sincronizadas: 0 };

    estaSincronizando = true;

    let completadas = 0;

    try {
        const cola = await obtenerCola();
        const total = cola.length;

        if (total === 0) {
            return { exito: true, sincronizadas: 0 };
        }

        notificarProgreso({
            sincronizando: true,
            pendientes: total,
            completadas,
        });

        // Las operaciones de un mismo arriendo se procesan en orden y se detienen
        // en el primer fallo de ese arriendo: así un cambio viejo nunca puede
        // pisar a uno más nuevo al reintentar. Los demás arriendos siguen igual.
        const operacionesPorRegistro = new Map();

        for (const operacion of cola) {
            const id = String(operacion.datos?.id ?? operacion.operacionId);

            if (!operacionesPorRegistro.has(id)) {
                operacionesPorRegistro.set(id, []);
            }

            operacionesPorRegistro.get(id).push(operacion);
        }

        for (const operaciones of operacionesPorRegistro.values()) {
            for (const operacion of operaciones) {
                try {
                    await ejecutarOperacion(operacion);
                    await eliminarDeCola(operacion.operacionId);
                    completadas += 1;

                    notificarProgreso({
                        sincronizando: true,
                        pendientes: total - completadas,
                        completadas,
                    });
                } catch (error) {
                    console.error(
                        `Error sincronizando operación ${operacion.operacionId}:`,
                        error
                    );

                    operacion.intentos = (operacion.intentos || 0) + 1;
                    operacion.ultimoError = error.message;
                    operacion.ultimoIntento = Date.now();
                    await actualizarOperacionCola(operacion);

                    // Este arriendo espera el próximo intento.
                    break;
                }
            }
        }

        const pendientes = await contarPendientes();

        return { exito: pendientes === 0, sincronizadas: completadas };
    } finally {
        estaSincronizando = false;

        // El estado final se publica siempre, aunque algo falle por el camino:
        // el aviso nunca se queda colgado en "Sincronizando…".
        const pendientes = await contarPendientes().catch(() => 0);
        notificarProgreso({
            sincronizando: false,
            pendientes,
            completadas,
        });
    }
}

async function ejecutarOperacion(operacion) {
    switch (operacion.tipo) {
        case "crear":
            await guardarPrestamo(operacion.datos, { esSync: true });
            break;

        case "editar":
            await guardarPrestamo(operacion.datos, { esSync: true });
            break;

        case "devolver":
            await marcarPrestamoDevuelto(operacion.datos.id, { esSync: true });
            break;

        case "reactivar":
            await reactivarPrestamo(operacion.datos.id, { esSync: true });
            break;

        case "eliminar":
            await eliminarPrestamo(
                {
                    id: operacion.datos.id,
                    fotosVehiculo: operacion.datos.fotos || [],
                },
                { esSync: true }
            );
            break;

        default:
            throw new Error(`Tipo de operación desconocido: ${operacion.tipo}`);
    }
}
