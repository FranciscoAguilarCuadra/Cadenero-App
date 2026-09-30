import { useEffect, useRef, useState } from "react";
import {
    FaCalendarAlt,
    FaCamera,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaEdit,
    FaMoneyBillWave,
    FaRedo,
    FaTimes,
    FaTrash,
} from "react-icons/fa";

import { formatearHora } from "../utils/fechas";
import "../styles/PrestamoCard.css";

const milisegundosPorDia = 24 * 60 * 60 * 1000;

function obtenerFotos(prestamo) {
    const fotosVehiculo = Array.isArray(prestamo.fotosVehiculo)
        ? prestamo.fotosVehiculo.filter(Boolean)
        : [];
    const fotos = fotosVehiculo.length > 0 ? fotosVehiculo : [prestamo.fotoVehiculo];

    return fotos.filter(Boolean);
}

function normalizarInicioDia(fecha) {
    const fechaNormalizada = fecha ? new Date(fecha) : null;

    if (!fechaNormalizada || Number.isNaN(fechaNormalizada.getTime())) {
        return null;
    }

    fechaNormalizada.setHours(0, 0, 0, 0);
    return fechaNormalizada;
}

function obtenerProgresoDias(prestamo) {
    const diasTotales = Math.max(Number(prestamo.dias) || 1, 1);

    if (prestamo.estado === "Devuelto") {
        return {
            texto: `${diasTotales} día${diasTotales > 1 ? "s" : ""}`,
            clase: "neutral",
        };
    }

    const fechaIngreso = normalizarInicioDia(prestamo.fechaIngreso);
    const hoy = normalizarInicioDia(new Date());

    if (!fechaIngreso || !hoy) {
        return {
            texto: `${diasTotales} día${diasTotales > 1 ? "s" : ""}`,
            clase: "neutral",
        };
    }

    const diasTranscurridos =
        Math.floor((hoy.getTime() - fechaIngreso.getTime()) / milisegundosPorDia) +
        1;
    const diaActual = Math.min(Math.max(diasTranscurridos, 1), diasTotales);
    const estaAtrasado = diasTranscurridos > diasTotales;
    const venceHoy = diasTranscurridos === diasTotales;
    const progreso = diaActual / diasTotales;

    if (estaAtrasado) {
        return {
            texto: "Atrasado",
            clase: "overdue",
        };
    }

    if (diasTotales === 1) {
        return {
            texto: "Hoy",
            clase: "due-today",
        };
    }

    if (venceHoy) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "due-today",
        };
    }

    if (progreso >= 0.75) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "advanced",
        };
    }

    if (progreso >= 0.45) {
        return {
            texto: `${diaActual}/${diasTotales} días`,
            clase: "middle",
        };
    }

    return {
        texto: `${diaActual}/${diasTotales} días`,
        clase: "early",
    };
}

function PrestamoCard({
    prestamo,
    onEditar,
    onDevolver,
    onEliminar,
    onReactivar,
}) {
    const cardRef = useRef(null);
    const [indiceGaleria, setIndiceGaleria] = useState(null);
    const fotos = obtenerFotos(prestamo);
    const fotoPrincipal = fotos[0];
    const tieneFotos = fotos.length > 0;
    const estaDevuelto = prestamo.estado === "Devuelto";
    const horaIngreso = formatearHora(prestamo.fechaIngreso);
    const tipo = prestamo.tipo || "Arriendo";
    const progresoDias = obtenerProgresoDias(prestamo);

    useEffect(() => {
        const nodo = cardRef.current;
        if (!nodo) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // No aplicar is-partial si la galería está abierta
                if (indiceGaleria !== null) {
                    nodo.classList.remove("is-partial");
                    return;
                }

                if (entry.isIntersecting) {
                    nodo.classList.remove("is-partial");
                } else {
                    nodo.classList.add("is-partial");
                }
            },
            { rootMargin: "0px 0px -150px 0px" }
        );

        observer.observe(nodo);

        return () => observer.disconnect();
    }, [indiceGaleria]);

    function mostrarFotoAnterior() {
        setIndiceGaleria((indiceActual) =>
            indiceActual === 0 ? fotos.length - 1 : indiceActual - 1
        );
    }

    function mostrarFotoSiguiente() {
        setIndiceGaleria((indiceActual) =>
            indiceActual === fotos.length - 1 ? 0 : indiceActual + 1
        );
    }

    return (
        <article
            ref={cardRef}
            className="prestamo-card"
        >
            <div className="vehicle-image">
                {tieneFotos ? (
                    <button
                        type="button"
                        className="vehicle-image-button"
                        onClick={() => setIndiceGaleria(0)}
                        aria-label="Ver fotos del arriendo"
                    >
                        <img src={fotoPrincipal} alt="Vehículo registrado" loading="lazy" decoding="async" />

                        {fotos.length > 1 && (
                            <span className="photo-count">{fotos.length}</span>
                        )}
                    </button>
                ) : (
                    <div className="vehicle-placeholder">
                        <FaCamera size={26} />
                        <span>Sin foto</span>
                    </div>
                )}
            </div>

            <div className="prestamo-main">
                <div className="prestamo-header">
                    <div className="prestamo-title">
                        <h2>{tipo}</h2>
                        <span>{horaIngreso ? `Hora ${horaIngreso}` : "Sin hora"}</span>
                    </div>

                    <div className="prestamo-meta-actions">
                        <div className="prestamo-badges">
                            <span className={estaDevuelto ? "status returned" : "status active"}>
                                {estaDevuelto ? "Devuelto" : "Activo"}
                            </span>

                            {prestamo.danioPrevio && (
                                <span className="status damage">Daño previo</span>
                            )}
                        </div>

                        {onEliminar && (
                            <button
                                type="button"
                                className="delete-icon-button"
                                onClick={() => onEliminar(prestamo)}
                                aria-label="Eliminar arriendo"
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                </div>

                <div className="prestamo-details">
                    <p>
                        <FaMoneyBillWave />
                        {prestamo.pago}
                    </p>

                    <p className={`day-progress ${progresoDias.clase}`}>
                        <FaCalendarAlt />
                        {progresoDias.texto}
                    </p>
                </div>
            </div>

            <div className="prestamo-buttons">
                {!estaDevuelto && (
                    <>
                        <button
                            type="button"
                            className="edit-button"
                            onClick={() => onEditar(prestamo)}
                        >
                            <FaEdit />
                            Editar
                        </button>

                        <button
                            type="button"
                            className="return-button"
                            onClick={() => onDevolver(prestamo.id)}
                        >
                            <FaCheckCircle />
                            Devuelto
                        </button>
                    </>
                )}

                {estaDevuelto && onReactivar && (
                    <button
                        type="button"
                        className="reactivate-button"
                        onClick={() => onReactivar(prestamo)}
                    >
                        <FaRedo />
                        Reactivar
                    </button>
                )}
            </div>

            {indiceGaleria !== null && (
                <div className="gallery-overlay">
                    <button
                        type="button"
                        className="gallery-close"
                        onClick={() => setIndiceGaleria(null)}
                        aria-label="Cerrar galería"
                    >
                        <FaTimes />
                    </button>

                    {fotos.length > 1 && (
                        <button
                            type="button"
                            className="gallery-nav gallery-prev"
                            onClick={mostrarFotoAnterior}
                            aria-label="Foto anterior"
                        >
                            <FaChevronLeft />
                        </button>
                    )}

                    <img
                        src={fotos[indiceGaleria]}
                        alt={`Foto ${indiceGaleria + 1} del arriendo`}
                    />

                    {fotos.length > 1 && (
                        <button
                            type="button"
                            className="gallery-nav gallery-next"
                            onClick={mostrarFotoSiguiente}
                            aria-label="Foto siguiente"
                        >
                            <FaChevronRight />
                        </button>
                    )}

                    <span className="gallery-counter">
                        {indiceGaleria + 1} / {fotos.length}
                    </span>
                </div>
            )}
        </article>
    );
}

export default PrestamoCard;
