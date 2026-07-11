import Header from "../components/Header";
import PrestamoCard from "../components/PrestamoCard";
import { agruparPorFecha } from "../utils/fechas";

import "../styles/Dashboard.css";

function Historial({ prestamos, usuario, onEliminarPrestamo, onLogout }) {
    const gruposPorFecha = agruparPorFecha(prestamos);

    async function manejarEliminacion(prestamo) {
        const confirmado = window.confirm(
            "¿Eliminar este arriendo del historial? Esta acción no se puede deshacer."
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
                <h1 className="dashboard-title">Historial</h1>

                <p className="dashboard-subtitle">
                    {prestamos.length} préstamos devueltos
                </p>
            </header>

            <section className="cards-container">
                {prestamos.length === 0 ? (
                    <p className="empty-state">
                        No hay préstamos devueltos todavía.
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
