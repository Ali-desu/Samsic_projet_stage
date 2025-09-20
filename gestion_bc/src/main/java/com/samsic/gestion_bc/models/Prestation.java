package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "prestations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prestation {
    @Id
    private String id;

    private Integer numLigne;

    private String famille;

    private String description;

    private String codeSite; //to be deleted

    private String fournisseur;

    private Double qteBc;

    @ManyToOne
    @JoinColumn(name = "service_id")
    private ServiceQ service;

    @OneToMany(mappedBy = "prestation", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonBackReference
    private List<SuiviPrestation> suivi;

    @ManyToOne
    @JoinColumn(name = "bc_id")
    @JsonBackReference
    private BonDeCommande bonDeCommande;
}