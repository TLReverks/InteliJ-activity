package com.microserviceRt.api.Asistencia;

import com.fasterxml.jackson.annotation.JsonCreator;

public class Asistencia {
    private int id;
    private String nombre;
    private double fecha;
    private  double tipoEntrenamiento;
    private double estado;

    @JsonCreator
    public Asistencia() {
    }

    public Asistencia(int id, String nombre, double fecha, double tipoEntrenamiento, double estado) {
        this.id = id;
        this.nombre = nombre;
        this.fecha = fecha;
        this.tipoEntrenamiento = tipoEntrenamiento;
        this.estado = estado;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public double getFecha() {
        return fecha;
    }

    public void setFecha(double fecha) {
        this.fecha = fecha;
    }

    public double getTipoEntrenamiento() {
        return tipoEntrenamiento;
    }

    public void setTipoEntrenamiento(double tipoEntrenamiento) {
        this.tipoEntrenamiento = tipoEntrenamiento;
    }

    public double getEstado() {
        return estado;
    }

    public void setEstado(double estado) {
        this.estado = estado;
    }
}

