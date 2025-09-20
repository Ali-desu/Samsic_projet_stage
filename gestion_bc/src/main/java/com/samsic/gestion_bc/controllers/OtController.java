package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.requests.LinkOtToBdcRequest;
import com.samsic.gestion_bc.dto.requests.OtRequest;
import com.samsic.gestion_bc.dto.responses.OtMetricsResponse;
import com.samsic.gestion_bc.models.Ot;
import com.samsic.gestion_bc.services.OtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ots")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class OtController {
    private static final Logger logger = LoggerFactory.getLogger(OtController.class);
    private final OtService otService;

    @Autowired
    public OtController(OtService otService) {
        this.otService = otService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<String> createOt(@RequestBody OtRequest request, Authentication auth) {
        try {
            logger.info("Creating OT with numOt: {} by user: {}", request.getNumOt(), auth.getName());
            Ot ot = otService.createOt(request);
            return ResponseEntity.status(HttpStatus.CREATED).body("OT created: " + ot.getNumOt());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error creating OT: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create OT");
        }
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<Ot>> getAllOts() {
        try {
            logger.info("Fetching all OTs");
            List<Ot> ots = otService.getAllOts();
            return ResponseEntity.ok(ots);
        } catch (Exception e) {
            logger.error("Error fetching all OTs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/find/{numOT}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<Ot> getOt(@PathVariable String numOT) {
        try {
            logger.info("Fetching all OTs");
            Ot ot = otService.getOtByNum(numOT);
            return ResponseEntity.ok(ot);
        } catch (Exception e) {
            logger.error("Error fetching all OTs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{email}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<Ot>> getOtsByEmail(@PathVariable String email) {
        try {
            logger.info("Fetching all OTs by email: {}", email);
            List<Ot> ots = otService.getOtsByEmail(email);
            return ResponseEntity.ok(ots);
        } catch (Exception e) {
            logger.error("Error fetching all OTs: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/metrics/{email}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<OtMetricsResponse> getOtMetrics(@PathVariable String email, Authentication auth) {
        try {
            logger.info("Fetching OT metrics for email: {}", email);
            if (!auth.getName().equals(email) && auth.getAuthorities().stream()
                    .noneMatch(a -> a.getAuthority().equals("ROLE_CHEF_PROJET"))) {
                logger.warn("Unauthorized access attempt by user: {} for email: {}", auth.getName(), email);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
            }
            OtMetricsResponse metrics = otService.getOtMetrics(email);
            return ResponseEntity.ok(metrics);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error fetching OT metrics for email: {}. Error: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/{numOt}")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<Ot> updateOt(@PathVariable String numOt, @RequestBody OtRequest request, Authentication auth) {
        try {
            logger.info("Updating OT with numOt: {} by user: {}", numOt, auth.getName());
            Ot updatedOt = otService.updateOt(numOt, request);
            return ResponseEntity.ok(updatedOt);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error updating OT: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PutMapping("/bulk")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<List<Ot>> updateOtsBulk(@RequestBody List<OtRequest> requests, Authentication auth) {
        try {
            logger.info("Updating {} OTs in bulk by user: {}", requests.size(), auth.getName());
            List<Ot> updatedOts = otService.updateOtsBulk(requests);
            return ResponseEntity.ok(updatedOts);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            logger.error("Error updating OTs in bulk: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/link")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE', 'CHEF_PROJET')")
    public ResponseEntity<String> linkOtToBdc(
            @RequestBody LinkOtToBdcRequest request,
            Authentication auth) {
        try {
            logger.info("Linking OT {} to BDC {} by user: {}", request.getNumOt(), request.getNumBc(), auth.getName());
            otService.linkOtToBdc(request.getNumOt(), request.getNumBc());
            return ResponseEntity.status(HttpStatus.OK).body("OT " + request.getNumOt() + " successfully linked to BDC " + request.getNumBc());
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("Error linking OT {} to BDC {}: {}", request.getNumOt(), request.getNumBc(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to link OT to BDC");
        }
    }
}