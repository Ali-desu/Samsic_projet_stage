package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "familles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Famille {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;
}