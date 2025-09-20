package com.samsic.gestion_bc.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class BonDeCommandeRequest {
    private String numBc; // Nullable for OT creation
    private String numOt; // Required for OT
    private String divisionProjet;
    private String codeProjet;
    private Integer zoneId; // New field for OT zone
    private LocalDate dateGo; // New field for SuiviPrestation
    private String codeSite; // New field
    private String description;
    private LocalDate dateEdition;
    private String numProjetFacturation;
    private String numPvReception;
    private Integer backOfficeId;
    private boolean isOt;
    private FileRequest fileRequest;
    private List<PrestationRequest> prestations = new ArrayList<>();
}