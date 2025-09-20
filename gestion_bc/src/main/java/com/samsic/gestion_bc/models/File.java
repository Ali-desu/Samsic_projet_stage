package com.samsic.gestion_bc.models;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "files")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class File {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;          // e.g., "bon_de_commande.pdf"
    private String contentType;   // e.g., "application/pdf"

    @Lob
    private byte[] content;

    @OneToOne
    @JoinColumn(name = "suivi_prestation_id")
    private SuiviPrestation suiviPrestation;

    @OneToOne
    @JoinColumn(name = "bon_de_commande_id")
    private BonDeCommande bonDeCommande;

}
