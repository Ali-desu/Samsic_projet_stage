package com.samsic.gestion_bc.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuiviPrestationRequest {
    private String numBc;
    private List<PrestationDetail> prestations;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PrestationDetail {
        private String prestationId;
        private Integer serviceId;
        private Integer siteId;
        private Integer quantiteValide;
        private String remarque;
        private Integer zoneId;
        private String fournisseur; // Added to match SuiviPrestation entity
    }
}