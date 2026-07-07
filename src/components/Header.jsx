import { NavLink } from "react-router-dom";
import { FaHome, FaHistory } from "react-icons/fa";

import "../styles/Header.css";

function Header() {
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

        </nav>
    );
}

export default Header;