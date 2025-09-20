package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.NotificationResponse;
import com.samsic.gestion_bc.models.Notification;
import com.samsic.gestion_bc.models.Utilisateur;
import com.samsic.gestion_bc.repositories.NotificationRepository;
import com.samsic.gestion_bc.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository utilisateurRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository, UserRepository utilisateurRepository) {
        this.notificationRepository = notificationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional
    public void createNotification(Integer utilisateurId, String message) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur not found: " + utilisateurId));
        Notification notification = new Notification();
        notification.setUtilisateur(utilisateur);
        notification.setMessage(message);
        notification.setCreatedAt(new Date());
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getNotificationsByUtilisateurId(Integer utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur not found: " + utilisateurId));
        return notificationRepository.findByUtilisateur(utilisateur).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadNotificationsByUtilisateurId(Integer utilisateurId) {
        Utilisateur utilisateur = utilisateurRepository.findById(utilisateurId)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur not found: " + utilisateurId));
        return notificationRepository.findByUtilisateurAndIsRead(utilisateur, false).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markNotificationAsRead(Integer id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + id));
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setUtilisateurId(notification.getUtilisateur().getId());
        response.setRole(notification.getUtilisateur().getRole());
        response.setMessage(notification.getMessage());
        response.setCreatedAt(notification.getCreatedAt());
        response.setRead(notification.isRead());
        return response;
    }
}