package com.samsic.gestion_bc.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class TableauDeBordDTO {
    private String familleProjet;
    private BigDecimal montantTotalBC;
    private BigDecimal montantClotureTerrain;
    private BigDecimal tauxRealisation;
    private BigDecimal montantReceptionneFacture;
    private BigDecimal montantDeposeReceptionSys;
    private BigDecimal montantADeposerReceptionSys;
    private BigDecimal montantEnCoursRecepTech;
    private BigDecimal montantAvecReserveRecepTech;
    private BigDecimal montantRestantBC;
    private BigDecimal montantTravauxEnCoursCodeSite;
}

