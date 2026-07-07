import { NavLink } from "react-router-dom";
import { FaHome, FaHistory, FaSignOutAlt } from "react-icons/fa";

import "../styles/Header.css";

function Header({ usuario, onLogout }) {
    return (
        <nav className="bottom-nav">
            <NavLink
                to="/"
                end
                className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                }
            >
                <FaHome size={20} />
                <span>Inicio</span>
            </NavLink>

            <NavLink
                to="/historial"
                className={({ isActive }) =>
                    isActive ? "nav-item active" : "nav-item"
                }
            >
                <FaHistory size={20} />
                <span>Historial</span>
            </NavLink>

            {onLogout && (
                <button
                    type="button"
                    className="nav-item nav-button"
                    onClick={onLogout}
                    title={usuario?.nombre || usuario?.email || "Salir"}
                >
                    <FaSignOutAlt size={20} />
                    <span>Salir</span>
                </button>
            )}
        </nav>
    );
}

export default Header;
