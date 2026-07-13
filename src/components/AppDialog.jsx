import {
    FaCheckCircle,
    FaExclamationTriangle,
    FaInfoCircle,
    FaTrash,
} from "react-icons/fa";

import "../styles/modal.css";

const iconosPorVariante = {
    danger: FaTrash,
    warning: FaExclamationTriangle,
    success: FaCheckCircle,
    info: FaInfoCircle,
};

function AppDialog({
    title,
    message,
    variant = "info",
    confirmLabel = "Aceptar",
    cancelLabel,
    isProcessing = false,
    onConfirm,
    onCancel,
}) {
    const Icono = iconosPorVariante[variant] || FaInfoCircle;

    return (
        <div className="app-dialog-overlay" role="presentation">
            <section
                className={`app-dialog app-dialog-${variant}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-dialog-title"
                aria-describedby="app-dialog-message"
            >
                <div className="app-dialog-icon" aria-hidden="true">
                    <Icono />
                </div>

                <div className="app-dialog-content">
                    <h2 id="app-dialog-title">{title}</h2>
                    <p id="app-dialog-message">{message}</p>
                </div>

                <div className="app-dialog-actions">
                    {cancelLabel && (
                        <button
                            type="button"
                            className="app-dialog-button app-dialog-button-secondary"
                            onClick={onCancel}
                            disabled={isProcessing}
                        >
                            {cancelLabel}
                        </button>
                    )}

                    <button
                        type="button"
                        className="app-dialog-button app-dialog-button-primary"
                        onClick={onConfirm}
                        disabled={isProcessing}
                    >
                        {isProcessing ? "Procesando..." : confirmLabel}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default AppDialog;
