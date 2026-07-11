import { useEffect, useRef, useState } from "react";
import {
    FaCalendarAlt,
    FaCamera,
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaEdit,
    FaMoneyBillWave,
    FaTimes,
    FaTrash,
} from "react-icons/fa";

import { formatearHora } from "../utils/fechas";
import "../styles/PrestamoCard.css";

const zonaInferiorNoAccionable = 150;

function obtenerFotos(prestamo) {
    const fotosVehiculo = Array.isArray(prestamo.fotosVehiculo)
        ? prestamo.fotosVehiculo.filter(Boolean)
        : [];
    const fotos = fotosVehiculo.length > 0 ? fotosVehiculo : [prestamo.fotoVehiculo];

    if (prestamo.fotoGarantia) {
        fotos.push(prestamo.fotoGarantia);
    }

    return fotos.filter(Boolean);
}

function PrestamoCard({ prestamo, onEditar, onDevolver, onEliminar }) {
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

    useEffect(() => {
        let frameId = null;

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
        window.addEventListener("scroll", solicitarMedicion, { passive: true });
        window.addEventListener("resize", solicitarMedicion);

        return () => {
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }

            window.removeEventListener("scroll", solicitarMedicion);
            window.removeEventListener("resize", solicitarMedicion);
        };
    }, []);

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
                        <FaCamera size={28} />
                        <span>Sin foto</span>
                    </div>
                )}
            </div>

            <div className="prestamo-info">
                <div className="prestamo-header">
                    <div className="prestamo-title">
                        <h2>{tipo}</h2>
                        <span>{horaIngreso ? `Ingreso ${horaIngreso}` : "Sin hora"}</span>
                    </div>

                    <div className="prestamo-meta-actions">
                        <span className={estaDevuelto ? "status returned" : "status active"}>
                            {estaDevuelto ? "Devuelto" : "Activo"}
                        </span>

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

                    <p>
                        <FaCalendarAlt />
                        {prestamo.dias} día{prestamo.dias > 1 ? "s" : ""}
                    </p>
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
                </div>
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
