import { isSupabaseConfigured, supabase } from "../supabase";

const BUCKET_PRESTAMOS = "prestamos";
const TABLA_PRESTAMOS = "prestamos";

function dataUrlToBlob(dataUrl) {
    const [metadata, base64] = dataUrl.split(",");
    const mime = metadata.match(/data:(.*);base64/)?.[1] || "image/jpeg";
    const bytes = atob(base64);
    const buffer = new Uint8Array(bytes.length);

    for (let index = 0; index < bytes.length; index += 1) {
        buffer[index] = bytes.charCodeAt(index);
    }

    return new Blob([buffer], { type: mime });
}

function crearNombreFoto(prestamoId, campo) {
    return `${prestamoId}/${campo}-${Date.now()}.jpg`;
}

function obtenerRutaFotoDesdeUrl(url) {
    if (!url) return null;

    const marcador = `/storage/v1/object/public/${BUCKET_PRESTAMOS}/`;
    const posicion = url.indexOf(marcador);

    if (posicion === -1) return null;

    return decodeURIComponent(url.slice(posicion + marcador.length));
}

function normalizarFotosVehiculo(prestamo) {
    if (Array.isArray(prestamo.fotosVehiculo) && prestamo.fotosVehiculo.length > 0) {
        return prestamo.fotosVehiculo.filter(Boolean);
    }

    if (Array.isArray(prestamo.fotos_vehiculo) && prestamo.fotos_vehiculo.length > 0) {
        return prestamo.fotos_vehiculo.filter(Boolean);
    }

    return prestamo.fotoVehiculo || prestamo.foto_vehiculo
        ? [prestamo.fotoVehiculo || prestamo.foto_vehiculo]
        : [];
}

async function subirFotoSiCorresponde(prestamoId, campo, valor) {
    if (!valor || !valor.startsWith("data:image")) {
        return valor || "";
    }

    const ruta = crearNombreFoto(prestamoId, campo);
    const archivo = dataUrlToBlob(valor);
    const { error } = await supabase.storage
        .from(BUCKET_PRESTAMOS)
        .upload(ruta, archivo, {
            contentType: archivo.type,
            upsert: true,
        });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_PRESTAMOS).getPublicUrl(ruta);

    return data.publicUrl;
}

async function subirFotosVehiculo(prestamoId, fotos) {
    const fotosNormalizadas = fotos.filter(Boolean);

    return Promise.all(
        fotosNormalizadas.map((foto, index) =>
            subirFotoSiCorresponde(prestamoId, `vehiculo-${index + 1}`, foto)
        )
    );
}

function desdeSupabase(prestamo) {
    const fotosVehiculo = normalizarFotosVehiculo(prestamo);

    return {
        id: prestamo.id,
        tipo: prestamo.tipo || "Arriendo",
        dias: prestamo.dias,
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        fotoVehiculo: fotosVehiculo[0] || "",
        fotosVehiculo,
        danioPrevio: Boolean(prestamo.danio_previo),
        estado: prestamo.estado,
        usuarioId: prestamo.usuario_id,
        fechaIngreso: prestamo.fecha_ingreso,
        fechaDevolucion: prestamo.fecha_devolucion,
    };
}

async function haciaSupabase(prestamo) {
    const id = String(prestamo.id || Date.now());
    const fotosVehiculo = await subirFotosVehiculo(
        id,
        normalizarFotosVehiculo(prestamo)
    );

    return {
        id,
        tipo: prestamo.tipo || "Arriendo",
        dias: Number(prestamo.dias),
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        foto_vehiculo: fotosVehiculo[0] || "",
        fotos_vehiculo: fotosVehiculo,
        danio_previo: Boolean(prestamo.danioPrevio),
        estado: prestamo.estado || "Activo",
        usuario_id: prestamo.usuarioId || null,
        fecha_ingreso: prestamo.fechaIngreso || new Date().toISOString(),
        fecha_devolucion: prestamo.fechaDevolucion || null,
        fecha_actualizacion: new Date().toISOString(),
    };
}

function validarConfiguracion() {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase no esta configurado.");
    }
}

export async function obtenerPrestamos(perfil) {
    validarConfiguracion();

    let consulta = supabase
        .from(TABLA_PRESTAMOS)
        .select("*")
        .order("fecha_ingreso", { ascending: false });

    if (perfil?.rol !== "admin") {
        consulta = consulta.eq("usuario_id", perfil?.id);
    }

    const { data, error } = await consulta;

    if (error) throw error;

    return data.map(desdeSupabase);
}

export async function guardarPrestamo(prestamo) {
    validarConfiguracion();

    const prestamoSupabase = await haciaSupabase(prestamo);
    let { data, error } = await supabase
        .from(TABLA_PRESTAMOS)
        .upsert(prestamoSupabase)
        .select()
        .single();

    if (error && error.message?.includes("danio_previo")) {
        const prestamoSinDanioPrevio = { ...prestamoSupabase };
        delete prestamoSinDanioPrevio.danio_previo;

        const resultadoFallback = await supabase
            .from(TABLA_PRESTAMOS)
            .upsert(prestamoSinDanioPrevio)
            .select()
            .single();

        data = resultadoFallback.data;
        error = resultadoFallback.error;
    }

    if (error) throw error;

    return desdeSupabase(data);
}

export async function marcarPrestamoDevuelto(id) {
    validarConfiguracion();

    const { data, error } = await supabase
        .from(TABLA_PRESTAMOS)
        .update({
            estado: "Devuelto",
            fecha_devolucion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", String(id))
        .select()
        .single();

    if (error) throw error;

    return desdeSupabase(data);
}

export async function reactivarPrestamo(id) {
    validarConfiguracion();

    const { data, error } = await supabase
        .from(TABLA_PRESTAMOS)
        .update({
            estado: "Activo",
            fecha_devolucion: null,
            fecha_actualizacion: new Date().toISOString(),
        })
        .eq("id", String(id))
        .select()
        .single();

    if (error) throw error;

    return desdeSupabase(data);
}

export async function eliminarPrestamo(prestamo) {
    validarConfiguracion();

    const rutasFotos = [
        ...normalizarFotosVehiculo(prestamo).map(obtenerRutaFotoDesdeUrl),
    ].filter(Boolean);
    const rutasUnicas = [...new Set(rutasFotos)];

    const { data, error } = await supabase
        .from(TABLA_PRESTAMOS)
        .delete()
        .eq("id", String(prestamo.id))
        .select("id");

    if (error) throw error;

    if (!data || data.length === 0) {
        throw new Error(
            "Supabase no elimino el arriendo. Revisa las politicas de eliminacion."
        );
    }

    if (rutasUnicas.length > 0) {
        const { error: errorFotos } = await supabase.storage
            .from(BUCKET_PRESTAMOS)
            .remove(rutasUnicas);

        if (errorFotos) {
            console.error("No se pudieron eliminar las fotos del arriendo.", errorFotos);
        }
    }
}
