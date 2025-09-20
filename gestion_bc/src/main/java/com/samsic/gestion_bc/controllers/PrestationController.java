package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.BcSummary;
import com.samsic.gestion_bc.dto.Bcdetail;
import com.samsic.gestion_bc.dto.TableauDeBordDTO;
import com.samsic.gestion_bc.models.Prestation;
import com.samsic.gestion_bc.models.Utilisateur;
import com.samsic.gestion_bc.services.PrestationService;
import com.samsic.gestion_bc.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/prestations")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class PrestationController {
    private final PrestationService prestationService;
    private final UserRepository userRepository;

    @Autowired
    public PrestationController(PrestationService prestationService, UserRepository userRepository) {
        this.prestationService = prestationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<List<Prestation>> getAllPrestations(Authentication auth) {
        try {
            System.out.println("Fetching all prestations for user: " + auth.getName());
            List<Prestation> prestations = prestationService.getAllPrestations(auth);
            return ResponseEntity.ok(prestations);
        } catch (Exception e) {
            System.out.println("Error fetching prestations: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/bcDetail")
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<List<Bcdetail>> getReport(Authentication auth) {
        try {
            System.out.println("Fetching report prestation for user: " + auth.getName());
            List<Bcdetail> report = prestationService.getReportPrestation(auth);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            System.out.println("Error fetching report prestation: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/bcDetail/by-backoffice/{email:.+}")
    @PreAuthorize("hasRole('CHEF_PROJET')")
    public ResponseEntity<List<Bcdetail>> getReportByBackoffice(@PathVariable String email) {
        try {
            System.out.println("Fetching report prestation for backoffice email: " + email);
            // Validate that the email belongs to a BACK_OFFICE user
            Optional<Utilisateur> user = userRepository.findByEmail(email);
            if (user.isEmpty() || !user.get().getRole().toString().equals("BACK_OFFICE")) {
                System.out.println("Invalid backoffice email: " + email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            List<Bcdetail> report = prestationService.getReportPrestationByEmail(email);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            System.out.println("Error fetching report prestation for backoffice email " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<Prestation> getPrestationById(@PathVariable String id) {
        try {
            System.out.println("Fetching prestation with ID: " + id);
            Optional<Prestation> prestation = prestationService.getPrestationById(id);
            return prestation.map(ResponseEntity::ok)
                    .orElseGet(() -> {
                        System.out.println("Prestation not found: " + id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
                    });
        } catch (Exception e) {
            System.out.println("Error fetching prestation " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/bon-de-commande/{bcId}")
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<Prestation>> getPrestationsByBonDeCommande(@PathVariable String bcId, Authentication auth) {
        try {
            System.out.println("Fetching prestations for BonDeCommande: " + bcId + " for user: " + auth.getName());
            List<Prestation> prestations = prestationService.getPrestationsByBonDeCommande(bcId);
            return ResponseEntity.ok(prestations);
        } catch (Exception e) {
            System.out.println("Error fetching prestations for BonDeCommande " + bcId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/bon-de-commande/summary")
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<List<BcSummary>> getBcSummaries(Authentication auth) {
        try {
            System.out.println("Fetching bon de commande summaries for user: " + auth.getName());
            List<BcSummary> summaries = prestationService.getBcSummaries(auth);
            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            System.out.println("Error fetching bon de commande summaries: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/bon-de-commande/summary/by-backoffice/{email:.+}")
    @PreAuthorize("hasRole('CHEF_PROJET')")
    public ResponseEntity<List<BcSummary>> getBcSummariesByBackoffice(@PathVariable String email) {
        try {
            System.out.println("Fetching bon de commande summaries for backoffice email: " + email);
            // Validate that the email belongs to a BACK_OFFICE user
            Optional<Utilisateur> user = userRepository.findByEmail(email);
            if (user.isEmpty() || !user.get().getRole().toString().equals("BACK_OFFICE")) {
                System.out.println("Invalid backoffice email: " + email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            List<BcSummary> summaries = prestationService.getBcSummariesByEmail(email);
            return ResponseEntity.ok(summaries);
        } catch (Exception e) {
            System.out.println("Error fetching bon de commande summaries for backoffice email " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/tableau-de-bord")
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<List<TableauDeBordDTO>> getTableauDeBord(Authentication auth) {
        try {
            System.out.println("Fetching tableau de bord for user: " + auth.getName());
            List<TableauDeBordDTO> result = prestationService.getDashboard(auth);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Error fetching tableau de bord: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/tableau-de-bord/by-backoffice/{email:.+}")
    @PreAuthorize("hasRole('CHEF_PROJET')")
    public ResponseEntity<List<TableauDeBordDTO>> getTableauDeBordByBackoffice(@PathVariable String email) {
        try {
            System.out.println("Fetching tableau de bord for backoffice email: " + email);
            // Validate that the email belongs to a BACK_OFFICE user
            Optional<Utilisateur> user = userRepository.findByEmail(email);
            if (user.isEmpty() || !user.get().getRole().toString().equals("BACK_OFFICE")) {
                System.out.println("Invalid backoffice email: " + email);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
            List<TableauDeBordDTO> result = prestationService.getDashboardByBackofficeEmail(email);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Error fetching tableau de bord for backoffice email " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}