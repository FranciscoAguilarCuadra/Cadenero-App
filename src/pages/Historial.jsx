import { useState } from "react";

import AppDialog from "../components/AppDialog";
import Header from "../components/Header";
import PrestamoCard from "../components/PrestamoCard";
import { agruparPorFecha } from "../utils/fechas";

import "../styles/Dashboard.css";

function Historial({
    prestamos,
    mensajeExterno,
    usuario,
    pendientesIds,
    onEliminarPrestamo,
    onReactivarPrestamo,
    onLogout,
}) {
    const [dialogo, setDialogo] = useState(null);
    const [procesandoDialogo, setProcesandoDialogo] = useState(false);
    const gruposPorFecha = agruparPorFecha(prestamos);

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

    function manejarEliminacion(prestamo) {
        setDialogo({
            title: "Eliminar del historial",
            message:
                "Esta acción no se puede deshacer y eliminará las fotografías asociadas.",
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

    function manejarReactivacion(prestamo) {
        setDialogo({
            title: "Reactivar arriendo",
            message:
                "El arriendo volverá a la pantalla principal como activo.",
            variant: "warning",
            confirmLabel: "Reactivar",
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                setProcesandoDialogo(true);

                try {
                    await onReactivarPrestamo(prestamo);
                    setDialogo(null);
                } catch (error) {
                    console.error(error);
                    mostrarErrorAccion(
                        "No se pudo reactivar",
                        "No se pudo reactivar el arriendo. Revisa tu conexión e intenta nuevamente."
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
                <h1 className="dashboard-title">Historial</h1>

                <p className="dashboard-subtitle">
                    {prestamos.length} arriendos devueltos
                </p>
            </header>

            {mensajeExterno && (
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
                                        pendiente={pendientesIds.has(
                                            String(prestamo.id)
                                        )}
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

export default Historial;
