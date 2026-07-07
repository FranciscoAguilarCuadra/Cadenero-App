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

function desdeSupabase(prestamo) {
    return {
        id: prestamo.id,
        dias: prestamo.dias,
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        fotoVehiculo: prestamo.foto_vehiculo || "",
        fotoGarantia: prestamo.foto_garantia || "",
        estado: prestamo.estado,
        usuarioId: prestamo.usuario_id,
        fechaIngreso: prestamo.fecha_ingreso,
        fechaDevolucion: prestamo.fecha_devolucion,
    };
}

async function haciaSupabase(prestamo) {
    const id = String(prestamo.id || Date.now());
    const fotoVehiculo = await subirFotoSiCorresponde(
        id,
        "vehiculo",
        prestamo.fotoVehiculo
    );
    const fotoGarantia = await subirFotoSiCorresponde(
        id,
        "garantia",
        prestamo.fotoGarantia
    );

    return {
        id,
        dias: Number(prestamo.dias),
        pago: prestamo.pago,
        observaciones: prestamo.observaciones || "",
        foto_vehiculo: fotoVehiculo,
        foto_garantia: fotoGarantia,
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
    const { data, error } = await supabase
        .from(TABLA_PRESTAMOS)
        .upsert(prestamoSupabase)
        .select()
        .single();

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
