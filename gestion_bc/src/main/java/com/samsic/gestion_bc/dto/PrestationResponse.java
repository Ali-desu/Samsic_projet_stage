package com.samsic.gestion_bc.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrestationResponse {
    private String id;
    private Integer numLigne;
    private String description;
    private Double qteBc;
    private String famille;
    private ServiceResponse service;
    private ZoneResponse zone;
}