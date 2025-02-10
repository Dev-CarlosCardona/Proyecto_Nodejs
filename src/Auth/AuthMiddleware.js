const jwt = require('jsonwebtoken');
const moment = require('moment');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token === null || token === undefined || token === '') {
        return res.status(401).send('No Autorizado');
    }
    jwt.verify(token, process.env.KEY_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('No tienes permisos y esta prohibido acceder al recurso solicitado.');
        } else {
            req.user = user;
            next();
        }
    });
};

function decodeToken(token) {
    const decoded = new Promise((resolve, reject) => {
        try {
            const payload = jwt.decode(token, process.env.KEY_SECRET)

            if (payload.exp <= moment().unix()) {
                reject({
                    status: 401,
                    message: 'El token ha expirado'
                })
            }
            resolve(payload.sub)
        } catch (err) {
            reject({
                status: 500,
                message: 'Invalid Token'
            })
        }
    })

    return decoded
}


module.exports = { authenticateToken, decodeToken };
