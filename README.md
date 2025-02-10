# Configuración de Variables de Entorno

Este proyecto utiliza variables de entorno para configurar aspectos críticos de la aplicación, como la autenticación y la conexión a la base de datos. Para que el proyecto funcione correctamente, sigue estos pasos:

1. **Crear el archivo `.env`**  
   En la raíz del proyecto, crea un archivo llamado `.env` (si aún no existe).

2. **Agregar las siguientes variables**  
   Copia y pega el siguiente contenido en el archivo `.env` y ajusta los valores según tu entorno:

   ```env
   # Clave secreta para autenticación 
   KEY_SECRET=mi_clave_secreta_super_segura

   # Configuración del servidor de la aplicación
   HOST=localhost
   PORT=3000

   # Configuración de la base de datos de la empresa
   COMPANY_HOST=localhost
   COMPANY_USER=usuario_db
   COMPANY_PASSWORD=contraseña_db
   COMPANY_DB=nombre_de_basedatos




-- ====================================================
-- Creación de la base de datos y selección de la misma
-- ====================================================
CREATE DATABASE IF NOT EXISTS proyectonodejs;
USE proyectonodejs;

-- ====================================================
-- Creación de la tabla 'permisos'
-- ====================================================
CREATE TABLE IF NOT EXISTS permisos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cargo VARCHAR(50) NOT NULL,
  Id_Modulo INT NOT NULL,
  UNIQUE KEY unique_cargo_modulo (cargo, Id_Modulo)
);

-- ====================================================
-- Creación de la tabla 'usuarios'
-- ====================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  cargo VARCHAR(50) NOT NULL,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

-- ====================================================
-- Creación de la tabla 'Empleado'
-- ====================================================
CREATE TABLE IF NOT EXISTS Empleado (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  FECHA_INGRESO DATE NOT NULL,
  NOMBRE VARCHAR(50) NOT NULL,
  SALARIO INT NOT NULL
);

-- ====================================================
-- Creación de la tabla 'Solicitud'
-- (Con clave foránea referenciando a la tabla 'Empleado')
-- ====================================================
CREATE TABLE IF NOT EXISTS Solicitud (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  CODIGO VARCHAR(50) NOT NULL,
  DESCRIPCION VARCHAR(255) NOT NULL,
  RESUMEN VARCHAR(50),
  ID_EMPLEADO INT NOT NULL,
  CONSTRAINT fk_empleado FOREIGN KEY (ID_EMPLEADO) REFERENCES Empleado(ID)
    ON DELETE CASCADE ON UPDATE CASCADE
);


## Tome la desicion de crear una tabla mas de permisos por el motivo de separar la gestión de accesos a módulos de la información básica de los usuarios, siguiendo los principios de normalización y separación de responsabilidades. Esto permite actualizar, ampliar o modificar dinámicamente los permisos sin alterar la tabla de usuarios, facilitando el mantenimiento, la escalabilidad y la seguridad del sistema



## Si deseas desplegar la aplicación en un servidor, deberás generar una versión compilada y optimizada. Para hacerlo, sigue estos pasos:

Para desplegar la aplicación en producción, debes compilar el código fuente y generar una versión optimizada en la carpeta dist. Para hacerlo, sigue estos pasos:

1. **Ejecuta el comando de build:**
npm run build

Al finalizar, se creará una carpeta llamada dist en la raíz del proyecto.
Esta carpeta contiene el código compilado y listo para producción.