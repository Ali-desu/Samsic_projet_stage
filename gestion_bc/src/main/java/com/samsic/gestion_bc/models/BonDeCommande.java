package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Table(name = "bon_de_commande")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonDeCommande {
    @Id
    @Column(name = "num_bc")
    private String numBc;

    private String divisionProjet;

    private String codeProjet;

    private String description;

    @Temporal(TemporalType.DATE)
    private LocalDate dateEdition;

    private String numProjetFacturation;

    private String numPvReception;

    private boolean isOt = false; //to be deleted later

    private String numOt; //to be deleted later

    @ManyToOne
    @JoinColumn(name = "back_office_id")
    private BackOffice backOffice;

    @OneToMany(mappedBy = "bonDeCommande", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Prestation> prestations = new ArrayList<>();
}