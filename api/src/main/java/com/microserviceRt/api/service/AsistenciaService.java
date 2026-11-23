package com.microserviceRt.api.service;

import com.microserviceRt.api.Asistencia.Asistencia;
import com.microserviceRt.api.repository.AsistenciaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AsistenciaService {

    private static final Logger logger = LoggerFactory.getLogger(AsistenciaService.class);
    private final AsistenciaRepository asistenciaRepository;

    public AsistenciaService(AsistenciaRepository asistenciaRepository) {
        this.asistenciaRepository = asistenciaRepository;
    }

    public Map<String, Object> obtenerAsistenciasPaginadas(int page, int size) {
        if (page < 0 || size <= 0) {
            logger.warn("Parámetros de paginación inválidos recibidos: page={}, size={}", page, size);
            throw new IllegalArgumentException("Los parámetros de paginación son inválidos: 'page' debe ser >= 0 y 'size' debe ser > 0.");
        }

        int offset = page * size;
        int totalItems = asistenciaRepository.countAll();
        List<Asistencia> asistencias = asistenciaRepository.findAllPaginated(size, offset);

        Map<String, Object> response = new HashMap<>();
        response.put("data", asistencias);
        response.put("currentPage", page);
        response.put("pageSize", size);
        response.put("totalItems", totalItems);
        response.put("totalPages", (int) Math.ceil((double) totalItems / size));

        logger.info("Paginación completada exitosamente: página {}, tamaño {}, devueltos {} de {} registros.",
                page, size, asistencias.size(), totalItems);

        return response;
    }

    public Asistencia registrarAsistencia(Asistencia asistencia) {
        if (asistencia == null) {
            logger.warn("Intento de registro con cuerpo de solicitud nulo");
            throw new IllegalArgumentException("El cuerpo de la solicitud no puede estar vacío.");
        }

        if (asistencia.getNombre() == null || asistencia.getNombre().trim().isEmpty()) {
            logger.warn("Validación fallida: el campo 'nombre' está vacío o nulo");
            throw new IllegalArgumentException("El campo 'nombre' es obligatorio y no puede estar vacío.");
        }

        if (asistencia.getFecha() <= 0) {
            logger.warn("Validación fallida: el campo 'fecha' es inválido ({})", asistencia.getFecha());
            throw new IllegalArgumentException("El campo 'fecha' debe ser un valor numérico mayor a 0.");
        }

        Asistencia creada = asistenciaRepository.save(asistencia);
        logger.info("Asistencia registrada correctamente en base de datos con ID: {}", creada.getId());
        return creada;
    }
}

