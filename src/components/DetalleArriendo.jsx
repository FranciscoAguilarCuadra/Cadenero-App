import { useEffect, useRef } from "react";
import { FaCamera, FaTimes } from "react-icons/fa";

import { formatearFechaGrupo, formatearHora } from "../utils/fechas";

import "../styles/DetalleArriendo.css";

function fotosDelPrestamo(prestamo) {
    const fotosVehiculo = Array.isArray(prestamo?.fotosVehiculo)
        ? prestamo.fotosVehiculo.filter(Boolean)
        : [];

    if (fotosVehiculo.length > 0) return fotosVehiculo;

    return prestamo?.fotoVehiculo ? [prestamo.fotoVehiculo] : [];
}

function DetalleArriendo({ prestamo, onClose, onVerFoto }) {
    const botonCerrarRef = useRef(null);
    const fotos = fotosDelPrestamo(prestamo);
    const dias = Math.max(Number(prestamo?.dias) || 1, 1);
    const horaIngreso = formatearHora(prestamo?.fechaIngreso);
    const tipo = prestamo?.tipo || "Arriendo";

    useEffect(() => {
        botonCerrarRef.current?.focus();

        function alPulsarTecla(evento) {
            if (evento.key === "Escape") onClose();
        }

        document.addEventListener("keydown", alPulsarTecla);

        return () => document.removeEventListener("keydown", alPulsarTecla);
    }, [onClose]);

    return (
        <div className="detalle-overlay">
            <section
                className="detalle-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="detalle-arriendo-titulo"
            >
                <div className="detalle-header">
                    <h3 id="detalle-arriendo-titulo">Detalle del arriendo</h3>

                    <button
                        ref={botonCerrarRef}
                        type="button"
                        className="detalle-cerrar"
                        onClick={onClose}
                        aria-label="Cerrar detalle"
                    >
                        <FaTimes />
                    </button>
                </div>

                {fotos.length > 0 ? (
                    <div className="detalle-fotos">
                        {fotos.map((foto, indice) => (
                            <button
                                key={`${foto}-${indice}`}
                                type="button"
                                className="detalle-foto"
                                onClick={() => onVerFoto(indice)}
                                aria-label={`Ver foto ${indice + 1} del arriendo`}
                            >
                                <img src={foto} alt={`Vehículo ${indice + 1}`} />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="detalle-fotos">
                        <div className="detalle-foto detalle-foto-pendiente">
                            <FaCamera />
                            <span>Foto pendiente</span>
                        </div>
                    </div>
                )}

                <dl className="detalle-campos">
                    <div className="detalle-campo">
                        <dt>Tipo</dt>
                        <dd>{tipo}</dd>
                    </div>

                    <div className="detalle-campo">
                        <dt>Días</dt>
                        <dd>
                            {dias} {dias === 1 ? "día" : "días"}
                        </dd>
                    </div>

                    <div className="detalle-campo">
                        <dt>Pago</dt>
                        <dd>{prestamo?.pago || "Sin registrar"}</dd>
                    </div>

                    <div className="detalle-campo">
                        <dt>Daño previo</dt>
                        <dd>
                            {prestamo?.danioPrevio ? (
                                <span className="detalle-chip">
                                    Sí — vehículo con defecto
                                </span>
                            ) : (
                                <span className="detalle-vacio">No</span>
                            )}
                        </dd>
                    </div>

                    <div className="detalle-campo">
                        <dt>Observaciones</dt>
                        <dd>
                            {prestamo?.observaciones?.trim() ? (
                                prestamo.observaciones
                            ) : (
                                <span className="detalle-vacio">
                                    Sin observaciones
                                </span>
                            )}
                        </dd>
                    </div>
                </dl>

                <button
                    type="button"
                    className="detalle-cierre"
                    onClick={onClose}
                >
                    Cerrar
                </button>

                <p className="detalle-pie">
                    Ingresó {formatearFechaGrupo(prestamo?.fechaIngreso)}
                    {horaIngreso ? ` a las ${horaIngreso}` : ""} ·{" "}
                    {prestamo?.estado === "Devuelto" ? "Devuelto" : "Activo"}
                    {prestamo?.fechaDevolucion
                        ? ` · Salió el ${formatearFechaGrupo(
                              prestamo.fechaDevolucion
                          )}`
                        : ""}
                </p>
            </section>
        </div>
    );
}

export default DetalleArriendo;
