import { useState } from "react";

import "./../styles/Dashboard.css";

import PrestamoCard from "../components/PrestamoCard";
import FloatingButton from "../components/FloatingButton";
import Header from "../components/Header";
import ModalNuevoPrestamo from "../components/ModalNuevoPrestamo";
import { agruparPorFecha } from "../utils/fechas";

function esDeHoy(prestamo) {
    const fechaIngreso = prestamo.fechaIngreso ? new Date(prestamo.fechaIngreso) : null;

    if (!fechaIngreso || Number.isNaN(fechaIngreso.getTime())) return false;

    const hoy = new Date();

    return (
        fechaIngreso.getFullYear() === hoy.getFullYear() &&
        fechaIngreso.getMonth() === hoy.getMonth() &&
        fechaIngreso.getDate() === hoy.getDate()
    );
}

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
    const prestamosDeHoy = prestamos.filter(esDeHoy).length;

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
            alert("No se pudo guardar el arriendo.");
            console.error(error);
        } finally {
            setGuardando(false);
        }
    }

    async function manejarDevolucion(id) {
        try {
            await onDevolverPrestamo(id);
        } catch (error) {
            alert("No se pudo marcar el arriendo como devuelto.");
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
                "No se pudo eliminar el arriendo. Revisa que las políticas de eliminación estén aplicadas en Supabase."
            );
            console.error(error);
        }
    }

    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <div className="dashboard-heading">
                    <div>
                        <p className="dashboard-label">Cadenero</p>
                        <h1 className="dashboard-title">Hola, {nombreUsuario}</h1>
                    </div>
                </div>

                <div className="dashboard-summary" aria-label="Resumen de arriendos">
                    <div className="summary-item">
                        <span>{prestamos.length}</span>
                        <p>Activos</p>
                    </div>

                    <div className="summary-item">
                        <span>{prestamosDeHoy}</span>
                        <p>Hoy</p>
                    </div>
                </div>
            </header>

            <section className="cards-container">
                {cargandoPrestamos ? (
                    <p className="empty-state">Cargando arriendos...</p>
                ) : prestamos.length === 0 ? (
                    <p className="empty-state">No hay arriendos activos.</p>
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
