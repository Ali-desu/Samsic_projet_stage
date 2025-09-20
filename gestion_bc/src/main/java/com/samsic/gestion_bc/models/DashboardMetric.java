package com.samsic.gestion_bc.models;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "dashboard_metrics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "back_office_id")
    private Integer backOfficeId;

    @Column(name = "famille")
    private String famille;

    @Column(name = "calculation_date")
    private LocalDate calculationDate;

    @Column(name = "montant_total_bc")
    private Double montantTotalBc;

    @Column(name = "montant_cloture_terrain")
    private Double montantClotureTerrain;

    @Column(name = "taux_realisation")
    private Double tauxRealisation;

    @Column(name = "montant_receptionne_facture")
    private Double montantReceptionneFacture;

    @Column(name = "montant_depose_sys")
    private Double montantDeposeSys;

    @Column(name = "montant_a_depose_sys")
    private Double montantADeposeSys;
}