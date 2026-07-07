import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Historial from "./pages/Historial";
import prestamosIniciales from "./data/prestamos";
import { isSupabaseConfigured } from "./supabase";
import {
    guardarPrestamo as guardarPrestamoRemoto,
    marcarPrestamoDevuelto,
    obtenerPrestamos,
} from "./services/prestamosService";

const campoLegacy = "ca" + "dena";

function normalizarPrestamo(prestamo) {
    const prestamoNormalizado = { ...prestamo };
    delete prestamoNormalizado[campoLegacy];

    return prestamoNormalizado;
}

function App() {
    const [prestamos, setPrestamos] = useState(() => {
        if (isSupabaseConfigured) {
            return [];
        }

        const guardados = localStorage.getItem("prestamos");
        const prestamosCargados = guardados ? JSON.parse(guardados) : prestamosIniciales;

        return prestamosCargados.map(normalizarPrestamo);
    });
    const [cargandoPrestamos, setCargandoPrestamos] = useState(
        isSupabaseConfigured
    );

    useEffect(() => {
        if (!isSupabaseConfigured) return;

        async function cargarPrestamos() {
            try {
                const prestamosRemotos = await obtenerPrestamos();
                setPrestamos(prestamosRemotos.map(normalizarPrestamo));
            } catch (error) {
                alert("No se pudieron cargar los préstamos desde Supabase.");
                console.error(error);
            } finally {
                setCargandoPrestamos(false);
            }
        }

        cargarPrestamos();
    }, []);

    useEffect(() => {
        if (isSupabaseConfigured) return;

        localStorage.setItem(
            "prestamos",
            JSON.stringify(prestamos.map(normalizarPrestamo))
        );
    }, [prestamos]);

    async function agregarPrestamo(nuevoPrestamo) {
        const prestamoNormalizado = normalizarPrestamo(nuevoPrestamo);

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

    const prestamosActivos = prestamos.filter(
        (prestamo) => prestamo.estado === "Activo"
    );

    const prestamosDevueltos = prestamos.filter(
        (prestamo) => prestamo.estado === "Devuelto"
    );

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Dashboard
                        prestamos={prestamosActivos}
                        cargandoPrestamos={cargandoPrestamos}
                        onAgregarPrestamo={agregarPrestamo}
                        onEditarPrestamo={editarPrestamo}
                        onDevolverPrestamo={devolverPrestamo}
                    />
                }
            />

            <Route
                path="/historial"
                element={<Historial prestamos={prestamosDevueltos} />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
