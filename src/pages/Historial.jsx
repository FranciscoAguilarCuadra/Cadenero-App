import { useState } from "react";

import Header from "../components/Header";
import PrestamoCard from "../components/PrestamoCard";
import { agruparPorFecha } from "../utils/fechas";

import "../styles/Dashboard.css";

function Historial({
    prestamos,
    mensajeExterno,
    usuario,
    onEliminarPrestamo,
    onReactivarPrestamo,
    onLogout,
}) {
    const [mensaje, setMensaje] = useState("");
    const gruposPorFecha = agruparPorFecha(prestamos);

    async function manejarEliminacion(prestamo) {
        const confirmado = window.confirm(
            "¿Eliminar este arriendo del historial? Esta acción no se puede deshacer."
        );

        if (!confirmado) return;

        setMensaje("");

        try {
            await onEliminarPrestamo(prestamo);
        } catch (error) {
            setMensaje(
                "No se pudo eliminar el arriendo. Revisa tu conexión o las políticas de Supabase."
            );
            console.error(error);
        }
    }

    async function manejarReactivacion(prestamo) {
        const confirmado = window.confirm(
            "¿Volver este arriendo a Activo? Aparecerá nuevamente en la pantalla principal."
        );

        if (!confirmado) return;

        setMensaje("");

        try {
            await onReactivarPrestamo(prestamo);
        } catch (error) {
            setMensaje(
                "No se pudo reactivar el arriendo. Revisa tu conexión e intenta nuevamente."
            );
            console.error(error);
        }
    }

    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <h1 className="dashboard-title">Historial</h1>

                <p className="dashboard-subtitle">
                    {prestamos.length} arriendos devueltos
                </p>
            </header>

            {mensaje && (
                <p className="app-message" role="alert">
                    {mensaje}
                </p>
            )}

            {!mensaje && mensajeExterno && (
                <p className="app-message" role="alert">
                    {mensajeExterno}
                </p>
            )}

            <section className="cards-container">
                {prestamos.length === 0 ? (
                    <p className="empty-state">
                        No hay arriendos devueltos todavía.
                    </p>
                ) : (
                    gruposPorFecha.map((grupo) => (
                        <section className="date-group" key={grupo.clave}>
                            <h2 className="date-group-title">{grupo.titulo}</h2>

                            <div className="date-group-cards">
                                {grupo.prestamos.map((prestamo) => (
                                    <PrestamoCard
                                        key={prestamo.id}
                                        prestamo={prestamo}
                                        onEliminar={manejarEliminacion}
                                        onReactivar={manejarReactivacion}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </section>

            <Header usuario={usuario} onLogout={onLogout} />
        </main>
    );
}

export default Historial;
