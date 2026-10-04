import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import OfflineBanner from "./components/OfflineBanner";
import prestamosIniciales from "./data/prestamos";
import { isSupabaseConfigured } from "./supabase";
import { isOnline, onConnectivityChange } from "./services/connectivity";
import { sincronizarCola } from "./services/syncService";
import {
    fijarCuentaActiva,
    guardarMeta,
    obtenerCola,
    obtenerMeta,
    onColaChange,
} from "./services/localCache";

const Admin = lazy(() => import("./pages/Admin"));
import {
    cerrarSesion,
    escucharCambiosSesion,
    iniciarSesion,
    obtenerPerfilUsuario,
    obtenerSesionActual,
} from "./services/authService";
import {
    eliminarPrestamo as eliminarPrestamoRemoto,
    guardarPrestamo as guardarPrestamoRemoto,
    marcarPrestamoDevuelto,
    obtenerPrestamos,
    reactivarPrestamo as reactivarPrestamoRemoto,
} from "./services/prestamosService";

const campoLegacy = "ca" + "dena";

function normalizarPrestamo(prestamo) {
    const prestamoNormalizado = { ...prestamo };
    const fotosVehiculo = Array.isArray(prestamoNormalizado.fotosVehiculo)
        ? prestamoNormalizado.fotosVehiculo.filter(Boolean)
        : [];

    if (fotosVehiculo.length === 0 && prestamoNormalizado.fotoVehiculo) {
        fotosVehiculo.push(prestamoNormalizado.fotoVehiculo);
    }

    prestamoNormalizado.tipo = prestamoNormalizado.tipo || "Arriendo";
    prestamoNormalizado.fotosVehiculo = fotosVehiculo;
    prestamoNormalizado.fotoVehiculo = fotosVehiculo[0] || "";
    prestamoNormalizado.danioPrevio = Boolean(
        prestamoNormalizado.danioPrevio ?? prestamoNormalizado.danio_previo
    );
    delete prestamoNormalizado[campoLegacy];

    return prestamoNormalizado;
}

function obtenerPrestamosLocales() {
    const guardados = localStorage.getItem("prestamos");
    const prestamosCargados = guardados ? JSON.parse(guardados) : prestamosIniciales;

    return prestamosCargados.map(normalizarPrestamo);
}

async function cargarPerfilCacheado() {
    try {
        return await obtenerMeta("perfil");
    } catch {
        return null;
    }
}

async function guardarPerfilCacheado(perfil) {
    try {
        await guardarMeta("perfil", perfil);
    } catch {
        // Ignorar errores de caché
    }
}

function App() {
    const [prestamos, setPrestamos] = useState(() =>
        isSupabaseConfigured ? [] : obtenerPrestamosLocales()
    );
    const [sesion, setSesion] = useState(null);
    const [perfil, setPerfil] = useState(null);
    const [cargandoAuth, setCargandoAuth] = useState(isSupabaseConfigured);
    const [cargandoPrestamos, setCargandoPrestamos] = useState(false);
    const [errorCargaPrestamos, setErrorCargaPrestamos] = useState("");
    const [idsPendientes, setIdsPendientes] = useState(() => new Set());

    const actualizarIdsPendientes = useCallback(async () => {
        try {
            const operaciones = await obtenerCola();
            setIdsPendientes(
                new Set(
                    operaciones.map((operacion) => String(operacion.datos?.id))
                )
            );
        } catch (error) {
            console.error("No se pudo leer la cola de sincronización.", error);
        }
    }, []);

    // ─── Aislamiento por cuenta ──────────────────────
    // La cola del equipo se abre por cuenta: cada uno ve y sube lo suyo.
    useEffect(() => {
        fijarCuentaActiva(perfil);
    }, [perfil]);

    useEffect(() => {
        if (!isSupabaseConfigured) return undefined;

        return onColaChange(
            () => {
                void actualizarIdsPendientes();
            },
            { notificarAlInicio: true }
        );
    }, [actualizarIdsPendientes]);

    const cargarPrestamosRemotos = useCallback(
        async function cargarPrestamosRemotos(perfilUsuario) {
            setCargandoPrestamos(true);
            setErrorCargaPrestamos("");

            try {
                const prestamosRemotos = await obtenerPrestamos(perfilUsuario);
                setPrestamos(prestamosRemotos.map(normalizarPrestamo));
            } catch (error) {
                if (navigator.onLine) {
                    setErrorCargaPrestamos(
                        "No se pudieron cargar los arriendos. Revisa tu conexión e intenta nuevamente."
                    );
                } else {
                    setErrorCargaPrestamos(
                        "Sin conexión. Se muestran los datos guardados localmente."
                    );
                }
                console.error(error);
            } finally {
                setCargandoPrestamos(false);
            }
        },
        []
    );

    const aplicarSesion = useCallback(
        async function aplicarSesion(nuevaSesion) {
            setSesion(nuevaSesion);

            if (!nuevaSesion) {
                setPerfil(null);
                setPrestamos([]);
                return;
            }

            try {
                const perfilUsuario = await obtenerPerfilUsuario(nuevaSesion.user.id);

                if (!perfilUsuario.activo) {
                    await cerrarSesion();
                    setPerfil(null);
                    throw new Error("Tu cuenta aún no está activa.");
                }

                setPerfil(perfilUsuario);
                await guardarPerfilCacheado(perfilUsuario);
                await cargarPrestamosRemotos(perfilUsuario);
            } catch (error) {
                // Si falla la red, intentar con perfil cacheado
                if (!navigator.onLine) {
                    const perfilCacheado = await cargarPerfilCacheado();
                    if (perfilCacheado) {
                        setPerfil(perfilCacheado);
                        await cargarPrestamosRemotos(perfilCacheado);
                        return;
                    }
                }
                setPerfil(null);
                setPrestamos([]);
                console.error(error);
            }
        },
        [cargarPrestamosRemotos]
    );

    // ─── Cargar sesión inicial ─────────────────────
    useEffect(() => {
        if (!isSupabaseConfigured) return;

        async function cargarSesionInicial() {
            try {
                const sesionActual = await obtenerSesionActual();
                await aplicarSesion(sesionActual);
            } catch (error) {
                // Si falla la red, intentar con sesión/perfil cacheado
                if (!navigator.onLine) {
                    const perfilCacheado = await cargarPerfilCacheado();
                    if (perfilCacheado) {
                        setPerfil(perfilCacheado);
                        await cargarPrestamosRemotos(perfilCacheado);
                    }
                }
                console.error(error);
            } finally {
                setCargandoAuth(false);
            }
        }

        const dejarDeEscuchar = escucharCambiosSesion((nuevaSesion, event) => {
            if (event === "TOKEN_REFRESHED") return;
            aplicarSesion(nuevaSesion);
        });

        cargarSesionInicial();

        return dejarDeEscuchar;
    }, [aplicarSesion, cargarPrestamosRemotos]);

    // ─── Sincronizar al reconectar y al volver a la app ─
    useEffect(() => {
        if (!isSupabaseConfigured) return undefined;

        async function sincronizarYRefrescar() {
            try {
                await sincronizarCola();

                // Refrescar datos desde servidor después de sync
                if (perfil) {
                    await cargarPrestamosRemotos(perfil);
                }
            } catch (error) {
                console.error("Error durante sincronización:", error);
            }
        }

        const unsubscribe = onConnectivityChange((online) => {
            if (online) {
                void sincronizarYRefrescar();
            }
        });

        function alVolverALaApp() {
            if (document.visibilityState === "visible" && isOnline()) {
                void sincronizarYRefrescar();
            }
        }

        document.addEventListener("visibilitychange", alVolverALaApp);

        // Al abrir la app también se intenta subir lo que haya quedado pendiente.
        void sincronizarYRefrescar();

        return () => {
            unsubscribe();
            document.removeEventListener("visibilitychange", alVolverALaApp);
        };
    }, [perfil, cargarPrestamosRemotos]);

    // ─── Guardar en localStorage (modo sin Supabase) ─
    useEffect(() => {
        if (isSupabaseConfigured) return;

        localStorage.setItem(
            "prestamos",
            JSON.stringify(prestamos.map(normalizarPrestamo))
        );
    }, [prestamos]);

    async function manejarLogin(email, password) {
        const nuevaSesion = await iniciarSesion(email, password);
        const perfilUsuario = await obtenerPerfilUsuario(nuevaSesion.user.id);

        if (!perfilUsuario.activo) {
            await cerrarSesion();
            throw new Error("Tu cuenta aún no está activa.");
        }

        setSesion(nuevaSesion);
        setPerfil(perfilUsuario);
        await guardarPerfilCacheado(perfilUsuario);
        await cargarPrestamosRemotos(perfilUsuario);
    }

    async function manejarLogout() {
        if (isSupabaseConfigured) {
            await cerrarSesion();
        }

        setSesion(null);
        setPerfil(null);
        setPrestamos([]);
    }

    async function agregarPrestamo(nuevoPrestamo) {
        const prestamoNormalizado = normalizarPrestamo({
            ...nuevoPrestamo,
            usuarioId: perfil?.id || null,
        });

        if (isSupabaseConfigured) {
            const prestamoGuardado = await guardarPrestamoRemoto(prestamoNormalizado);
            setPrestamos((prestamosActuales) => [
                normalizarPrestamo(prestamoGuardado),
                ...prestamosActuales,
            ]);
            return;
        }

        setPrestamos((prestamosActuales) => [
            prestamoNormalizado,
            ...prestamosActuales,
        ]);
    }

    async function editarPrestamo(prestamoEditado) {
        const prestamoNormalizado = normalizarPrestamo(prestamoEditado);

        if (isSupabaseConfigured) {
            const prestamoGuardado = await guardarPrestamoRemoto(prestamoNormalizado);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoGuardado.id
                        ? normalizarPrestamo(prestamoGuardado)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === prestamoNormalizado.id ? prestamoNormalizado : prestamo
            )
        );
    }

    async function devolverPrestamo(id) {
        if (isSupabaseConfigured) {
            const prestamoDevuelto = await marcarPrestamoDevuelto(id);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoDevuelto.id
                        ? normalizarPrestamo(prestamoDevuelto)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === id
                    ? {
                          ...prestamo,
                          estado: "Devuelto",
                          fechaDevolucion: new Date().toISOString(),
                      }
                    : prestamo
            )
        );
    }

    async function reactivarPrestamo(prestamoReactivado) {
        if (isSupabaseConfigured) {
            const prestamoActivo = await reactivarPrestamoRemoto(prestamoReactivado.id);

            setPrestamos((prestamosActuales) =>
                prestamosActuales.map((prestamo) =>
                    prestamo.id === prestamoActivo.id
                        ? normalizarPrestamo(prestamoActivo)
                        : prestamo
                )
            );
            return;
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.map((prestamo) =>
                prestamo.id === prestamoReactivado.id
                    ? {
                          ...prestamo,
                          estado: "Activo",
                          fechaDevolucion: null,
                      }
                    : prestamo
            )
        );
    }

    async function eliminarPrestamo(prestamoEliminado) {
        if (isSupabaseConfigured) {
            await eliminarPrestamoRemoto(prestamoEliminado);
        }

        setPrestamos((prestamosActuales) =>
            prestamosActuales.filter(
                (prestamo) => prestamo.id !== prestamoEliminado.id
            )
        );
    }

    const prestamosActivos = prestamos.filter(
        (prestamo) => prestamo.estado === "Activo"
    );

    const prestamosDevueltos = prestamos.filter(
        (prestamo) => prestamo.estado === "Devuelto"
    );

    if (cargandoAuth) {
        return <main className="app-loading">Cargando sesión...</main>;
    }

    if (isSupabaseConfigured && (!sesion || !perfil?.activo)) {
        return <Login onLogin={manejarLogin} />;
    }

    return (
        <>
            {isSupabaseConfigured && <OfflineBanner />}
            <Routes>
                <Route
                    path="/"
                    element={
                        <Dashboard
                            prestamos={prestamosActivos}
                            cargandoPrestamos={cargandoPrestamos}
                            mensajeExterno={errorCargaPrestamos}
                            usuario={perfil}
                            pendientesIds={idsPendientes}
                            onAgregarPrestamo={agregarPrestamo}
                            onEditarPrestamo={editarPrestamo}
                            onDevolverPrestamo={devolverPrestamo}
                            onEliminarPrestamo={eliminarPrestamo}
                            onLogout={manejarLogout}
                        />
                    }
                />

                <Route
                    path="/historial"
                    element={
                        <Historial
                            prestamos={prestamosDevueltos}
                            mensajeExterno={errorCargaPrestamos}
                            usuario={perfil}
                            pendientesIds={idsPendientes}
                            onEliminarPrestamo={eliminarPrestamo}
                            onReactivarPrestamo={reactivarPrestamo}
                            onLogout={manejarLogout}
                        />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        perfil?.rol === "admin" ? (
                            <Suspense fallback={<main className="app-loading">Cargando...</main>}>
                                <Admin
                                    usuarioActual={perfil}
                                    onLogout={manejarLogout}
                                    onUsuarioActualizado={setPerfil}
                                />
                            </Suspense>
                        ) : (
                            <Navigate to="/" replace />
                        )
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;
