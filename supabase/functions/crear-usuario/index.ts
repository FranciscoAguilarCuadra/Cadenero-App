import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

function obtenerSecretKey() {
    const secretKey =
        Deno.env.get("CADENERO_ADMIN_SECRET_KEY") ||
        Deno.env.get("CREAR_USUARIOS_ADMIN_KEY");

    if (secretKey) return secretKey;

    const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");

    if (!secretKeys) return "";

    try {
        const keys = JSON.parse(secretKeys) as Record<string, string>;
        const primeraKey = Object.values(keys).find(
            (value) => typeof value === "string"
        );

        return keys.crear_usuarios_admin || keys.service_role || primeraKey || "";
    } catch {
        return "";
    }
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return jsonResponse({ error: "Método no permitido." }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseSecretKey = obtenerSecretKey();
    const authHeader = request.headers.get("Authorization");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseSecretKey) {
        return jsonResponse(
            { error: "La función no tiene configuradas sus credenciales." },
            500
        );
    }

    if (!authHeader) {
        return jsonResponse({ error: "No autorizado." }, 401);
    }

    const supabaseUsuario = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: authHeader,
            },
        },
    });

    const {
        data: { user },
        error: errorUsuario,
    } = await supabaseUsuario.auth.getUser();

    if (errorUsuario || !user) {
        return jsonResponse({ error: "Sesión inválida." }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

    const { data: perfilAdmin, error: errorPerfil } = await supabaseAdmin
        .from("profiles")
        .select("rol, activo")
        .eq("id", user.id)
        .single();

    if (errorPerfil || !perfilAdmin?.activo || perfilAdmin.rol !== "admin") {
        return jsonResponse({ error: "Solo un admin puede crear usuarios." }, 403);
    }

    const body = await request.json().catch(() => null);
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const nombre = String(body?.nombre || email).trim();
    const rol = body?.rol === "admin" ? "admin" : "cadenero";
    const activo = Boolean(body?.activo);

    if (!email || !password) {
        return jsonResponse({ error: "Email y contraseña son obligatorios." }, 400);
    }

    if (password.length < 6) {
        return jsonResponse(
            { error: "La contraseña debe tener al menos 6 caracteres." },
            400
        );
    }

    const { data: usuarioCreado, error: errorCreacion } =
        await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre },
        });

    if (errorCreacion || !usuarioCreado.user) {
        return jsonResponse(
            { error: errorCreacion?.message || "No se pudo crear el usuario." },
            400
        );
    }

    const { data: perfil, error: errorActualizacion } = await supabaseAdmin
        .from("profiles")
        .upsert({
            id: usuarioCreado.user.id,
            email,
            nombre,
            rol,
            activo,
            fecha_actualizacion: new Date().toISOString(),
        })
        .select("id, email, nombre, rol, activo, fecha_creacion")
        .single();

    if (errorActualizacion) {
        return jsonResponse(
            { error: "El usuario se creó, pero no se pudo actualizar su perfil." },
            500
        );
    }

    return jsonResponse({ usuario: perfil }, 201);
});
