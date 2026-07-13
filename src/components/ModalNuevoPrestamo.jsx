import { useState } from "react";
import { FaCamera, FaSave, FaTimes, FaTrash } from "react-icons/fa";

import "../styles/ModalNuevoPrestamo.css";

function obtenerFotosVehiculo(prestamo) {
    if (Array.isArray(prestamo?.fotosVehiculo) && prestamo.fotosVehiculo.length > 0) {
        return prestamo.fotosVehiculo.filter(Boolean);
    }

    return prestamo?.fotoVehiculo ? [prestamo.fotoVehiculo] : [];
}

function ModalNuevoPrestamo({
    prestamoEditando,
    onClose,
    onGuardar,
    guardando,
    error,
}) {
    const [formulario, setFormulario] = useState({
        id: prestamoEditando?.id || null,
        usuarioId: prestamoEditando?.usuarioId || null,
        tipo: prestamoEditando?.tipo || "Arriendo",
        dias: prestamoEditando?.dias || 1,
        pago: prestamoEditando?.pago || "Efectivo",
        observaciones: prestamoEditando?.observaciones || "",
        fotosVehiculo: obtenerFotosVehiculo(prestamoEditando),
        fotoGarantia: prestamoEditando?.fotoGarantia || "",
        estado: prestamoEditando?.estado || "Activo",
        fechaIngreso: prestamoEditando?.fechaIngreso || new Date().toISOString(),
        fechaDevolucion: prestamoEditando?.fechaDevolucion || null,
    });
    const [errorFoto, setErrorFoto] = useState("");

    function manejarCambio(event) {
        const { name, value } = event.target;

        setFormulario({
            ...formulario,
            [name]: value,
        });
    }

    function comprimirImagen(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();

            lector.onload = () => {
                const imagen = new Image();

                imagen.onload = () => {
                    const canvas = document.createElement("canvas");

                    const maxSize = 900;
                    let width = imagen.width;
                    let height = imagen.height;

                    if (width > height && width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(imagen, 0, 0, width, height);

                    const imagenComprimida = canvas.toDataURL("image/jpeg", 0.65);
                    resolve(imagenComprimida);
                };

                imagen.onerror = reject;
                imagen.src = lector.result;
            };

            lector.onerror = reject;
            lector.readAsDataURL(archivo);
        });
    }

    async function comprimirArchivos(archivos) {
        return Promise.all(archivos.map(comprimirImagen));
    }

    async function manejarFotosVehiculo(event) {
        const archivos = Array.from(event.target.files || []);

        if (archivos.length === 0) return;

        setErrorFoto("");

        try {
            const imagenesComprimidas = await comprimirArchivos(archivos);

            setFormulario((prevFormulario) => ({
                ...prevFormulario,
                fotosVehiculo: [
                    ...prevFormulario.fotosVehiculo,
                    ...imagenesComprimidas,
                ],
            }));
        } catch {
            setErrorFoto("No se pudo cargar la imagen. Intenta con otra foto.");
        } finally {
            event.target.value = "";
        }
    }

    async function manejarFotoGarantia(event) {
        const archivo = event.target.files[0];

        if (!archivo) return;

        setErrorFoto("");

        try {
            const imagenComprimida = await comprimirImagen(archivo);

            setFormulario((prevFormulario) => ({
                ...prevFormulario,
                fotoGarantia: imagenComprimida,
            }));
        } catch {
            setErrorFoto("No se pudo cargar la imagen. Intenta con otra foto.");
        } finally {
            event.target.value = "";
        }
    }

    function eliminarFotoVehiculo(indiceFoto) {
        setFormulario((prevFormulario) => ({
            ...prevFormulario,
            fotosVehiculo: prevFormulario.fotosVehiculo.filter(
                (_, indice) => indice !== indiceFoto
            ),
        }));
    }

    function eliminarFotoGarantia() {
        setFormulario((prevFormulario) => ({
            ...prevFormulario,
            fotoGarantia: "",
        }));
    }

    function manejarSubmit(event) {
        event.preventDefault();

        onGuardar({
            ...formulario,
            id: formulario.id || Date.now(),
            dias: Number(formulario.dias),
            fotoVehiculo: formulario.fotosVehiculo[0] || "",
        });
    }

    return (
        <div className="modal-overlay">
            <form
                className="modal-card"
                onSubmit={manejarSubmit}
                aria-busy={guardando}
            >
                <div className="modal-scroll">
                    <div className="modal-header">
                        <h2>
                            {prestamoEditando ? "Editar arriendo" : "Nuevo arriendo"}
                        </h2>

                        <button
                            type="button"
                            className="close-button"
                            onClick={onClose}
                            disabled={guardando}
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {(error || errorFoto) && (
                        <p className="modal-error" role="alert">
                            {error || errorFoto}
                        </p>
                    )}

                    <div className="photo-section">
                        <div className="photo-section-header">
                            <span>Fotos vehículo</span>

                            <label className="photo-add-button">
                                <FaCamera />
                                Agregar
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    onChange={manejarFotosVehiculo}
                                    disabled={guardando}
                                />
                            </label>
                        </div>

                        {formulario.fotosVehiculo.length > 0 ? (
                            <div className="vehicle-photo-grid">
                                {formulario.fotosVehiculo.map((foto, indice) => (
                                    <div
                                        className="vehicle-photo-item"
                                        key={`${foto}-${indice}`}
                                    >
                                        <img
                                            src={foto}
                                            alt={`Vehículo ${indice + 1}`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => eliminarFotoVehiculo(indice)}
                                            aria-label="Eliminar foto"
                                            disabled={guardando}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <label className="photo-button photo-button-wide">
                                <FaCamera />
                                Foto vehículo
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    multiple
                                    onChange={manejarFotosVehiculo}
                                    disabled={guardando}
                                />
                            </label>
                        )}
                    </div>

                    <div className="warranty-photo-field">
                        {formulario.fotoGarantia ? (
                            <div className="warranty-photo-preview">
                                <img src={formulario.fotoGarantia} alt="Garantía" />

                                <button
                                    type="button"
                                    onClick={eliminarFotoGarantia}
                                    aria-label="Eliminar foto de garantía"
                                    disabled={guardando}
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ) : (
                            <label className="photo-button warranty-photo">
                                <FaCamera />
                                Foto garantía

                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={manejarFotoGarantia}
                                    disabled={guardando}
                                />
                            </label>
                        )}
                    </div>

                    <label className="form-group">
                        Tipo
                        <select
                            name="tipo"
                            value={formulario.tipo}
                            onChange={manejarCambio}
                            disabled={guardando}
                        >
                            <option value="Arriendo">Arriendo</option>
                            <option value="Porte">Porte</option>
                        </select>
                    </label>

                    <label className="form-group">
                        Días
                        <select
                            name="dias"
                            value={formulario.dias}
                            onChange={manejarCambio}
                            disabled={guardando}
                        >
                            <option value="1">1 día</option>
                            <option value="2">2 días</option>
                            <option value="3">3 días</option>
                            <option value="4">4 días</option>
                            <option value="5">5 días</option>
                            <option value="7">7 días</option>
                        </select>
                    </label>

                    <label className="form-group">
                        Pago
                        <select
                            name="pago"
                            value={formulario.pago}
                            onChange={manejarCambio}
                            disabled={guardando}
                        >
                            <option value="Efectivo">Efectivo</option>
                            <option value="Transferencia">Transferencia</option>
                        </select>
                    </label>

                    <label className="form-group">
                        Observaciones
                        <textarea
                            name="observaciones"
                            placeholder="Opcional"
                            value={formulario.observaciones}
                            onChange={manejarCambio}
                            disabled={guardando}
                        />
                    </label>
                </div>

                <div className="modal-actions">
                    {guardando && (
                        <p className="save-status">
                            Subiendo fotos y guardando datos...
                        </p>
                    )}

                    <button type="submit" className="save-button" disabled={guardando}>
                        <FaSave />
                        {guardando
                            ? "Guardando arriendo..."
                            : prestamoEditando
                              ? "Guardar cambios"
                              : "Guardar arriendo"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ModalNuevoPrestamo;
