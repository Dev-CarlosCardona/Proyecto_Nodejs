const dotenv = require('dotenv');
dotenv.config();

const HOST = process.env.HOST;
const PORT = process.env.PORT;

module.exports = { PORT, HOST };
