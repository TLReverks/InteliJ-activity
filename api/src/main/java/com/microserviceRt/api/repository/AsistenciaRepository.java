package com.microserviceRt.api.repository;

import com.microserviceRt.api.Asistencia.Asistencia;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class AsistenciaRepository {

    private static final Logger logger = LoggerFactory.getLogger(AsistenciaRepository.class);
    private final JdbcTemplate jdbcTemplate;
    private volatile boolean tablaInicializada = false;

    public AsistenciaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Asistencia> asistenciaRowMapper = (rs, rowNum) -> new Asistencia(
            rs.getInt("id"),
            rs.getString("nombre"),
            rs.getDouble("fecha"),
            rs.getDouble("tipo_entrenamiento"),
            rs.getDouble("estado")
    );

    @PostConstruct
    public void inicializarTabla() {
        try {
            crearTablaSiNoExiste();
            logger.info("Tabla 'asistencia' verificada/inicializada correctamente en MySQL (puerto 3306).");
        } catch (Exception e) {
            logger.warn("No se pudo verificar o inicializar automáticamente la tabla 'asistencia' al arrancar: {}", e.getMessage());
        }
    }

    private void crearTablaSiNoExiste() {
        String sql = """
                CREATE TABLE IF NOT EXISTS asistencia (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(255) NOT NULL,
                    fecha DOUBLE NOT NULL,
                    tipo_entrenamiento DOUBLE NOT NULL,
                    estado DOUBLE NOT NULL
                )
                """;
        jdbcTemplate.execute(sql);
        tablaInicializada = true;
    }

    private void asegurarTablaInicializada() {
        if (!tablaInicializada) {
            crearTablaSiNoExiste();
            logger.info("Tabla 'asistencia' inicializada al primer acceso JDBC.");
        }
    }

    public List<Asistencia> findAllPaginated(int limit, int offset) {
        asegurarTablaInicializada();
        String sql = "SELECT id, nombre, fecha, tipo_entrenamiento, estado FROM asistencia ORDER BY id ASC LIMIT ? OFFSET ?";
        logger.debug("Ejecutando consulta JDBC paginada: LIMIT={}, OFFSET={}", limit, offset);
        return jdbcTemplate.query(sql, asistenciaRowMapper, limit, offset);
    }

    public int countAll() {
        asegurarTablaInicializada();
        String sql = "SELECT COUNT(*) FROM asistencia";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
        return (count != null) ? count : 0;
    }

    public Asistencia save(Asistencia asistencia) {
        asegurarTablaInicializada();
        String sql = "INSERT INTO asistencia (nombre, fecha, tipo_entrenamiento, estado) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        logger.debug("Insertando nuevo registro en MySQL para: {}", asistencia.getNombre());

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, asistencia.getNombre().trim());
            ps.setDouble(2, asistencia.getFecha());
            ps.setDouble(3, asistencia.getTipoEntrenamiento());
            ps.setDouble(4, asistencia.getEstado());
            return ps;
        }, keyHolder);

        Number generatedId = keyHolder.getKey();
        if (generatedId != null) {
            asistencia.setId(generatedId.intValue());
        }

        return asistencia;
    }
}

