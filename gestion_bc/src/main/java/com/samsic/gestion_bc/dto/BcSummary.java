package com.samsic.gestion_bc.dto;

import java.time.LocalDate;
import lombok.*;

@Data          // generates getters, setters, toString, equals, and hashCode
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class BcSummary {
    private String numBc;
    private String divisionProjet;
    private String codeProjet;
    private LocalDate dateEdition;
    private String familleProjet;
    private String descriptionPrestation;

    private Double montantHt;
    private Double montantCloture;
    private Double montantFactureSys;
    private Double montantDepose;
    private Double montantADeposer;
    private Double TEC;
    private Double tauxRealisation;
}
