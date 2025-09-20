package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import lombok.*;

import jakarta.persistence.*;

@Entity
@Table(name = "suivi_prestation_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuiviPrestationNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "suivi_prestation_id", nullable = false)
    @JsonBackReference
    private SuiviPrestation suiviPrestation;

    @Column(name = "notification_type", nullable = false)
    private String notificationType;
}
