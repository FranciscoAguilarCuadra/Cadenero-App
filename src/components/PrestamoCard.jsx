import {
    FaCamera,
    FaMoneyBillWave,
    FaCalendarAlt,
    FaEdit,
    FaCheckCircle,
} from "react-icons/fa";

import { formatearHora } from "../utils/fechas";
import "../styles/PrestamoCard.css";

function PrestamoCard({ prestamo, onEditar, onDevolver }) {
    const tieneFotoVehiculo = Boolean(prestamo.fotoVehiculo);
    const estaDevuelto = prestamo.estado === "Devuelto";
    const codigo = String(prestamo.id).slice(-4);
    const horaIngreso = formatearHora(prestamo.fechaIngreso);

    return (
        <article className="prestamo-card">
            <div className="vehicle-image">
                {tieneFotoVehiculo ? (
                    <img src={prestamo.fotoVehiculo} alt="Vehículo registrado" />
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
                        <h2>Arriendo</h2>
                        <span>
                            ID {codigo}
                            {horaIngreso ? ` · ${horaIngreso}` : ""}
                        </span>
                    </div>

                    <span className={estaDevuelto ? "status returned" : "status active"}>
                        {estaDevuelto ? "Devuelto" : "Activo"}
                    </span>
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

                {!estaDevuelto && (
                    <div className="prestamo-buttons">
                        <button
                            className="edit-button"
                            onClick={() => onEditar(prestamo)}
                        >
                            <FaEdit />
                            Editar
                        </button>

                        <button
                            className="return-button"
                            onClick={() => onDevolver(prestamo.id)}
                        >
                            <FaCheckCircle />
                            Devuelto
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
}

export default PrestamoCard;
