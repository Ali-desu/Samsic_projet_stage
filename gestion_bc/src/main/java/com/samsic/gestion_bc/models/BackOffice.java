package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "back_office")

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BackOffice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private Utilisateur user;
}
