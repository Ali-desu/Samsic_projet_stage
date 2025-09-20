
package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.models.ChefProjet;
import com.samsic.gestion_bc.models.SuiviPrestation;
import com.samsic.gestion_bc.models.SuiviPrestationNotification;
import com.samsic.gestion_bc.repositories.ChefProjetRepository;
import com.samsic.gestion_bc.repositories.SuiviPrestationNotificationRepository;
import com.samsic.gestion_bc.repositories.SuiviPrestationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

@Service
public class SuiviPrestationNotificationScheduler {
    private final SuiviPrestationRepository suiviPrestationRepository;
    private final SuiviPrestationNotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final ChefProjetRepository chefProjetRepository;

    @Autowired
    public SuiviPrestationNotificationScheduler(
            SuiviPrestationRepository suiviPrestationRepository,
            SuiviPrestationNotificationRepository notificationRepository,
            NotificationService notificationService,
            ChefProjetRepository chefProjetRepository) {
        this.suiviPrestationRepository = suiviPrestationRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.chefProjetRepository = chefProjetRepository;    }

    @Scheduled(cron = "0 0 */6 * * * ")
    @Transactional
    public void checkSuiviPrestationDelays() {
        System.out.println("Running SuiviPrestation delay check at " + LocalDateTime.now());
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneWeekAgo = now.minusDays(7);

        // Find SuiviPrestations realized but not technically received
        List<SuiviPrestation> realizedPrestations = suiviPrestationRepository
                .findByDateRealisationNotNullAndDateRecepTechIsNull();
        System.out.println("Found " + realizedPrestations.size() + " realized but not technically received prestations");
        for (SuiviPrestation suivi : realizedPrestations) {
            if (suivi.getDateRealisation() == null) {
                System.out.println("Skipping SuiviPrestation ID " + suivi.getId() + ": dateRealisation is null");
                continue;
            }
            LocalDateTime realisationDate = suivi.getDateRealisation()
                    .toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            if (realisationDate.isBefore(oneWeekAgo) &&
                    notificationRepository.findBySuiviPrestationAndNotificationType(suivi, "realisation_delay").isEmpty()) {
                System.out.println("Processing realisation delay for SuiviPrestation ID " + suivi.getId());
                // Notify coordinator
                if (suivi.getCoordinateur() != null && suivi.getCoordinateur().getUser() != null) {
                    Integer coordUtilisateurId = suivi.getCoordinateur().getUser().getId();
                    String message = String.format("SuiviPrestation ID %d (Prestation %s) realized over a week ago but not technically received",
                            suivi.getId(), suivi.getPrestation() != null ? suivi.getPrestation().getId() : "null");
                    System.out.println("Notifying coordinator ID " + coordUtilisateurId + ": " + message);
                    notificationService.createNotification(coordUtilisateurId, message);
                } else {
                    System.out.println("No coordinator or user for SuiviPrestation ID " + suivi.getId());
                }
                // Notify back-office
                if (suivi.getPrestation() != null &&
                        suivi.getPrestation().getBonDeCommande() != null &&
                        suivi.getPrestation().getBonDeCommande().getBackOffice() != null &&
                        suivi.getPrestation().getBonDeCommande().getBackOffice().getUser() != null) {
                    Integer boUtilisateurId = suivi.getPrestation().getBonDeCommande().getBackOffice().getUser().getId();
                    String message = String.format("SuiviPrestation ID %d (Prestation %s) realized over a week ago but not technically received",
                            suivi.getId(), suivi.getPrestation().getId());
                    System.out.println("Notifying back-office ID " + boUtilisateurId + ": " + message);
                    notificationService.createNotification(boUtilisateurId, message);
                } else {
                    System.out.println("No back-office or user for SuiviPrestation ID " + suivi.getId());
                }
                // Save notification record
                SuiviPrestationNotification notification = SuiviPrestationNotification.builder()
                        .suiviPrestation(suivi)
                        .notificationType("realisation_delay")
                        .build();
                notificationRepository.save(notification);
                suivi.getSentNotifications().add(notification);
                suiviPrestationRepository.save(suivi);
                System.out.println("Marked realisation_delay for SuiviPrestation ID " + suivi.getId());
            }
        }

        // Find SuiviPrestations technically received but not system received
        List<SuiviPrestation> techReceivedPrestations = suiviPrestationRepository
                .findByDateRecepTechNotNullAndDateRecepSysIsNull();
        System.out.println("Found " + techReceivedPrestations.size() + " technically received but not system received prestations");
        for (SuiviPrestation suivi : techReceivedPrestations) {
            if (suivi.getDateRecepTech() == null) {
                System.out.println("Skipping SuiviPrestation ID " + suivi.getId() + ": dateRecepTech is null");
                continue;
            }
            LocalDateTime techReceptionDate = suivi.getDateRecepTech()
                    .toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            if (techReceptionDate.isBefore(oneWeekAgo) &&
                    notificationRepository.findBySuiviPrestationAndNotificationType(suivi, "tech_reception_delay").isEmpty()) {
                System.out.println("Processing tech reception delay for SuiviPrestation ID " + suivi.getId());
                // Notify back-office
                if (suivi.getPrestation() != null &&
                        suivi.getPrestation().getBonDeCommande() != null &&
                        suivi.getPrestation().getBonDeCommande().getBackOffice() != null &&
                        suivi.getPrestation().getBonDeCommande().getBackOffice().getUser() != null) {
                    Integer boUtilisateurId = suivi.getPrestation().getBonDeCommande().getBackOffice().getUser().getId();
                    String message = String.format("SuiviPrestation ID %d (Prestation %s) technically received over a week ago but not system received",
                            suivi.getId(), suivi.getPrestation().getId());
                    System.out.println("Notifying back-office ID " + boUtilisateurId + ": " + message);
                    notificationService.createNotification(boUtilisateurId, message);

                    // Notify all chefs
                    List<ChefProjet> Chefs = this.chefProjetRepository.findAll();
                    for (ChefProjet chef : Chefs) {
                        notificationService.createNotification(chef.getId(), message);
                    }

                } else {
                    System.out.println("No back-office or user for SuiviPrestation ID " + suivi.getId());
                }
                // Save notification record
                SuiviPrestationNotification notification = SuiviPrestationNotification.builder()
                        .suiviPrestation(suivi)
                        .notificationType("tech_reception_delay")
                        .build();
                notificationRepository.save(notification);
                suivi.getSentNotifications().add(notification);
                suiviPrestationRepository.save(suivi);
                System.out.println("Marked tech_reception_delay for SuiviPrestation ID " + suivi.getId());
            }
        }
    }
}