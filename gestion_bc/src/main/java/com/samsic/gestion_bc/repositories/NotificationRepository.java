package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Notification;
import com.samsic.gestion_bc.models.SuiviPrestationNotification;
import com.samsic.gestion_bc.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Integer> {
    List<Notification> findByUtilisateur(Utilisateur utilisateur);
    List<Notification> findByUtilisateurAndIsRead(Utilisateur utilisateur, boolean isRead);
    @Query("SELECT spn FROM Notification spn " +
            "JOIN Utilisateur u ON spn.utilisateur.id = u.id " +
            "WHERE u.role = 'BACK_OFFICE' " +
            "ORDER BY spn.createdAt DESC")
    List<Notification> findAllBackOfficeNotifications();
}
