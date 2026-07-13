import { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaSave, FaSyncAlt, FaTimes, FaUserShield } from "react-icons/fa";

import AppDialog from "../components/AppDialog";
import Header from "../components/Header";
import {
    actualizarUsuario,
    crearUsuario,
    obtenerUsuarios,
} from "../services/authService";

import "../styles/Admin.css";

function ordenarUsuarios(usuarios) {
    return [...usuarios].sort((usuarioA, usuarioB) => {
        if (usuarioA.rol !== usuarioB.rol) {
            return usuarioA.rol === "admin" ? -1 : 1;
        }

        if (usuarioA.activo !== usuarioB.activo) {
            return usuarioA.activo ? -1 : 1;
        }

        return (usuarioA.nombre || usuarioA.email).localeCompare(
            usuarioB.nombre || usuarioB.email
        );
    });
}

function Admin({ usuarioActual, onLogout, onUsuarioActualizado }) {
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosEditados, setUsuariosEditados] = useState({});
    const [cargando, setCargando] = useState(true);
    const [creandoUsuario, setCreandoUsuario] = useState(false);
    const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
    const [guardandoId, setGuardandoId] = useState("");
    const [dialogo, setDialogo] = useState(null);
    const [nuevoUsuario, setNuevoUsuario] = useState({
        nombre: "",
        email: "",
        password: "",
        rol: "cadenero",
        activo: true,
    });

    const usuariosOrdenados = useMemo(() => ordenarUsuarios(usuarios), [usuarios]);
    const totalActivos = usuarios.filter((usuario) => usuario.activo).length;
    const totalAdmins = usuarios.filter((usuario) => usuario.rol === "admin").length;

    const cargarUsuarios = useCallback(async function cargarUsuarios() {
        setCargando(true);

        try {
            const usuariosRemotos = await obtenerUsuarios();
            setUsuarios(usuariosRemotos);
            setUsuariosEditados({});
        } catch (error) {
            console.error(error);
            setDialogo({
                title: "No se pudieron cargar",
                message:
                    "No se pudieron cargar los usuarios. Revisa tu conexión o las políticas de Supabase.",
                variant: "danger",
                confirmLabel: "Entendido",
                onConfirm: () => setDialogo(null),
            });
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            cargarUsuarios();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [cargarUsuarios]);

    function obtenerUsuarioEditable(usuario) {
        return usuariosEditados[usuario.id] || usuario;
    }

    function actualizarCampo(usuario, campo, valor) {
        setUsuariosEditados((edicionesActuales) => ({
            ...edicionesActuales,
            [usuario.id]: {
                ...(edicionesActuales[usuario.id] || usuario),
                [campo]: valor,
            },
        }));
    }

    function actualizarCampoNuevoUsuario(campo, valor) {
        setNuevoUsuario((usuarioActual) => ({
            ...usuarioActual,
            [campo]: valor,
        }));
    }

    function abrirNuevoUsuario() {
        setNuevoUsuario({
            nombre: "",
            email: "",
            password: "",
            rol: "cadenero",
            activo: true,
        });
        setModalNuevoUsuario(true);
    }

    function cerrarNuevoUsuario() {
        if (creandoUsuario) return;

        setModalNuevoUsuario(false);
    }

    async function guardarNuevoUsuario(event) {
        event.preventDefault();
        setCreandoUsuario(true);

        try {
            const usuarioCreado = await crearUsuario(nuevoUsuario);
            setUsuarios((usuariosActuales) => [usuarioCreado, ...usuariosActuales]);
            setModalNuevoUsuario(false);
        } catch (error) {
            console.error(error);
            setDialogo({
                title: "No se pudo crear",
                message:
                    error.message ||
                    "No se pudo crear el usuario. Revisa la función de Supabase.",
                variant: "danger",
                confirmLabel: "Entendido",
                onConfirm: () => setDialogo(null),
            });
        } finally {
            setCreandoUsuario(false);
        }
    }

    async function guardarUsuario(usuario) {
        const usuarioEditable = obtenerUsuarioEditable(usuario);
        const esUsuarioActual = usuario.id === usuarioActual?.id;

        if (esUsuarioActual) {
            usuarioEditable.rol = usuario.rol;
            usuarioEditable.activo = usuario.activo;
        }

        setGuardandoId(usuario.id);

        try {
            const usuarioGuardado = await actualizarUsuario(usuarioEditable);

            setUsuarios((usuariosActuales) =>
                usuariosActuales.map((usuarioActualLista) =>
                    usuarioActualLista.id === usuarioGuardado.id
                        ? usuarioGuardado
                        : usuarioActualLista
                )
            );

            setUsuariosEditados((edicionesActuales) => {
                const nuevasEdiciones = { ...edicionesActuales };
                delete nuevasEdiciones[usuario.id];
                return nuevasEdiciones;
            });

            if (usuarioGuardado.id === usuarioActual?.id) {
                onUsuarioActualizado(usuarioGuardado);
            }
        } catch (error) {
            console.error(error);
            setDialogo({
                title: "No se pudo guardar",
                message:
                    "No se pudieron guardar los cambios del usuario. Revisa tu conexión o las políticas de Supabase.",
                variant: "danger",
                confirmLabel: "Entendido",
                onConfirm: () => setDialogo(null),
            });
        } finally {
            setGuardandoId("");
        }
    }

    return (
        <main className="admin-page">
            <header className="admin-header">
                <div>
                    <p className="dashboard-label">Administración</p>
                    <h1 className="dashboard-title">Usuarios</h1>
                </div>

                <button
                    type="button"
                    className="admin-refresh-button"
                    onClick={cargarUsuarios}
                    disabled={cargando}
                    aria-label="Actualizar usuarios"
                >
                    <FaSyncAlt />
                </button>
            </header>

            <section className="admin-summary" aria-label="Resumen de usuarios">
                <div className="summary-item">
                    <span>{usuarios.length}</span>
                    <p>Total</p>
                </div>

                <div className="summary-item">
                    <span>{totalActivos}</span>
                    <p>Activos</p>
                </div>

                <div className="summary-item">
                    <span>{totalAdmins}</span>
                    <p>Admins</p>
                </div>
            </section>

            <p className="admin-note">
                Desde aquí puedes activar cuentas, cambiar nombres y asignar roles.
            </p>

            <button
                type="button"
                className="admin-create-button"
                onClick={abrirNuevoUsuario}
            >
                <FaPlus />
                Nuevo usuario
            </button>

            <section className="admin-users">
                {cargando ? (
                    <p className="empty-state">Cargando usuarios...</p>
                ) : usuariosOrdenados.length === 0 ? (
                    <p className="empty-state">No hay usuarios registrados.</p>
                ) : (
                    usuariosOrdenados.map((usuario) => {
                        const usuarioEditable = obtenerUsuarioEditable(usuario);
                        const esUsuarioActual = usuario.id === usuarioActual?.id;
                        const tieneCambios = Boolean(usuariosEditados[usuario.id]);

                        return (
                            <article className="admin-user-card" key={usuario.id}>
                                <div className="admin-user-heading">
                                    <div>
                                        <h2>{usuario.email}</h2>
                                        <p>{esUsuarioActual ? "Tu cuenta" : "Usuario"}</p>
                                    </div>

                                    {usuarioEditable.rol === "admin" && (
                                        <span className="admin-role-badge">
                                            <FaUserShield />
                                            Admin
                                        </span>
                                    )}
                                </div>

                                <label className="admin-field">
                                    Nombre
                                    <input
                                        type="text"
                                        value={usuarioEditable.nombre || ""}
                                        onChange={(event) =>
                                            actualizarCampo(
                                                usuario,
                                                "nombre",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Nombre visible"
                                    />
                                </label>

                                <div className="admin-controls">
                                    <label className="admin-field">
                                        Rol
                                        <select
                                            value={usuarioEditable.rol}
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    usuario,
                                                    "rol",
                                                    event.target.value
                                                )
                                            }
                                            disabled={esUsuarioActual}
                                        >
                                            <option value="cadenero">Cadenero</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </label>

                                    <label className="admin-toggle">
                                        <input
                                            type="checkbox"
                                            checked={usuarioEditable.activo}
                                            onChange={(event) =>
                                                actualizarCampo(
                                                    usuario,
                                                    "activo",
                                                    event.target.checked
                                                )
                                            }
                                            disabled={esUsuarioActual}
                                        />
                                        <span>{usuarioEditable.activo ? "Activo" : "Inactivo"}</span>
                                    </label>
                                </div>

                                {esUsuarioActual && (
                                    <p className="admin-lock-note">
                                        Tu rol y estado se bloquean para evitar perder acceso.
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="admin-save-button"
                                    onClick={() => guardarUsuario(usuario)}
                                    disabled={!tieneCambios || guardandoId === usuario.id}
                                >
                                    <FaSave />
                                    {guardandoId === usuario.id
                                        ? "Guardando..."
                                        : "Guardar cambios"}
                                </button>
                            </article>
                        );
                    })
                )}
            </section>

            <Header usuario={usuarioActual} onLogout={onLogout} />

            {modalNuevoUsuario && (
                <div className="modal-overlay">
                    <form
                        className="admin-create-modal"
                        onSubmit={guardarNuevoUsuario}
                        aria-busy={creandoUsuario}
                    >
                        <div className="modal-header">
                            <h2>Nuevo usuario</h2>

                            <button
                                type="button"
                                className="admin-modal-close"
                                onClick={cerrarNuevoUsuario}
                                disabled={creandoUsuario}
                                aria-label="Cerrar"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <label className="admin-field">
                            Nombre
                            <input
                                type="text"
                                value={nuevoUsuario.nombre}
                                onChange={(event) =>
                                    actualizarCampoNuevoUsuario(
                                        "nombre",
                                        event.target.value
                                    )
                                }
                                placeholder="Nombre visible"
                                disabled={creandoUsuario}
                            />
                        </label>

                        <label className="admin-field">
                            Email
                            <input
                                type="email"
                                value={nuevoUsuario.email}
                                onChange={(event) =>
                                    actualizarCampoNuevoUsuario(
                                        "email",
                                        event.target.value
                                    )
                                }
                                placeholder="correo@ejemplo.cl"
                                required
                                disabled={creandoUsuario}
                            />
                        </label>

                        <label className="admin-field">
                            Contraseña
                            <input
                                type="password"
                                value={nuevoUsuario.password}
                                onChange={(event) =>
                                    actualizarCampoNuevoUsuario(
                                        "password",
                                        event.target.value
                                    )
                                }
                                placeholder="Mínimo 6 caracteres"
                                minLength={6}
                                required
                                disabled={creandoUsuario}
                            />
                        </label>

                        <div className="admin-controls">
                            <label className="admin-field">
                                Rol
                                <select
                                    value={nuevoUsuario.rol}
                                    onChange={(event) =>
                                        actualizarCampoNuevoUsuario(
                                            "rol",
                                            event.target.value
                                        )
                                    }
                                    disabled={creandoUsuario}
                                >
                                    <option value="cadenero">Cadenero</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </label>

                            <label className="admin-toggle">
                                <input
                                    type="checkbox"
                                    checked={nuevoUsuario.activo}
                                    onChange={(event) =>
                                        actualizarCampoNuevoUsuario(
                                            "activo",
                                            event.target.checked
                                        )
                                    }
                                    disabled={creandoUsuario}
                                />
                                <span>{nuevoUsuario.activo ? "Activo" : "Inactivo"}</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="admin-save-button"
                            disabled={creandoUsuario}
                        >
                            <FaSave />
                            {creandoUsuario ? "Creando..." : "Crear usuario"}
                        </button>
                    </form>
                </div>
            )}

            {dialogo && <AppDialog {...dialogo} />}
        </main>
    );
}

export default Admin;
