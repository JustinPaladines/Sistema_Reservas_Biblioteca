// backend/src/routes/authRoutes.js

const express = require("express");
const router = express.Router();

const {
    supabaseAdmin,
    supabaseAuth,
    } = require("../supabaseClients");

    // endpoint para registrar usuarios
    router.post("/register", async (req, res) => {
        const { nombre, username, email, password } = req.body;

        // validar los datos recibidos
        if (!nombre || !email || !password) {
            return res.status(400).json({
                error: "Nombre, correo y contraseña son obligatorios."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: "La contraseña debe tener al menos 6 caracteres."
            });
        }

        try {
            // crear la cuenta en Supabase Auth
            const { data, error } = await supabaseAuth.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo:
                        "https://roomly-despliegue-svd6.vercel.app/correo-verificado"
                }
            });

            if (error) {
                return res.status(400).json({
                    error: error.message
                });
            }

            const userId = data?.user?.id;

            if (!userId) {
                return res.status(400).json({
                    error: "No se pudo completar el registro."
                });
            }

            // guardar los datos adicionales del estudiante
            const { error: insertError } = await supabaseAdmin
                .from("usuarios")
                .insert({
                    id: userId,
                    nombre,
                    correo: email,
                    username: username || null,
                    rol: "estudiante"
                });

            if (insertError) {
                // evitar dejar una cuenta sin su perfil en la tabla
                await supabaseAdmin.auth.admin.deleteUser(userId);

                return res.status(500).json({
                    error: "No se pudo guardar el perfil del usuario."
                });
            }

            // responder a la web o aplicación móvil
            return res.status(201).json({
                mensaje: "Registro exitoso.",
                user: {
                    id: userId,
                    nombre,
                    username,
                    email,
                    rol: "estudiante"
                },
                requiereConfirmacionCorreo: !data.session
            });

        } catch (error) {
            console.error("Error en registro:", error);

            return res.status(500).json({
                error: "Error interno del servidor."
            });
        }
    });
    
    // Endpoint para cerrar sesión
router.post("/logout", async (req, res) => {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (!token) {
        return res.status(401).json({
            error: "Token requerido"
        });
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.signOut(
            token,
            "global"
        );

        if (error) {
            return res.status(401).json({
                error: "No se pudo cerrar la sesión",
                detalle: error.message
            });
        }

        return res.status(200).json({
            mensaje: "Sesión cerrada correctamente"
        });
    } catch (error) {
        console.error("Error en logout:", error);

        return res.status(500).json({
            error: "Error interno del servidor"
        });
    }
});

    // endpoint para login
    router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
        error: "Faltan credenciales",
        });
    }

    try {
        // Buscar usuario en la tabla usuarios
        const { data: userData, error: userError } = await supabaseAdmin
        .from("usuarios")
        .select("id, correo, estado, intentos_fallidos, rol")
        .eq("correo", email)
        .maybeSingle();

        if (userError) {
        throw userError;
        }

        if (!userData) {
        return res.status(401).json({
            error: "Credenciales incorrectas",
        });
        }

        const {
        id,
        estado,
        intentos_fallidos,
        rol,
        } = userData;

        // Verificar estado del usuario
        if (estado === "bloqueado") {
        return res.status(403).json({
            error:
            "Cuenta bloqueada por seguridad. Contacta al administrador.",
        });
        }

        if (estado === "inactivo") {
        return res.status(403).json({
            error:
            "Cuenta inactiva. Contacta al administrador.",
        });
        }

        // Autenticar con Supabase Auth
        const {  data: authData, error: authError,
        } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
        });

        if (authError) {
        const nuevosIntentos = (intentos_fallidos || 0) + 1;

        let nuevoEstado = estado;
        let mensaje = "Credenciales incorrectas";

        if (nuevosIntentos >= 5) {
            nuevoEstado = "bloqueado";
            mensaje =
            "Cuenta bloqueada temporalmente por demasiados intentos fallidos.";
        }

        await supabaseAdmin
            .from("usuarios")
            .update({
            intentos_fallidos: nuevosIntentos,
            estado: nuevoEstado,
            })
            .eq("id", id);

        return res.status(401).json({
            error: mensaje,
        });
        }

        // Reiniciar intentos fallidos
        await supabaseAdmin
        .from("usuarios")
        .update({
            intentos_fallidos: 0,
            estado: "activo",
        })
        .eq("id", id);

        return res.status(200).json({
        message: "Login exitoso",
        user: {
            id: authData.user.id,
            email: authData.user.email,
            rol,
            estado: "activo",
        },
        token: authData.session.access_token,
        });

    } catch (err) {
        console.error("Error en login:", err);

        return res.status(500).json({
        error: "Error interno del servidor",
        detalle: err.message,
        });
    }
});



module.exports = router;