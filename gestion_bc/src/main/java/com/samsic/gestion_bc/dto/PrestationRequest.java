package com.samsic.gestion_bc.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PrestationRequest {
    private String id;
    private Integer numLigne;
    private String description;
    private Double qteBc;
    private String famille;
    private Integer serviceId;
    private Integer zoneId;
    private String fournisseur;
    private String remarque;
    private String codeSite;
}