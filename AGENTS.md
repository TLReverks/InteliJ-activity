# AGENTS.md - Guía del Proyecto API de Asistencia (`com.microserviceRt.api`)

## 1. Descripción General
API REST construida con **Spring Boot**, conectada mediante **JDBC** (`JdbcTemplate`) a una base de datos **MySQL** en el puerto `3306` (usuario `root`, sin contraseña). Gestiona los registros de la clase de dominio existente `Asistencia` (`com.microserviceRt.api.Asistencia.Asistencia`), organizada por carpetas/capas (`Asistencia`, `controller`, `service`, `repository`, `config`, `exception`), con soporte de paginación, CORS habilitado para peticiones externas, manejo centralizado de códigos de estado HTTP `400` y `500`, y gestión de archivos de logs del sistema.

---

## 2. Estructura de Carpetas y Archivos del Proyecto

```text
api/
├── pom.xml
├── AGENTS.md
└── src/
    └── main/
        ├── java/com/microserviceRt/api/
        │   ├── ApiApplication.java                  # Clase principal @SpringBootApplication
        │   ├── Asistencia/
        │   │   └── Asistencia.java                  # Modelo de datos existente (id, nombre, fecha, tipoEntrenamiento, estado)
        │   ├── controller/
        │   │   └── AsistenciaController.java        # Controlador @RestController (GET paginado y POST)
        │   ├── service/
        │   │   └── AsistenciaService.java           # Lógica de negocio, validaciones y cálculo de paginación
        │   ├── repository/
        │   │   └── AsistenciaRepository.java        # Acceso a datos con JDBC (JdbcTemplate) hacia MySQL
        │   ├── config/
        │   │   └── CorsConfig.java                  # Configuración global de CORS para peticiones externas
        │   └── exception/
        │       └── GlobalExceptionHandler.java      # Manejo global de códigos de estado 400 y 500 (@RestControllerAdvice)
        └── resources/
            ├── application.properties               # Configuración JDBC MySQL (3306, root, sin clave) y archivos de logs
            └── static/
                ├── index.html                       # Interfaz gráfica web (Panel de Gestión de Asistencia)
                ├── styles.css                       # Estilos modernos y responsivos de la interfaz
                └── app.js                           # Lógica cliente (fetch GET paginado, POST y manejo visual 400/500)
```

---

## 2.1. Interfaz Gráfica Web (`resources/static/`)

Al iniciar Spring Boot, la interfaz gráfica queda disponible automáticamente en:
- **`http://localhost:8080/`**

Incluye:
- Formulario interactivo para **`POST /api/asistencia`** (con selector de fecha calendario, valores rápidos para `tipoEntrenamiento` y `estado`).
- Tabla paginada conectada a **`GET /api/asistencia?page=...&size=...`** con cambio de tamaño de página (`5`, `10`, `20`, `50`), botones de navegación y filtro rápido.
- Tarjetas de resumen en tiempo real (total de registros, página actual, estado HTTP) y alertas visuales detalladas para respuestas `201`, `400 Bad Request` y `500 Internal Server Error`.

---

## 3. Modelo de Base de Datos (`asistencia`)

- **Motor**: MySQL (`localhost:3306`)
- **Base de datos**: `asistencia` (se crea automáticamente si no existe mediante `createDatabaseIfNotExist=true`)
- **Usuario**: `root` (sin contraseña)
- **Tabla**: `asistencia` (verificada/creada automáticamente al iniciar en `AsistenciaRepository`)

```sql
CREATE TABLE IF NOT EXISTS asistencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    fecha DOUBLE NOT NULL,
    tipo_entrenamiento DOUBLE NOT NULL,
    estado DOUBLE NOT NULL
);
```

### Campos de `Asistencia.java`:
| Campo en Java | Columna en MySQL | Tipo | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `id` | `int` / `INT` | Identificador único autoincremental |
| `nombre` | `nombre` | `String` / `VARCHAR(255)` | Nombre de la persona / asistente |
| `fecha` | `fecha` | `double` / `DOUBLE` | Fecha o marca numérica del registro |
| `tipoEntrenamiento` | `tipo_entrenamiento` | `double` / `DOUBLE` | Código o valor del tipo de entrenamiento |
| `estado` | `estado` | `double` / `DOUBLE` | Estado numérico de la asistencia |

---

## 4. Endpoints del Controlador (`controller/AsistenciaController.java`)

Base URL: `http://localhost:8080/api/asistencia`

### 4.1. `GET /api/asistencia` (Con Paginación)
Obtiene la lista paginada de registros de asistencia desde MySQL mediante JDBC (`LIMIT` y `OFFSET`).

- **Parámetros Query (Opcionales)**:
  - `page` (int, por defecto `0`): Número de página (empezando desde `0`).
  - `size` (int, por defecto `10`): Cantidad de registros por página (debe ser `> 0`).
- **Ejemplo de petición**:
  ```bash
  curl -X GET "http://localhost:8080/api/asistencia?page=0&size=5"
  ```
- **Respuesta Exitosa (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "nombre": "Carlos Perez",
        "fecha": 20261123.0,
        "tipoEntrenamiento": 1.0,
        "estado": 1.0
      }
    ],
    "currentPage": 0,
    "pageSize": 5,
    "totalItems": 1,
    "totalPages": 1
  }
  ```

### 4.2. `POST /api/asistencia` (Crear Registro)
Inserta un nuevo registro de asistencia en MySQL mediante JDBC usando los campos de `Asistencia.java`.

- **Cuerpo de la petición (`application/json`)**:
  ```json
  {
    "nombre": "Carlos Perez",
    "fecha": 20261123.0,
    "tipoEntrenamiento": 1.0,
    "estado": 1.0
  }
  ```
- **Respuesta Exitosa (`201 Created`)**:
  ```json
  {
    "status": 201,
    "message": "Asistencia registrada correctamente",
    "data": {
      "id": 1,
      "nombre": "Carlos Perez",
      "fecha": 20261123.0,
      "tipoEntrenamiento": 1.0,
      "estado": 1.0
    }
  }
  ```

---

## 5. Manejo de Errores (Códigos 400 y 500 en `exception/GlobalExceptionHandler.java`)

- **`400 Bad Request`**: Se retorna cuando los parámetros de paginación son inválidos (`page < 0` o `size <= 0`), el JSON enviado está vacío o mal formado, los tipos de datos no coinciden, o faltan campos obligatorios (`nombre` vacío o `fecha <= 0`).
- **`500 Internal Server Error`**: Se retorna ante fallos de conexión JDBC con MySQL (`DataAccessException`), errores de SQL o excepciones internas del servidor.

---

## 6. Configuración de CORS y Archivos de Logs

- **CORS (`config/CorsConfig.java` y `@CrossOrigin`)**: Habilitado para todos los orígenes (`*`), métodos (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) y cabeceras (`*`) para permitir peticiones externas.
- **Archivos de Logs (`application.properties`)**: Configurados mediante SLF4J / Logback. Todas las operaciones del controlador, servicio, repositorio y errores `400`/`500` se registran tanto en consola como en el archivo:
  - `logs/api-asistencia.log`

---

## 7. Comandos de Ejecución

Desde la carpeta `api`:

```bash
# Compilar el proyecto
./mvnw clean compile

# Ejecutar la aplicación Spring Boot
./mvnw spring-boot:run
```
