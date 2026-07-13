import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import Login from "./pages/Login";
import prestamosIniciales from "./data/prestamos";
import { isSupabaseConfigured } from "./supabase";
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
    delete prestamoNormalizado[campoLegacy];

    return prestamoNormalizado;
}

function obtenerPrestamosLocales() {
    const guardados = localStorage.getItem("prestamos");
    const prestamosCargados = guardados ? JSON.parse(guardados) : prestamosIniciales;

    return prestamosCargados.map(normalizarPrestamo);
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

    const cargarPrestamosRemotos = useCallback(
        async function cargarPrestamosRemotos(perfilUsuario) {
            setCargandoPrestamos(true);
            setErrorCargaPrestamos("");

            try {
                const prestamosRemotos = await obtenerPrestamos(perfilUsuario);
                setPrestamos(prestamosRemotos.map(normalizarPrestamo));
            } catch (error) {
                setErrorCargaPrestamos(
                    "No se pudieron cargar los arriendos. Revisa tu conexión e intenta nuevamente."
                );
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
                await cargarPrestamosRemotos(perfilUsuario);
            } catch (error) {
                setPerfil(null);
                setPrestamos([]);
                console.error(error);
            }
        },
        [cargarPrestamosRemotos]
    );

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        async function cargarSesionInicial() {
            try {
                const sesionActual = await obtenerSesionActual();
                await aplicarSesion(sesionActual);
            } catch (error) {
                console.error(error);
            } finally {
                setCargandoAuth(false);
            }
        }

        const dejarDeEscuchar = escucharCambiosSesion((nuevaSesion) => {
            aplicarSesion(nuevaSesion);
        });

        cargarSesionInicial();

        return dejarDeEscuchar;
    }, [aplicarSesion]);

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
        <Routes>
            <Route
                path="/"
                element={
                    <Dashboard
                        prestamos={prestamosActivos}
                        cargandoPrestamos={cargandoPrestamos}
                        mensajeExterno={errorCargaPrestamos}
                        usuario={perfil}
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
                        <Admin
                            usuarioActual={perfil}
                            onLogout={manejarLogout}
                            onUsuarioActualizado={setPerfil}
                        />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
