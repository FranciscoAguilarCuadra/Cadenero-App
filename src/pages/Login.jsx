import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import "../styles/Login.css";

function Login({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
    const [mostrarPassword, setMostrarPassword] = useState(false);

    async function manejarSubmit(event) {
        event.preventDefault();
        setError("");
        setCargando(true);

        try {
            await onLogin(email.trim(), password);
        } catch (loginError) {
            setError(
                loginError.message || "No se pudo iniciar sesión. Revisa tus datos."
            );
        } finally {
            setCargando(false);
        }
    }

    return (
        <main className="login-page">
            <form className="login-card" onSubmit={manejarSubmit}>
                <div className="login-header">
                    <h1>Cadenero</h1>
                    <p>Ingreso exclusivo para cadeneros autorizados.</p>
                </div>

                <label className="login-field">
                    Correo
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>

                <label className="login-field">
                    Contraseña
                    <span className="password-input">
                        <input
                            type={mostrarPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />

                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setMostrarPassword((actual) => !actual)}
                            aria-label={
                                mostrarPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </span>
                </label>

                {error && <p className="login-error">{error}</p>}

                <button type="submit" className="login-button" disabled={cargando}>
                    {cargando ? "Ingresando..." : "Ingresar"}
                </button>
            </form>
        </main>
    );
}

export default Login;
