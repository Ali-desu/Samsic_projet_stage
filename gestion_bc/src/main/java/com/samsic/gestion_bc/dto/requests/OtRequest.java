package com.samsic.gestion_bc.dto.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtRequest {
    private String numOt;
    private String divisionProjet;
    private String codeProjet;
    private Integer zoneId;
    private LocalDate dateGo;
    private String codeSite;
    private Integer backOfficeId;
    private List<OtPrestationRequest> prestations = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OtPrestationRequest {
        private Long id;
        private Integer numLigne;
        private Integer quantiteValide;
        private Integer serviceId;
        private String famille;
        private Integer coordinateurId;
        private Integer qteRealise;
        private String fournisseur;
        private Date datePlanifiee;
        private Date dateDebut;
        private Date dateFin;
        private Date dateRealisation;
        private String statutDeRealisation;
        private Date dateRecepTech;
        private String statutDeRecepTech;
        private Date datePf;
        private Date dateRecepSys;
        private String statutReceptionSystem;
        private String remarque;
        private Integer delaiRecep;
    }
}