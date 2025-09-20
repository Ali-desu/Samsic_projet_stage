package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "coordinateurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coordinateur {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private Utilisateur user;

    @ManyToOne
    @JoinColumn(name = "zone_id")
    private Zone zone;
}