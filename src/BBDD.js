require('dotenv').config();

const ProyectoNodejs = {
    host: process.env.COMPANY_HOST,
    user: process.env.COMPANY_USER,
    password: process.env.COMPANY_PASSWORD,
    database: process.env.COMPANY_DB,
};

module.exports = { ProyectoNodejs };