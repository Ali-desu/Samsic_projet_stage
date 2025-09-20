package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceQ {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "famille_id")
    private Famille famille;

    private String refAuxigene;
    private String description;
    private String unite;
    private String type;
    private double prix;
    private String remarque;
    private String modele_technique; //marque
    private String type_materiel;
    private String specification;
    private String famille_technique;
}