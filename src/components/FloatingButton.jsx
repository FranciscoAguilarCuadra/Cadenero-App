import { FaPlus } from "react-icons/fa";
import "../styles/FloatingButton.css";

function FloatingButton({ onClick }) {
    return (
        <button
            className="floating-button"
            aria-label="Nuevo préstamo"
            onClick={onClick}
        >
            <FaPlus />
        </button>
    );
}

export default FloatingButton;