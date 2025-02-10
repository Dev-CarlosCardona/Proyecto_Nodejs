
const express = require('express');
const LoginCompany = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

LoginCompany.use(express.json());
LoginCompany.use(cors());
LoginCompany.use(cookieParser());

LoginCompany.use(
    session({
        secret: process.env.KEY_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 5 * 60 * 1000,
        },
    })
);

const options = { expiresIn: '10m' };
function createJwtToken(payload) {
    const secret = process.env.KEY_SECRET;
    return jwt.sign(payload, secret, options);
}

// Conexión a la base de datos
const pool = mysql.createPool({
    host: process.env.COMPANY_HOST,
    user: process.env.COMPANY_USER,
    password: process.env.COMPANY_PASSWORD,
    database: process.env.COMPANY_DB,
});

// Endpoint para renovar el token
LoginCompany.post('/renew-token', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.KEY_SECRET);
        const newToken = createJwtToken({ username: decoded.username, id: decoded.id, cargo: decoded.cargo });
        return res.status(200).send({
            token: newToken,
            tokenExpire: options.expiresIn,
        });
    } catch (error) {
        return res.status(401).send('Invalid token');
    }
});

// Endpoint de LOGIN
LoginCompany.post('/API/AUTH/LOGIN', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Usuario y contraseña son requeridos" });
        }

        // Buscar el usuario en la BD (la columna es 'usuario')
        const [rows] = await pool.query("SELECT * FROM usuarios WHERE usuario = ?", [username]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }
        console.log(username);
        const user = rows[0];

        // Comparar la contraseña ingresada con el hash almacenado
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Credenciales inválidas" });
        }

        // Crear token JWT
        const tokenPayload = { id: user.id, username: user.usuario, cargo: user.cargo };
        const token = createJwtToken(tokenPayload);

        return res.status(200).json({
            message: "Login exitoso",
            username: user.usuario,
            token: token,
            tokenExpire: options.expiresIn,
            rol: user.cargo,
        });
    } catch (error) {
        console.error("Error en /API/AUTH/LOGIN:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

// Endpoint de REGISTRO (para que los nuevos usuarios se registren y se encripte la contraseña)
LoginCompany.post('/API/AUTH/REGISTER', async (req, res) => {
    try {
        const { nombre, apellido, cargo, usuario, password } = req.body;

        if (!nombre || !apellido || !cargo || !usuario || !password) {
            return res.status(400).json({ message: "Todos los campos son obligatorios" });
        }

        // Verificar si el usuario ya existe
        const [existingUser] = await pool.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: "El usuario ya existe" });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar en la BD
        await pool.query(
            "INSERT INTO usuarios (nombre, apellido, cargo, usuario, password) VALUES (?, ?, ?, ?, ?)",
            [nombre, apellido, cargo, usuario, hashedPassword]
        );

        return res.status(201).json({ message: "Usuario registrado exitosamente" });
    } catch (error) {
        console.error("Error en /API/AUTH/REGISTER:", error);
        return res.status(500).json({ message: "Error interno del servidor" });
    }
});

module.exports = LoginCompany;
