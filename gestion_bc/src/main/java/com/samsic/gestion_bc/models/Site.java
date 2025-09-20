package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Site")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Site {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "codesite")
    private String codesite;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    @Column(name = "region")
    private String region;
}