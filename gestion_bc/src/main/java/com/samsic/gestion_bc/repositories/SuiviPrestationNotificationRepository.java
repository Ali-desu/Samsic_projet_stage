package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.SuiviPrestation;
import com.samsic.gestion_bc.models.SuiviPrestationNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuiviPrestationNotificationRepository extends JpaRepository<SuiviPrestationNotification, Integer> {
    List<SuiviPrestationNotification> findBySuiviPrestationAndNotificationType(SuiviPrestation suiviPrestation, String notificationType);

}
