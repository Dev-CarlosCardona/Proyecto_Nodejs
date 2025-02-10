const { PORT, HOST } = require('./Port_And_Host/Port_And_Host');

const expressModule = require("express");
const app = expressModule();
const cors = require("cors");
const server = require("http").Server(app);
const bodyParser = require("body-parser");


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: "5000mb" }));


// ===============================================================================
// ==🚧 			IMPORTACIONES DE LAS RUTAS A UTILIZAR 🚧                   ==
// ===============================================================================

const InsertCompanyK = require('./InsertClient/InsertClient');
const LoginCompany = require('./LOGIN/Login');
const GetInformation = require("./GetInformation/GetInformation");
const Permissions = require("./Admin/Permissions");



// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Error interno del servidor");
});


app
  .use(InsertCompanyK)
  .use(LoginCompany)
  .use(GetInformation)
  .use(Permissions)



server.listen(PORT, HOST, () => {
  console.log(`Server iniciado http://${HOST}:${PORT}`);
});