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

const zonaInferiorNoAccionable = 150;
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
    const [estaCompletaEnPantalla, setEstaCompletaEnPantalla] = useState(true);
    const fotos = obtenerFotos(prestamo);
    const fotoPrincipal = fotos[0];
    const tieneFotos = fotos.length > 0;
    const estaDevuelto = prestamo.estado === "Devuelto";
    const horaIngreso = formatearHora(prestamo.fechaIngreso);
    const tipo = prestamo.tipo || "Arriendo";
    const estaParcial = !estaCompletaEnPantalla && indiceGaleria === null;
    const progresoDias = obtenerProgresoDias(prestamo);

    useEffect(() => {
        let frameId = null;
        let observer = null;
        let timeoutId = null;

        function medirVisibilidad() {
            if (!cardRef.current) return;

            const rect = cardRef.current.getBoundingClientRect();
            const limiteInferior = window.innerHeight - zonaInferiorNoAccionable;
            const completa =
                rect.top >= 0 &&
                rect.bottom <= limiteInferior &&
                rect.height <= limiteInferior;

            setEstaCompletaEnPantalla(completa);
        }

        function solicitarMedicion() {
            if (frameId) return;

            frameId = window.requestAnimationFrame(() => {
                frameId = null;
                medirVisibilidad();
            });
        }

        medirVisibilidad();
        timeoutId = window.setTimeout(solicitarMedicion, 120);

        if ("ResizeObserver" in window && cardRef.current) {
            observer = new ResizeObserver(solicitarMedicion);
            observer.observe(cardRef.current);
            observer.observe(document.body);
        }

        window.addEventListener("scroll", solicitarMedicion, { passive: true });
        window.addEventListener("resize", solicitarMedicion);

        return () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }

            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }

            if (observer) {
                observer.disconnect();
            }

            window.removeEventListener("scroll", solicitarMedicion);
            window.removeEventListener("resize", solicitarMedicion);
        };
    }, [prestamo.id, prestamo.estado]);

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
            className={`prestamo-card${estaParcial ? " is-partial" : ""}`}
            aria-disabled={estaParcial}
        >
            <div className="vehicle-image">
                {tieneFotos ? (
                    <button
                        type="button"
                        className="vehicle-image-button"
                        onClick={() => setIndiceGaleria(0)}
                        aria-label="Ver fotos del arriendo"
                    >
                        <img src={fotoPrincipal} alt="Vehículo registrado" />

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
