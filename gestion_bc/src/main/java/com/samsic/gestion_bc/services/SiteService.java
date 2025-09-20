package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.models.Site;
import com.samsic.gestion_bc.repositories.SiteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SiteService {
    private static final Logger logger = LoggerFactory.getLogger(SiteService.class);
    private final SiteRepository siteRepository;

    public SiteService(SiteRepository siteRepository) {
        this.siteRepository = siteRepository;
    }

    public List<Site> getAllSites() {
        logger.info("Fetching all sites from repository");
        try {
            List<Site> sites = siteRepository.findAll();
            logger.info("Retrieved {} sites", sites.size());
            return sites;
        } catch (Exception e) {
            logger.error("Error fetching sites: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch sites", e);
        }
    }
}