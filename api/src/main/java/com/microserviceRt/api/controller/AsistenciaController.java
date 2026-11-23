package com.microserviceRt.api.controller;

import com.microserviceRt.api.Asistencia.Asistencia;
import com.microserviceRt.api.service.AsistenciaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/asistencia", "/api/asistencia/"})
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class AsistenciaController {

    private static final Logger logger = LoggerFactory.getLogger(AsistenciaController.class);
    private final AsistenciaService asistenciaService;

    public AsistenciaController(AsistenciaService asistenciaService) {
        this.asistenciaService = asistenciaService;
    }

    /**
     * Método GET con Paginación
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> listarAsistencias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        logger.info("Solicitud GET /api/asistencia recibida - page: {}, size: {}", page, size);
        Map<String, Object> resultado = asistenciaService.obtenerAsistenciasPaginadas(page, size);
        return ResponseEntity.ok(resultado);
    }

    /**
     * Método POST para crear un registro de Asistencia
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> crearAsistencia(@RequestBody(required = false) Asistencia asistencia) {
        logger.info("Solicitud POST /api/asistencia recibida");
        Asistencia creada = asistenciaService.registrarAsistencia(asistencia);

        Map<String, Object> response = new HashMap<>();
        response.put("status", HttpStatus.CREATED.value());
        response.put("message", "Asistencia registrada correctamente");
        response.put("data", creada);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

