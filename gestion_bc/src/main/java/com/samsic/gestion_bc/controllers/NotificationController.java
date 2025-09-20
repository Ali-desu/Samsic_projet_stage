package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.NotificationResponse;
import com.samsic.gestion_bc.models.Notification;
import com.samsic.gestion_bc.models.SuiviPrestationNotification;
import com.samsic.gestion_bc.services.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class NotificationController {
    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/{utilisateurId}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE','CHEF_PROJET')")
    public ResponseEntity<List<NotificationResponse>> getNotificationsByUtilisateurId(@PathVariable Integer utilisateurId) {
        try {
            List<NotificationResponse> notifications = notificationService.getNotificationsByUtilisateurId(utilisateurId);
            return notifications.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(null)
                    : ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            System.out.println("Error fetching notifications for utilisateur ID " + utilisateurId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            System.out.println("Error fetching notifications for utilisateur ID " + utilisateurId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/unread/{utilisateurId}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE','CHEF_PROJET')")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotificationsByUtilisateurId(@PathVariable Integer utilisateurId) {
        try {
            List<NotificationResponse> notifications = notificationService.getUnreadNotificationsByUtilisateurId(utilisateurId);
            return notifications.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(null)
                    : ResponseEntity.ok(notifications);
        } catch (IllegalArgumentException e) {
            System.out.println("Error fetching unread notifications for utilisateur ID " + utilisateurId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            System.out.println("Error fetching unread notifications for utilisateur ID " + utilisateurId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/read/{id}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE','CHEF_PROJET')")
    public ResponseEntity<String> markNotificationAsRead(@PathVariable Integer id) {
        try {
            notificationService.markNotificationAsRead(id);
            return ResponseEntity.ok("Notification marked as read");
        } catch (IllegalArgumentException e) {
            System.out.println("Error marking notification ID " + id + " as read: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("Error marking notification ID " + id + " as read: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }
}