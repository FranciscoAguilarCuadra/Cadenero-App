import { useCallback, useEffect, useState } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

import { isOnline, onConnectivityChange } from "../services/connectivity";
import {
    contarPendientes,
    eliminarDeCola,
    onColaChange,
    obtenerCola,
} from "../services/localCache";
import { onSyncProgress } from "../services/syncService";
import { formatearHora } from "../utils/fechas";

import "../styles/modal.css";
import "../styles/OfflineBanner.css";

const etiquetasTipo = {
    crear: "Alta de arriendo",
    editar: "Edición de arriendo",
    devolver: "Marcado como devuelto",
    reactivar: "Reactivación de arriendo",
    eliminar: "Eliminación de arriendo",
};

function describirOperacion(operacion) {
    const datos = operacion.datos || {};
    const etiqueta = etiquetasTipo[operacion.tipo] || operacion.tipo;
    const detalles = [];

    if (datos.tipo) {
        detalles.push(String(datos.tipo).toLowerCase());
    }

    if (datos.fechaIngreso) {
        const hora = formatearHora(datos.fechaIngreso);

        if (hora) {
            detalles.push(`hora ${hora}`);
        }
    }

    return detalles.length > 0
        ? `${etiqueta} · ${detalles.join(", ")}`
        : etiqueta;
}

function textoIntentos(operacion) {
    const intentos = operacion.intentos || 0;

    if (intentos === 0) return "Esperando para subir";

    return `${intentos} intento${intentos === 1 ? "" : "s"} sin éxito`;
}

export default function OfflineBanner() {
    const [online, setOnline] = useState(isOnline());
    const [pendientes, setPendientes] = useState(0);
    const [sincronizando, setSincronizando] = useState(false);
    const [sincronizadas, setSincronizadas] = useState(0);
    const [detalleAbierto, setDetalleAbierto] = useState(false);
    const [operaciones, setOperaciones] = useState([]);
    const [confirmando, setConfirmando] = useState(null);

    const recalcularPendientes = useCallback(async () => {
        const cuenta = await contarPendientes();
        setPendientes(cuenta);
    }, []);

    const abrirDetalle = useCallback(async () => {
        try {
            setOperaciones(await obtenerCola());
        } catch (error) {
            console.error("No se pudo leer la cola de sincronización.", error);
            setOperaciones([]);
        }

        setDetalleAbierto(true);
    }, []);

    const cerrarDetalle = useCallback(() => {
        setDetalleAbierto(false);
        setConfirmando(null);
    }, []);

    // Salida para un cambio que nunca podrá subirse: se elimina sin subirlo.
    const descartarOperacion = useCallback(async () => {
        const operacion = confirmando;

        if (!operacion) return;

        try {
            await eliminarDeCola(operacion.operacionId);
            setOperaciones((actuales) =>
                actuales.filter(
                    (item) => item.operacionId !== operacion.operacionId
                )
            );
        } catch (error) {
            console.error("No se pudo descartar el cambio pendiente.", error);
        } finally {
            setConfirmando(null);
        }
    }, [confirmando]);

    useEffect(() => {
        const unsubscribe = onConnectivityChange(setOnline);
        return unsubscribe;
    }, []);

    // El conteo se actualiza en el momento en que algo entra o sale de la cola.
    useEffect(() => {
        return onColaChange(
            () => {
                void recalcularPendientes();
            },
            { notificarAlInicio: true }
        );
    }, [recalcularPendientes]);

    useEffect(() => {
        return onSyncProgress(
            ({ sincronizando: activa, pendientes: restantes, completadas }) => {
                setSincronizando(activa);
                setSincronizadas(completadas);
                setPendientes(restantes);
            }
        );
    }, []);

    let variante = "";
    let texto = "";

    if (sincronizando) {
        variante = "syncing";
        texto = `Sincronizando… ${sincronizadas} de ${sincronizadas + pendientes}`;
    } else if (!online && pendientes > 0) {
        variante = "pending";
        texto = `Sin conexión — ${pendientes} cambio${
            pendientes !== 1 ? "s" : ""
        } pendiente${pendientes !== 1 ? "s" : ""}`;
    } else if (!online) {
        variante = "offline";
        texto = "Sin conexión — los cambios se guardarán localmente";
    } else if (pendientes > 0) {
        variante = "pending";
        texto = `${pendientes} cambio${pendientes !== 1 ? "s" : ""} pendiente${
            pendientes !== 1 ? "s" : ""
        } de sincronizar`;
    }

    const sePuedeAbrirDetalle = pendientes > 0 && !sincronizando;

    return (
        <>
            {variante &&
                (sePuedeAbrirDetalle ? (
                    <button
                        type="button"
                        className={`offline-banner ${variante}`}
                        onClick={abrirDetalle}
                        aria-live="polite"
                        aria-label={`${texto}. Ver qué cambios están pendientes`}
                    >
                        <span className="offline-dot" />
                        {texto}
                        <span className="offline-banner-enlace">Ver detalle</span>
                    </button>
                ) : (
                    <div className={`offline-banner ${variante}`} role="status">
                        <span className="offline-dot" />
                        {texto}
                    </div>
                ))}

            {detalleAbierto && (
                <div className="app-dialog-overlay" role="presentation">
                    <section
                        className="app-dialog app-dialog-info"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="detalle-pendientes-titulo"
                    >
                        <div className="app-dialog-icon" aria-hidden="true">
                            <FaCloudUploadAlt />
                        </div>

                        <div className="app-dialog-content">
                            <h2 id="detalle-pendientes-titulo">
                                {confirmando
                                    ? "Descartar cambio"
                                    : "Cambios pendientes"}
                            </h2>

                            {confirmando ? (
                                <>
                                    <p className="detalle-pendientes-confirmacion">
                                        <strong>
                                            {describirOperacion(confirmando)}
                                        </strong>
                                        : este cambio se eliminará sin subirlo
                                        nunca. No se puede deshacer.
                                    </p>

                                    <p className="detalle-pendientes-nota">
                                        Es la salida para un cambio que no puede
                                        subirse, como uno que la base de datos
                                        rechaza. Lo normal es dejar que se suba
                                        solo.
                                    </p>
                                </>
                            ) : (
                                <>
                                    {operaciones.length === 0 ? (
                                        <p className="detalle-pendientes-nota">
                                            No hay cambios pendientes.
                                        </p>
                                    ) : (
                                        <ul className="detalle-pendientes">
                                            {operaciones.map((operacion) => (
                                                <li key={operacion.operacionId}>
                                                    <strong>
                                                        {describirOperacion(
                                                            operacion
                                                        )}
                                                    </strong>
                                                    <span>
                                                        {textoIntentos(
                                                            operacion
                                                        )}
                                                    </span>

                                                    {operacion.ultimoError && (
                                                        <small>
                                                            Último error:{" "}
                                                            {operacion.ultimoError}
                                                        </small>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className="detalle-pendientes-descartar"
                                                        onClick={() =>
                                                            setConfirmando(
                                                                operacion
                                                            )
                                                        }
                                                    >
                                                        Descartar este cambio
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <p className="detalle-pendientes-nota">
                                        Estos cambios están guardados en este
                                        teléfono y se subirán solos cuando haya
                                        conexión. Nada se descarta solo.
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="app-dialog-actions">
                            {confirmando ? (
                                <>
                                    <button
                                        type="button"
                                        className="app-dialog-button app-dialog-button-secondary"
                                        onClick={() => setConfirmando(null)}
                                    >
                                        Volver
                                    </button>

                                    <button
                                        type="button"
                                        className="app-dialog-button app-dialog-button-primary"
                                        onClick={descartarOperacion}
                                    >
                                        Sí, descartar
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="app-dialog-button app-dialog-button-primary"
                                    onClick={cerrarDetalle}
                                >
                                    Cerrar
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
