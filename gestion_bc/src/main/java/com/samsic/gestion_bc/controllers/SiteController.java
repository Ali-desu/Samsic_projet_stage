package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.models.Site;
import com.samsic.gestion_bc.services.SiteService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/site")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class SiteController {
    private static final Logger logger = LoggerFactory.getLogger(SiteController.class);
    private final SiteService siteService;

    @Autowired
    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping
    public ResponseEntity<List<Site>> getAllSites() {
        logger.info("Received GET request for /api/site");
        try {
            List<Site> sites = siteService.getAllSites();
            if (sites.isEmpty()) {
                logger.warn("No sites found in the database");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(sites);
            }
            logger.info("Returning {} sites", sites.size());
            return ResponseEntity.ok(sites);
        } catch (Exception e) {
            logger.error("Error retrieving sites: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}