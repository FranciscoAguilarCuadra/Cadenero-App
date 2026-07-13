import { isSupabaseConfigured, supabase } from "../supabase";

function validarConfiguracion() {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase no está configurado.");
    }
}

export async function obtenerSesionActual() {
    validarConfiguracion();

    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return data.session;
}

export function escucharCambiosSesion(callback) {
    validarConfiguracion();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });

    return () => data.subscription.unsubscribe();
}

export async function iniciarSesion(email, password) {
    validarConfiguracion();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;

    return data.session;
}

export async function cerrarSesion() {
    validarConfiguracion();

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
}

export async function obtenerPerfilUsuario(userId) {
    validarConfiguracion();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre, rol, activo")
        .eq("id", userId)
        .single();

    if (error) {
        throw new Error("Tu cuenta aún no está activa.");
    }

    return data;
}

export async function obtenerUsuarios() {
    validarConfiguracion();

    const { data, error } = await supabase
        .from("profiles")
        .select("id, email, nombre, rol, activo, fecha_creacion")
        .order("fecha_creacion", { ascending: false });

    if (error) throw error;

    return data;
}

export async function actualizarUsuario(usuario) {
    validarConfiguracion();

    const { data, error } = await supabase
        .from("profiles")
        .update({
            nombre: usuario.nombre,
            rol: usuario.rol,
            activo: usuario.activo,
            fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", usuario.id)
        .select("id, email, nombre, rol, activo, fecha_creacion")
        .single();

    if (error) throw error;

    return data;
}
