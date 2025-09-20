package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "ligne_bc")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LigneBC {

    @Id
    private String id;

    private String zone;
    private String site;
    private String fournisseur;
    private LocalDate dateDebutPlanifiee;
    private LocalDate dateGo;
    private LocalDate dateDebutReel;
    private LocalDate dateFinReel;

    @Enumerated(EnumType.STRING)
    private StatutRealisation statutRealisation;

    private Integer qteRealise;
    private LocalDate dateReceptionTech;
    private LocalDate dateDepotPf;

    @Enumerated(EnumType.STRING)
    private StatutReceptionSystem statutReceptionSystem;

    private String remarque;
    private Integer delaiReceptionBc;

    @ManyToOne
    @JoinColumn(name = "prestation_id")
    private Prestation prestation;

    public enum StatutRealisation {
        realise, en_cours, annule
    }

    public enum StatutReceptionSystem {
        Receptionne, A_deposer
    }
}
