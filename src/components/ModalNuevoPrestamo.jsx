import { useState } from "react";
import { FaTimes, FaCamera, FaSave } from "react-icons/fa";

import "../styles/ModalNuevoPrestamo.css";

function ModalNuevoPrestamo({ prestamoEditando, onClose, onGuardar, guardando }) {
    const [formulario, setFormulario] = useState({
        id: prestamoEditando?.id || null,
        dias: prestamoEditando?.dias || 1,
        pago: prestamoEditando?.pago || "Efectivo",
        observaciones: prestamoEditando?.observaciones || "",
        fotoVehiculo: prestamoEditando?.fotoVehiculo || "",
        fotoGarantia: prestamoEditando?.fotoGarantia || "",
        estado: prestamoEditando?.estado || "Activo",
        fechaIngreso: prestamoEditando?.fechaIngreso || new Date().toISOString(),
    });

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

    async function manejarFoto(event, campo) {
        const archivo = event.target.files[0];

        if (!archivo) return;

        try {
            const imagenComprimida = await comprimirImagen(archivo);

            setFormulario((prevFormulario) => ({
                ...prevFormulario,
                [campo]: imagenComprimida,
            }));
        } catch {
            alert("No se pudo cargar la imagen. Intenta con otra foto.");
        }
    }

    function manejarSubmit(event) {
        event.preventDefault();

        onGuardar({
            ...formulario,
            id: formulario.id || Date.now(),
            dias: Number(formulario.dias),
        });
    }

    return (
        <div className="modal-overlay">
            <form className="modal-card" onSubmit={manejarSubmit}>
                <div className="modal-header">
                    <h2>
                        {prestamoEditando ? "Editar préstamo" : "Nuevo préstamo"}
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

                <div className="photo-actions">
                    <label className="photo-button">
                        {formulario.fotoVehiculo ? (
                            <img src={formulario.fotoVehiculo} alt="Vehículo" />
                        ) : (
                            <>
                                <FaCamera />
                                Foto vehículo
                            </>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(event) => manejarFoto(event, "fotoVehiculo")}
                            disabled={guardando}
                        />
                    </label>

                    <label className="photo-button">
                        {formulario.fotoGarantia ? (
                            <img src={formulario.fotoGarantia} alt="Garantía" />
                        ) : (
                            <>
                                <FaCamera />
                                Foto garantía
                            </>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={(event) => manejarFoto(event, "fotoGarantia")}
                            disabled={guardando}
                        />
                    </label>
                </div>

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

                <button type="submit" className="save-button" disabled={guardando}>
                    <FaSave />
                    {guardando
                        ? "Guardando..."
                        : prestamoEditando
                          ? "Guardar cambios"
                          : "Guardar préstamo"}
                </button>
            </form>
        </div>
    );
}

export default ModalNuevoPrestamo;
