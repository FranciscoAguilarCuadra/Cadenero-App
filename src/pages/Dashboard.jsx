import { useState } from "react";

import "./../styles/Dashboard.css";

import PrestamoCard from "../components/PrestamoCard";
import FloatingButton from "../components/FloatingButton";
import Header from "../components/Header";
import ModalNuevoPrestamo from "../components/ModalNuevoPrestamo";
import { agruparPorFecha } from "../utils/fechas";

function Dashboard({
    prestamos,
    cargandoPrestamos,
    usuario,
    onAgregarPrestamo,
    onEditarPrestamo,
    onDevolverPrestamo,
    onEliminarPrestamo,
    onLogout,
}) {
    const [modalAbierto, setModalAbierto] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const gruposPorFecha = agruparPorFecha(prestamos);
    const nombreUsuario = usuario?.nombre || usuario?.email || "usuario";

    function abrirNuevoPrestamo() {
        setPrestamoEditando(null);
        setModalAbierto(true);
    }

    function abrirEditarPrestamo(prestamo) {
        setPrestamoEditando(prestamo);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
        setPrestamoEditando(null);
    }

    async function guardarPrestamo(prestamo) {
        setGuardando(true);

        try {
            if (prestamoEditando) {
                await onEditarPrestamo(prestamo);
            } else {
                await onAgregarPrestamo(prestamo);
            }

            cerrarModal();
        } catch (error) {
            alert("No se pudo guardar el préstamo.");
            console.error(error);
        } finally {
            setGuardando(false);
        }
    }

    async function manejarDevolucion(id) {
        try {
            await onDevolverPrestamo(id);
        } catch (error) {
            alert("No se pudo marcar el préstamo como devuelto.");
            console.error(error);
        }
    }

    async function manejarEliminacion(prestamo) {
        const confirmado = window.confirm(
            "¿Eliminar este arriendo? Esta acción no se puede deshacer."
        );

        if (!confirmado) return;

        try {
            await onEliminarPrestamo(prestamo);
        } catch (error) {
            alert(
                "No se pudo eliminar el arriendo. Revisa que las politicas de eliminacion esten aplicadas en Supabase."
            );
            console.error(error);
        }
    }

    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Cadenero</h1>

                <p className="dashboard-welcome">Bienvenido, {nombreUsuario}</p>

                <p className="dashboard-subtitle">
                    {prestamos.length} préstamos activos
                </p>
            </header>

            <section className="cards-container">
                {cargandoPrestamos ? (
                    <p className="empty-state">Cargando préstamos...</p>
                ) : prestamos.length === 0 ? (
                    <p className="empty-state">No hay préstamos activos.</p>
                ) : (
                    gruposPorFecha.map((grupo) => (
                        <section className="date-group" key={grupo.clave}>
                            <h2 className="date-group-title">{grupo.titulo}</h2>

                            <div className="date-group-cards">
                                {grupo.prestamos.map((prestamo) => (
                                    <PrestamoCard
                                        key={prestamo.id}
                                        prestamo={prestamo}
                                        onEditar={abrirEditarPrestamo}
                                        onDevolver={manejarDevolucion}
                                        onEliminar={manejarEliminacion}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </section>

            <FloatingButton onClick={abrirNuevoPrestamo} />

            <Header usuario={usuario} onLogout={onLogout} />

            {modalAbierto && (
                <ModalNuevoPrestamo
                    prestamoEditando={prestamoEditando}
                    onClose={cerrarModal}
                    onGuardar={guardarPrestamo}
                    guardando={guardando}
                />
            )}
        </main>
    );
}

export default Dashboard;
