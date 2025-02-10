const { ProyectoNodejs } = require('../BBDD');

const mysql = require('mysql2');
const express = require('express');
const CompanyK = express.Router();
const cors = require('cors');
const http = require('http');
const { authenticateToken } = require('../Auth/AuthMiddleware');

CompanyK.use(cors());
CompanyK.use(express.json());
CompanyK.use(express.urlencoded({ extended: false }));


const pool = mysql.createPool(ProyectoNodejs);

// ENDPOINT PARA VISUALIZAR TODOS LOS EMPLEADOS QUE SE ENCUENTRA EN LA TABLA
CompanyK.get('/API/GET/ALL-COMPANY/', authenticateToken, async (req, res, next) => {
    try {
        const Query = () => new Promise((resolve, rejects) => {
            pool.getConnection((err, connetion) => {
                if (err) {
                    rejects('Error del servidor');
                }
                const sql = `SELECT * FROM empleado`;
                connetion.query(sql, (error, results) => {
                    connetion.release();
                    if (error) {
                        return rejects('Error de servidor consulta');
                    } else if (results.length === 0) {
                        return rejects('No hay resultados');
                    } else {
                        resolve(results);
                    }
                })
            });
        });

        const result = await Query();

        if (result.length === 0) {
            return res.status(404).send('No Result');
        }

        return res.status(200).send(result)
    } catch (error) {
        return next('Error interno del servidor, consulta no valida');
    }
});

// ENDPOINT PARA INSERTAR EMPLEADOS NUEVOS
CompanyK.post('/API/POST/INSERT-PERSON/', authenticateToken, async (req, res, next) => {
    try {
        const { FECHA_INGRESO, NOMBRE, SALARIO, Estado_Empleado } = req.body;

        // Verifica que se hayan enviado todos los campos obligatorios
        if (!FECHA_INGRESO || !NOMBRE || !SALARIO || !Estado_Empleado) {
            return res.status(400).send('Faltan datos obligatorios');
        }

        // parseFloat convierte el valor a número y se verifica que sea >= 0.
        if (parseFloat(SALARIO) < 0) {
            return res.status(400).send('No se permiten números negativos en el salario');
        }

        // Verificar si el empleado ya existe en la base de datos
        const CheckIfExists = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error de servidor en la conexión a la base de datos');
                }

                const sqlCheck = `SELECT * FROM Empleado WHERE NOMBRE = ?;`;
                connection.query(sqlCheck, [NOMBRE], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });

        const existingUser = await CheckIfExists();

        if (existingUser.length > 0) {
            return res.status(404).send('Error: El usuario ya existe en la base de datos');
        }

        // Función para insertar el nuevo empleado en la base de datos
        const InsertQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error de servidor en la conexión a la base de datos');
                }

                const sqlInsert = `INSERT INTO Empleado (FECHA_INGRESO, NOMBRE, SALARIO, Estado_Empleado) VALUES (?, ?, ?, ?);`;
                const Values = [FECHA_INGRESO, NOMBRE, SALARIO, Estado_Empleado];

                connection.query(sqlInsert, Values, (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });

        const result = await InsertQuery();

        // Se envía la respuesta exitosa, incluyendo success: true
        res.status(201).send({ success: true, message: 'Registro insertado correctamente', result });

    } catch (error) {
        console.error('Error interno del servidor:', error);
        return next('Error interno del servidor, consulta no valida');
    }
});

// ENDPOINT PARA ACTULIZAR LOS DATOS DE LOS EMPLEADOS
CompanyK.put('/API/PUT/UPDATE-PERSON/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;
        const { FECHA_INGRESO, NOMBRE, SALARIO, Estado_Empleado } = req.body;

        // Verifica que se hayan enviado todos los campos obligatorios
        if (!FECHA_INGRESO || !NOMBRE || !SALARIO || !Estado_Empleado) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
        }

        // Verificar que el salario no sea negativo
        if (parseFloat(SALARIO) < 0) {
            return res.status(400).json({ success: false, message: 'No se permiten números negativos en el salario' });
        }

        // Verificar si el empleado con ese ID existe
        const CheckIfExists = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) return reject('Error de servidor en la conexión a la base de datos');
                const sqlCheck = `SELECT * FROM Empleado WHERE ID = ?;`;
                connection.query(sqlCheck, [id], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });
        const existingUser = await CheckIfExists();
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'Error: El usuario no existe en la base de datos' });
        }

        // Verificar si los datos ya existen en otro ID (duplicidad)
        const CheckDuplicate = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) return reject('Error de servidor en la conexión a la base de datos');
                const sqlCheckDuplicate = `SELECT * FROM Empleado WHERE NOMBRE = ? AND FECHA_INGRESO = ? AND SALARIO = ? AND Estado_Empleado = ? AND ID <> ?;`;
                connection.query(sqlCheckDuplicate, [NOMBRE, FECHA_INGRESO, SALARIO, Estado_Empleado, id], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });
        const duplicateUser = await CheckDuplicate();
        if (duplicateUser.length > 0) {
            return res.status(409).json({ success: false, message: 'Error: Los datos ya existen en otro usuario' });
        }

        // Actualizar el empleado si pasa todas las validaciones
        const UpdateQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) return reject('Error de servidor en la conexión a la base de datos');
                const sqlUpdate = `UPDATE Empleado SET FECHA_INGRESO = ?, NOMBRE = ?, SALARIO = ?, Estado_Empleado = ? WHERE ID = ?;`;
                const VALUES = [FECHA_INGRESO, NOMBRE, SALARIO, Estado_Empleado, id];
                connection.query(sqlUpdate, VALUES, (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });
        const result = await UpdateQuery();

        // Envía la respuesta exitosa en formato JSON
        return res.status(200).json({ success: true, message: 'Registro actualizado correctamente', result });
    } catch (error) {
        console.error('Error interno del servidor:', error);
        return next('Error interno del servidor, consulta no valida');
    }
});

// ENDPOINT PARA ELIMINAR LOS EMPLEADOS
CompanyK.delete('/API/DELETE/PERSON-DELETE/:id', authenticateToken, async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: 'Falta el ID del usuario a eliminar' });
        }

        // Verificar si el empleado con el ID existe
        const CheckIfExists = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error de servidor en la conexión a la base de datos');
                }
                const sqlCheck = `SELECT * FROM Empleado WHERE ID = ?;`;
                connection.query(sqlCheck, [id], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });
        const existingUser = await CheckIfExists();
        if (existingUser.length === 0) {
            return res.status(404).json({ success: false, message: 'Error: El usuario no existe en la base de datos' });
        }

        // Eliminar el empleado si existe
        const DeleteQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error de servidor en la conexión a la base de datos');
                }
                const sqlDelete = `DELETE FROM Empleado WHERE ID = ?;`;
                connection.query(sqlDelete, [id], (error, results) => {
                    connection.release();
                    if (error) {
                        console.error('Error en la consulta SQL:', error);
                        return reject('Error en la consulta a la base de datos');
                    }
                    resolve(results);
                });
            });
        });
        await DeleteQuery();
        return res.status(200).json({ success: true, message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error('Error interno del servidor:', error);
        return next('Error interno del servidor, consulta no valida');
    }
});




// ENDPOINT PARA EL TAMAÑO DE LOS EMPLEADOS ACTIVOS
CompanyK.get('/API/GET/ACTIVO-EMPLEADO/', authenticateToken, async (req, res, next) => {
    try {
        const ActivoQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error interno del servidor');
                }
                // La cantidad, es recomendable por eso se utiliza COUNT(*)
                const sqlActivo = `SELECT COUNT(*) AS total FROM Empleado WHERE Estado_Empleado = 'Activo'`;

                connection.query(sqlActivo, (error, result) => {
                    connection.release();
                    if (error) {
                        console.log(error);
                        return reject('Error interno del servidor');
                    }
                    resolve(result);
                });
            });
        });

        const result = await ActivoQuery();

        return res.status(200).send(result);
    } catch (error) {
        return next('Error interno del servidor');
    }
});

// ENDPOINT PARA EL TAMAÑO DE LOS EMPLEADOS RETIROS
CompanyK.get('/API/GET/RETIRO-EMPLEADO/', authenticateToken, async (req, res, next) => {
    try {
        const RetiroQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error interno del servidor');
                }
                const sqlRetiro = `SELECT COUNT(*) AS total FROM Empleado WHERE Estado_Empleado = 'Retiro'`;

                connection.query(sqlRetiro, (error, result) => {
                    connection.release();
                    if (error) {
                        console.log(error);
                        return reject('Erro interno del servidor');
                    } else if (result.length === 0) {
                        res.status(200).send('0');
                    } else {
                        resolve(result);
                    }
                });
            })
        });
        const result = await RetiroQuery();

        if (result.length === 0) {
            return res.status(404).send('Not Result');
        }

        return res.status(200).send(result);
    } catch (error) {
        return next('Error interno del servidor');
    }
});

// ENDPOINT PARA EL TAMAÑO DE TODOS LOS EMPLEADOS
CompanyK.get('/API/GET/TODO-EMPLEADO/', authenticateToken, async (req, res, next) => {
    try {
        const AllQuery = () => new Promise((resolve, reject) => {
            pool.getConnection((err, connection) => {
                if (err) {
                    return reject('Error interno del servidor');
                }
                // Consulta para obtener la cantidad total de empleados
                const sqlAll = `SELECT COUNT(*) AS total FROM Empleado`;

                connection.query(sqlAll, (error, result) => {
                    connection.release();
                    if (error) {
                        console.log(error);
                        return reject('Error interno del servidor');
                    }
                    // Se resuelve la promesa con el resultado obtenido
                    resolve(result);
                });
            });
        });

        const result = await AllQuery();
        // result es un arreglo con un objeto: [ { total: <cantidad> } ]
        return res.status(200).send(result);
    } catch (error) {
        return next('Error interno del servidor');
    }
});





module.exports = CompanyK;