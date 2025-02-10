const { ProyectoNodejs } = require('../BBDD');
const mysql = require('mysql2');
const express = require('express');
const Permissions = express.Router();
const cors = require('cors');
const { authenticateToken } = require("../Auth/AuthMiddleware");


Permissions.use(cors());
Permissions.use(express.json());
Permissions.use(express.urlencoded({ extended: false }));

const pool = mysql.createPool(ProyectoNodejs);

//! ENDPOINT: Obtener los módulos (permisos) asignados al usuario según su cargo
Permissions.get('/API/GET-USER-PERMISSIONS/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        pool.query(
            "SELECT cargo FROM usuarios WHERE usuario = ?",
            [username],
            (err, userResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error en la consulta de usuario");
                }
                if (userResult.length === 0) {
                    return res.status(404).send("Usuario no encontrado");
                }
                const cargo = userResult[0].cargo;
                pool.query(
                    "SELECT Id_Modulo FROM permisos WHERE cargo = ?",
                    [cargo],
                    (err, permisosResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send("Error en la consulta de permisos");
                        }
                        return res.json(permisosResult);
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

//! ENDPOINT: Obtener los módulos (permisos) asignados a un cargo (rol)
Permissions.get('/API/UPDATE-USER-PERMISSIONS/:Cargo', authenticateToken, async (req, res) => {
    try {
        const { Cargo } = req.params;
        pool.query(
            "SELECT Id_Modulo FROM permisos WHERE cargo = ?",
            [Cargo],
            (err, permisosResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error al obtener permisos");
                }
                if (permisosResult.length === 0) {
                    return res.status(404).send("No se encontraron permisos para este cargo");
                }
                return res.json(permisosResult);
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

//! ENDPOINT: Obtener la lista de cargos (roles) existentes para asignar permisos
Permissions.get('/API/GET-LIST-CARGO/PERMISSIONS/', authenticateToken, async (req, res) => {
    try {
        // Se obtiene la lista de cargos desde la tabla de usuarios y se le asigna un alias
        pool.query(
            "SELECT DISTINCT cargo AS Nombre_Cargo_Normalizado FROM usuarios ORDER BY cargo",
            (err, cargosResult) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Error al obtener lista de cargos");
                }
                return res.json(cargosResult);
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});

//! ENDPOINT: Actualizar un permiso específico para un cargo
Permissions.put('/API/INSERT-PERMISSIONS/PUT/', authenticateToken, async (req, res) => {
    try {
        const { action, Nombre_Cargo_Normalizado, Id_Modulo } = req.body;
        if (!action || !Nombre_Cargo_Normalizado || Id_Modulo === undefined) {
            return res.status(400).send("Faltan datos en la solicitud");
        }

        // Esto permite enviar un solo permiso o varios al mismo tiempo.
        let permisos = Array.isArray(Id_Modulo) ? Id_Modulo : [Id_Modulo];

        if (action === "insert") {
            // Insertar cada permiso individualmente
            const promises = permisos.map(modId => {
                return new Promise((resolve, reject) => {
                    pool.query(
                        "INSERT IGNORE INTO permisos (cargo, Id_Modulo) VALUES (?, ?)",
                        [Nombre_Cargo_Normalizado, modId],
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        }
                    );
                });
            });
            await Promise.all(promises);
            return res.send("Permiso(s) insertado(s) correctamente");
        } else if (action === "delete") {
            // Eliminar solo el permiso o los permisos específicos
            const promises = permisos.map(modId => {
                return new Promise((resolve, reject) => {
                    pool.query(
                        "DELETE FROM permisos WHERE cargo = ? AND Id_Modulo = ?",
                        [Nombre_Cargo_Normalizado, modId],
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        }
                    );
                });
            });
            await Promise.all(promises);
            return res.send("Permiso(s) eliminado(s) correctamente");
        } else {
            return res.status(400).send("Acción no válida");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Error interno del servidor");
    }
});






module.exports = Permissions;
