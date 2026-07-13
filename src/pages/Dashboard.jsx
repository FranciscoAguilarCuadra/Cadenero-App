import { useState } from "react";

import "./../styles/Dashboard.css";

import PrestamoCard from "../components/PrestamoCard";
import FloatingButton from "../components/FloatingButton";
import Header from "../components/Header";
import ModalNuevoPrestamo from "../components/ModalNuevoPrestamo";
import AppDialog from "../components/AppDialog";
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
    mensajeExterno,
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
    const [errorModal, setErrorModal] = useState("");
    const [dialogo, setDialogo] = useState(null);
    const [procesandoDialogo, setProcesandoDialogo] = useState(false);
    const gruposPorFecha = agruparPorFecha(prestamos);
    const nombreUsuario = usuario?.nombre || usuario?.email || "usuario";
    const prestamosDeHoy = prestamos.filter(esDeHoy).length;

    function limpiarMensajes() {
        setErrorModal("");
        setDialogo(null);
    }

    function abrirNuevoPrestamo() {
        limpiarMensajes();
        setPrestamoEditando(null);
        setModalAbierto(true);
    }

    function abrirEditarPrestamo(prestamo) {
        limpiarMensajes();
        setPrestamoEditando(prestamo);
        setModalAbierto(true);
    }

    function cerrarModal() {
        setModalAbierto(false);
        setPrestamoEditando(null);
        setErrorModal("");
    }

    async function guardarPrestamo(prestamo) {
        setGuardando(true);
        setErrorModal("");

        try {
            if (prestamoEditando) {
                await onEditarPrestamo(prestamo);
            } else {
                await onAgregarPrestamo(prestamo);
            }

            cerrarModal();
        } catch (error) {
            setErrorModal(
                "No se pudo guardar el arriendo. Revisa tu conexión e intenta nuevamente."
            );
            console.error(error);
        } finally {
            setGuardando(false);
        }
    }

    function cerrarDialogo() {
        if (procesandoDialogo) return;

        setDialogo(null);
    }

    function mostrarErrorAccion(title, message) {
        setDialogo({
            title,
            message,
            variant: "danger",
            confirmLabel: "Entendido",
            onConfirm: () => setDialogo(null),
        });
    }

    function manejarDevolucion(id) {
        setDialogo({
            title: "Marcar como devuelto",
            message:
                "El arriendo pasará al historial. Si fue un error, podrás reactivarlo desde ahí.",
            variant: "warning",
            confirmLabel: "Devolver",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await onDevolverPrestamo(id);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo devolver",
                        "No se pudo marcar el arriendo como devuelto. Revisa tu conexión e intenta nuevamente."
                    );
                } finally {
                    setProcesandoDialogo(false);
                }
            },
        });
    }

    function manejarEliminacion(prestamo) {
        setDialogo({
            title: "Eliminar arriendo",
            message:
                "Esta acción no se puede deshacer y eliminará sus fotografías asociadas.",
            variant: "danger",
            confirmLabel: "Eliminar",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await onEliminarPrestamo(prestamo);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo eliminar",
                        "No se pudo eliminar el arriendo. Revisa tu conexión o las políticas de Supabase."
                    );
                } finally {
                    setProcesandoDialogo(false);
                }
            },
        });
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

            {mensajeExterno && (
                <p className="app-message" role="alert">
                    {mensajeExterno}
                </p>
            )}

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
                    error={errorModal}
                />
            )}

            {dialogo && (
                <AppDialog
                    {...dialogo}
                    isProcessing={procesandoDialogo}
                    onCancel={cerrarDialogo}
                />
            )}
        </main>
    );
}

export default Dashboard;
