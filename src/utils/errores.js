// Los fallos del guardado no son todos iguales: hay que decirle al usuario qué
// pasó de verdad, en vez del genérico "revisa tu conexión".

export function esRechazoDePermisos(error) {
    const mensaje =
        typeof error === "string" ? error : error?.message || "";

    return /row-level security|permission denied|forbidden|not authorized/i.test(
        mensaje
    );
}

export function mensajeDeError(error, accion) {
    if (esRechazoDePermisos(error)) {
        return `Este arriendo pertenece a otra cuenta y no se puede ${accion}.`;
    }

    if (!navigator.onLine) {
        return "Sin conexión: el cambio queda guardado en este teléfono y se sube solo al volver la señal.";
    }

    return `No se pudo ${accion}. Intenta nuevamente.`;
}
