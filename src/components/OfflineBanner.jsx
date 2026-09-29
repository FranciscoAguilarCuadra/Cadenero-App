import { useEffect, useState } from "react";

import { isOnline, onConnectivityChange } from "../services/connectivity";
import { contarPendientes } from "../services/localCache";
import { onSyncProgress } from "../services/syncService";

import "../styles/OfflineBanner.css";

export default function OfflineBanner() {
    const [online, setOnline] = useState(isOnline());
    const [pendientes, setPendientes] = useState(0);
    const [sincronizando, setSincronizando] = useState(false);
    const [sincronizadas, setSincronizadas] = useState(0);

    useEffect(() => {
        const unsub = onConnectivityChange(setOnline);
        return unsub;
    }, []);

    useEffect(() => {
        let mounted = true;

        async function cargar() {
            const count = await contarPendientes();
            if (mounted) setPendientes(count);
        }

        cargar();

        const unsubSync = onSyncProgress(({ pendientes: p, completadas: c, total }) => {
            if (!mounted) return;

            if (total === 0) {
                setSincronizando(false);
                setSincronizadas(0);
                setPendientes(0);
            } else {
                setSincronizando(true);
                setPendientes(p);
                setSincronizadas(c);
            }
        });

        return () => {
            mounted = false;
            unsubSync();
        };
    }, [online]);

    if (sincronizando) {
        return (
            <div className="offline-banner syncing" role="status">
                <span className="offline-dot" />
                Sincronizando… {sincronizadas} de {sincronizadas + pendientes}
            </div>
        );
    }

    if (!online && pendientes > 0) {
        return (
            <div className="offline-banner pending" role="status">
                <span className="offline-dot" />
                Sin conexión — {pendientes} cambio{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""}
            </div>
        );
    }

    if (!online) {
        return (
            <div className="offline-banner offline" role="status">
                <span className="offline-dot" />
                Sin conexión — los cambios se guardarán localmente
            </div>
        );
    }

    if (pendientes > 0) {
        return (
            <div className="offline-banner pending" role="status">
                <span className="offline-dot" />
                {pendientes} cambio{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} de sincronizar
            </div>
        );
    }

    return null;
}
