package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Entity
@Table(name = "ot_prestation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtPrestation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer numLigne;

    @Column(name = "qte_valide")
    private Integer quantiteValide;

    @OneToOne(cascade = CascadeType.MERGE)
    private ServiceQ service;

    private String famille;

    @ManyToOne
    @JoinColumn(name = "coordinateur_id")
    private Coordinateur coordinateur;

    @OneToOne
    @JoinColumn(name = "fichier_reception_tech_id")
    private File fichierReceptionTech;

    private String fournisseur;

    @Temporal(TemporalType.TIMESTAMP)
    private Date datePlanifiee;

    private LocalDate dateGo;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateDebut;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateFin;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateRealisation;

    private String statutDeRealisation;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateRecepTech;

    private String statutDeRecepTech;

    @Temporal(TemporalType.TIMESTAMP)
    private Date datePf;

    @Temporal(TemporalType.TIMESTAMP)
    private Date dateRecepSys;

    private String statutReceptionSystem;

    private String remarque;

    private double qteRealise;

    private double qteEncours;

    private Integer delaiRecep;

    @ManyToOne
    @JoinColumn(name = "ot_num_ot")
    @JsonBackReference
    private Ot ot;
}