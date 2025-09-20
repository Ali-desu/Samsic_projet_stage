package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.SuiviPrestationRequest;
import com.samsic.gestion_bc.dto.SuiviPrestationResponse;
import com.samsic.gestion_bc.models.File;
import com.samsic.gestion_bc.models.SuiviPrestation;
import com.samsic.gestion_bc.services.SuiviPrestationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/suivi-prestations")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class SuiviPrestationController {
    private static final Logger logger = LoggerFactory.getLogger(SuiviPrestationController.class);
    private final SuiviPrestationService suiviPrestationService;

    @Autowired
    public SuiviPrestationController(SuiviPrestationService suiviPrestationService) {
        this.suiviPrestationService = suiviPrestationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<SuiviPrestationResponse>> getAllSuiviPrestations() {
        try {
            logger.info("Fetching all SuiviPrestations");
            List<SuiviPrestationResponse> suiviPrestations = suiviPrestationService.getAllSuiviPrestations();
            return ResponseEntity.ok(suiviPrestations);
        } catch (Exception e) {
            logger.error("Error fetching SuiviPrestations: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/find/{email:.+}")
    @PreAuthorize("hasRole('COORDINATEUR')")
    public ResponseEntity<List<SuiviPrestationResponse>> getSuiviPrestationsByEmail(@PathVariable String email) {
        try {
            logger.info("Fetching SuiviPrestations for coordinator email: {}", email);
            List<SuiviPrestationResponse> suiviPrestations = suiviPrestationService.getSuiviPrestationsByEmail(email);
            return suiviPrestations.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(null)
                    : ResponseEntity.ok(suiviPrestations);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching SuiviPrestations for email {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error fetching SuiviPrestations for email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/back-office/{email:.+}")
    @PreAuthorize("hasRole('BACK_OFFICE')")
    public ResponseEntity<List<SuiviPrestationResponse>> getSuiviPrestationsByBackOfficeEmail(@PathVariable String email) {
        try {
            logger.info("Fetching SuiviPrestations for back-office email: {}", email);
            List<SuiviPrestationResponse> suiviPrestations = suiviPrestationService.getSuiviPrestationsByBackOfficeEmail(email);
            return ResponseEntity.ok(suiviPrestations);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching SuiviPrestations for back-office email {}: {}", email, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error fetching SuiviPrestations for back-office email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COORDINATEUR', 'BACK_OFFICE')")
    public ResponseEntity<SuiviPrestationResponse> updateSuiviPrestation(@PathVariable Integer id, @RequestBody SuiviPrestationResponse request) {
        try {
            logger.info("Updating SuiviPrestation with ID: {}", id);
            suiviPrestationService.updateSuiviPrestation(id, request);
            SuiviPrestationResponse updatedResponse = suiviPrestationService.getSuiviPrestationById(id);
            return ResponseEntity.ok(updatedResponse);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating SuiviPrestation ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error updating SuiviPrestation ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('COORDINATEUR', 'BACK_OFFICE')")
    public ResponseEntity<List<SuiviPrestationResponse>> updateSuiviPrestationsBulk(@RequestBody List<SuiviPrestationResponse> requests) {
        try {
            logger.info("Updating multiple SuiviPrestations, count: {}", requests.size());
            List<SuiviPrestationResponse> updatedResponses = suiviPrestationService.updateSuiviPrestationsBulk(requests);
            return ResponseEntity.ok(updatedResponses);
        } catch (IllegalArgumentException e) {
            logger.error("Error updating SuiviPrestations in bulk: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error updating SuiviPrestations in bulk: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/{id}/reception-tech")
    @PreAuthorize("hasAnyRole('COORDINATEUR', 'BACK_OFFICE')")
    public ResponseEntity<String> uploadReceptionTechFile(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file,
            Authentication auth) {
        try {
            logger.info("Uploading reception tech file for SuiviPrestation ID: {} by user: {}", id, auth.getName());
            suiviPrestationService.uploadReceptionTechFile(id, file, auth.getName());
            return ResponseEntity.ok("File uploaded successfully");
        } catch (IllegalArgumentException e) {
            logger.error("Error uploading file for SuiviPrestation ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (IOException e) {
            logger.error("IO error uploading file for SuiviPrestation ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error uploading file for SuiviPrestation ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Server error");
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<SuiviPrestation>> createSuiviPrestation(@RequestBody SuiviPrestationRequest request) {
        try {
            logger.info("Creating SuiviPrestation for BonDeCommande: {}", request.getNumBc());
            List<SuiviPrestation> suivis = suiviPrestationService.createSuiviPrestation(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(suivis);
        } catch (Exception e) {
            logger.error("Error creating SuiviPrestation: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{id}/reception-tech")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE')")
    public ResponseEntity<byte[]> getReceptionTechFile(@PathVariable Integer id) {
        try {
            logger.info("Fetching reception tech file for SuiviPrestation ID: {}", id);
            SuiviPrestation suivi = suiviPrestationService.getSuiviPrestationEntityById(id);
            File file = suivi.getFichierReceptionTech();
            if (file == null) {
                logger.warn("No file found for SuiviPrestation ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(file.getContentType()));
            headers.setContentDisposition(ContentDisposition.inline().filename(file.getName()).build());
            return new ResponseEntity<>(file.getContent(), headers, HttpStatus.OK);
        } catch (IllegalArgumentException e) {
            logger.error("Error fetching file for SuiviPrestation ID {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("Unexpected error fetching file for SuiviPrestation ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}