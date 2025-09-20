package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.BonDeCommandeRequest;
import com.samsic.gestion_bc.dto.FileRequest;
import com.samsic.gestion_bc.dto.ServiceSummary;
import com.samsic.gestion_bc.models.BonDeCommande;
import com.samsic.gestion_bc.services.BonDeCommandeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bon-de-commande")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class BonDeCommandeController {
    private static final Logger logger = LoggerFactory.getLogger(BonDeCommandeController.class);
    private final BonDeCommandeService bonDeCommandeService;

    public BonDeCommandeController(BonDeCommandeService bonDeCommandeService) {
        this.bonDeCommandeService = bonDeCommandeService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<String> createBonDeCommande(
            @RequestPart("request") BonDeCommandeRequest request,
            @RequestPart(value = "bc_file", required = false) MultipartFile bcFile) {
        logger.info("Received request to create BonDeCommande with numBc: {}", request.getNumBc());
        try {
            if (bcFile != null && !bcFile.isEmpty()) {
                FileRequest fileRequest = FileRequest.builder()
                        .file(bcFile)
                        .fileName(bcFile.getOriginalFilename())
                        .fileType(bcFile.getContentType())
                        .build();
                request.setFileRequest(fileRequest);
                logger.debug("File attached: {}", bcFile.getOriginalFilename());
            }
            BonDeCommande created = bonDeCommandeService.createBonDeCommande(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("BonDeCommande created: " + created.getNumBc());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating BonDeCommande: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create BonDeCommande");
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<BonDeCommande>> getAllBonDeCommandes() {
        logger.info("Fetching all BonDeCommandes");
        try {
            List<BonDeCommande> bonDeCommandes = bonDeCommandeService.getAllBonDeCommandes();
            return ResponseEntity.ok(bonDeCommandes);
        } catch (Exception e) {
            logger.error("Error fetching BonDeCommandes: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // New endpoint to fetch services for a BC
    @GetMapping("/{numBc}/services")
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<ServiceSummary>> getServicesByNumBc(@PathVariable String numBc) {
        try {
            logger.info("Fetching services for BonDeCommande: {}", numBc);
            List<ServiceSummary> services = bonDeCommandeService.getServicesByNumBc(numBc);
            return ResponseEntity.ok(services);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error fetching services for BonDeCommande {}: {}", numBc, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/ot/{isOt}")
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<BonDeCommandeRequest>> getAllByOt(@PathVariable boolean isOt) {
        logger.info("Fetching all Ots");
        try {
            List<BonDeCommandeRequest> bonDeCommandes = bonDeCommandeService.getBcByOtStatut(isOt);
            return ResponseEntity.ok(bonDeCommandes);
        } catch (Exception e) {
            logger.error("Error fetching Ots: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{numBc}")
    @PreAuthorize("hasAnyRole('BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<BonDeCommande> getBonDeCommandeByNumBc(@PathVariable String numBc) {
        logger.info("Fetching BonDeCommande with numBc: {}", numBc);
        try {
            Optional<BonDeCommande> bonDeCommande = bonDeCommandeService.getBonDeCommandeByNumBc(numBc);
            return bonDeCommande.map(ResponseEntity::ok)
                    .orElseGet(() -> {
                        logger.warn("BonDeCommande not found: {}", numBc);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
                    });
        } catch (Exception e) {
            logger.error("Error fetching BonDeCommande: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping(value = "/{numBc}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('BACK_OFFICE')")
    public ResponseEntity<String> updateBonDeCommande(
            @PathVariable String numBc,
            @RequestPart("request") BonDeCommandeRequest request,
            @RequestPart(value = "bc_file", required = false) MultipartFile bcFile) {
        logger.info("Received request to update BonDeCommande with numBc: {}", numBc);
        try {
            if (bcFile != null && !bcFile.isEmpty()) {
                FileRequest fileRequest = FileRequest.builder()
                        .file(bcFile)
                        .fileName(bcFile.getOriginalFilename())
                        .fileType(bcFile.getContentType())
                        .build();
                request.setFileRequest(fileRequest);
                logger.debug("File attached for update: {}", bcFile.getOriginalFilename());
            }
            BonDeCommande updated = bonDeCommandeService.updateBonDeCommande(numBc, request);
            return ResponseEntity.ok("BonDeCommande updated: " + updated.getNumBc());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error updating BonDeCommande: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update BonDeCommande");
        }
    }

    @DeleteMapping("/{numBc}")
    @PreAuthorize("hasRole('BACK_OFFICE')")
    public ResponseEntity<String> deleteBonDeCommande(@PathVariable String numBc) {
        logger.info("Received request to delete BonDeCommande with numBc: {}", numBc);
        try {
            bonDeCommandeService.deleteBonDeCommande(numBc);
            return ResponseEntity.ok("BonDeCommande deleted: " + numBc);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error deleting BonDeCommande: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to delete BonDeCommande");
        }
    }

    @GetMapping("/find/{emailBO:.+}")
    @PreAuthorize("hasRole('BACK_OFFICE')")
    public ResponseEntity<List<BonDeCommande>> getBonDeCommandesByEmailBO(@PathVariable String emailBO) {
        logger.info("Fetching BonDeCommandes for emailBO: {}", emailBO);
        try {
            List<BonDeCommande> bonDeCommandes = bonDeCommandeService.getBonDeCommandesByEmailBO(emailBO);
            return ResponseEntity.ok(bonDeCommandes);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error fetching BonDeCommandes: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}