package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "suivi_prestation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuiviPrestation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "prestation_id")
    private Prestation prestation;

    @ManyToOne
    private Site codesite;

    private Integer quantiteValide;

    @ManyToOne
    @JoinColumn(name = "coordinateur_id")
    private Coordinateur coordinateur;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @OneToOne
    @JoinColumn(name = "fichier_reception_tech_id")
    private File fichierReceptionTech;

    private Double qteRealise;

    private Double qteEncours;


    private Double qteTech;
    private Double qteDepose;
    private Double qteADepose;
    private Double qteSys;

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

    private Integer delaiRecep;

    @OneToMany(mappedBy = "suiviPrestation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<SuiviPrestationNotification> sentNotifications = new ArrayList<>();
}