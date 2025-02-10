const { ProyectoNodejs } = require('../BBDD');
const { authenticateToken } = require("../Auth/AuthMiddleware");
const cors = require('cors');
const mysql = require('mysql2');
const express = require('express');
const Getinformation = express.Router();

Getinformation.use(cors());
Getinformation.use(express.json());
Getinformation.use(express.urlencoded({ extended: false }));

const pool = mysql.createPool(ProyectoNodejs);

Getinformation.get('/Full-information/:Fullname', authenticateToken, async (req, res, next) => {

    const Fullname = req.params.Fullname;

    try {
        const QueryInformation = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error interno del servidor');
                }
                const sql = `SELECT * FROM usuarios WHERE usuario = ? `;
                connection.query(sql, [Fullname, Fullname], (err, result) => {
                    connection.release();
                    if (err) {
                        return reject('Error en el servidor');
                    } else if (result.length > 0) {
                        resolve(result);
                    } else {
                        return reject({ redirect: '/' });
                    }
                });
            });
        });

        // Ejecutar la consulta y manejar los resultados
        const result = await QueryInformation().catch(err => {
            if (err.redirect) {
                return res.redirect(err.redirect);
            }
            return [];
        });

        if (result.length === 0) {
            return res.status(404).send('No tienes información');
        }

        // Enviar respuesta
        return res.status(200).send(result);

    } catch (error) {
        return next('Error interno del servidor');
    }
});

module.exports = Getinformation;
