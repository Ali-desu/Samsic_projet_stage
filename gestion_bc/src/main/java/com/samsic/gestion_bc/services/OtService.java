package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.requests.OtRequest;
import com.samsic.gestion_bc.dto.responses.OtMetricsResponse;
import com.samsic.gestion_bc.models.*;
import com.samsic.gestion_bc.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class OtService {
    private static final Logger logger = LoggerFactory.getLogger(OtService.class);
    private final OtRepository otRepository;
    private final ServiceRepository serviceRepository;
    private final ZoneRepository zoneRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final OtPrestationRepository otPrestationRepository;
    private final NotificationService notificationService;
    private final SiteRepository siteRepository;
    private final BonDeCommandeRepository bonDeCommandeRepository;

    @Autowired
    public OtService(
            OtRepository otRepository,
            ServiceRepository serviceRepository,
            ZoneRepository zoneRepository,
            BackOfficeRepository backOfficeRepository,
            CoordinateurRepository coordinateurRepository,
            OtPrestationRepository otPrestationRepository,
            NotificationService notificationService,
            SiteRepository siteRepository,
            BonDeCommandeRepository bonDeCommandeRepository) {
        this.otRepository = otRepository;
        this.serviceRepository = serviceRepository;
        this.zoneRepository = zoneRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.otPrestationRepository = otPrestationRepository;
        this.notificationService = notificationService;
        this.siteRepository = siteRepository;
        this.bonDeCommandeRepository = bonDeCommandeRepository;
    }

    public List<Ot> getOtsByEmail(String email) {
        Optional<BackOffice> b = backOfficeRepository.findByUserEmail(email);
        Optional<Coordinateur> c = coordinateurRepository.findByUserEmail(email);
        if (c.isPresent()) {
            return otRepository.findByZone(c.get().getZone());
        }
        if (b.isPresent()) {
            return otRepository.findAllByBackOffice(b.get());
        }
        return new ArrayList<>();
    }

    @Transactional
    public Ot createOt(OtRequest request) {
        // Validate required fields
        if (request.getNumOt() == null || request.getNumOt().isEmpty()) {
            throw new IllegalArgumentException("numOt is required");
        }
        if (request.getPrestations() == null || request.getPrestations().isEmpty()) {
            throw new IllegalArgumentException("At least one prestation is required");
        }
        if (request.getZoneId() != null && !zoneRepository.existsById(request.getZoneId())) {
            throw new IllegalArgumentException("Invalid zoneId: " + request.getZoneId());
        }
        if (request.getBackOfficeId() != null && !backOfficeRepository.existsById(request.getBackOfficeId())) {
            throw new IllegalArgumentException("Invalid backOfficeId: " + request.getBackOfficeId());
        }

        Zone zone = null;
        if (request.getZoneId() != null) {
            zone = zoneRepository.findById(request.getZoneId()).orElse(null);
        }

        BackOffice b = null;
        if (request.getBackOfficeId() != null) {
            b = backOfficeRepository.findById(request.getBackOfficeId()).orElse(null);
        }

        Site site = siteRepository.findByCodesite(request.getCodeSite());

        // Create Ot entity
        Ot ot = Ot.builder()
                .numOt(request.getNumOt())
                .divisionProjet(request.getDivisionProjet())
                .codeProjet(request.getCodeProjet())
                .zone(zone)
                .dateGo(request.getDateGo())
                .codeSite(site)
                .backOffice(b)
                .prestations(new ArrayList<>())
                .build();

        // Create OtPrestation entities
        for (OtRequest.OtPrestationRequest prestationRequest : request.getPrestations()) {
            // Validate serviceId
            if (prestationRequest.getServiceId() == null || !serviceRepository.existsById(prestationRequest.getServiceId())) {
                throw new IllegalArgumentException("Invalid serviceId: " + prestationRequest.getServiceId());
            }

            // Validate coordinateurId
            if (prestationRequest.getCoordinateurId() != null && !coordinateurRepository.existsById(prestationRequest.getCoordinateurId())) {
                throw new IllegalArgumentException("Invalid coordinateurId: " + prestationRequest.getCoordinateurId());
            }

            ServiceQ s = serviceRepository.findById(prestationRequest.getServiceId()).orElse(null);

            OtPrestation prestation = OtPrestation.builder()
                    .numLigne(prestationRequest.getNumLigne())
                    .quantiteValide(prestationRequest.getQuantiteValide())
                    .qteRealise(prestationRequest.getQteRealise() != null ? prestationRequest.getQteRealise() : 0)
                    .service(s)
                    .famille(prestationRequest.getFamille())
                    .remarque(prestationRequest.getRemarque() != null ? prestationRequest.getRemarque() : "")
                    .coordinateur(prestationRequest.getCoordinateurId() != null ? coordinateurRepository.findById(prestationRequest.getCoordinateurId()).orElse(null) : null)
                    .fournisseur(prestationRequest.getFournisseur())
                    .datePlanifiee(prestationRequest.getDatePlanifiee())
                    .dateDebut(prestationRequest.getDateDebut())
                    .dateFin(prestationRequest.getDateFin())
                    .dateRealisation(prestationRequest.getDateRealisation())
                    .statutDeRealisation(prestationRequest.getStatutDeRealisation() != null ? prestationRequest.getStatutDeRealisation() : "PENDING")
                    .dateRecepTech(prestationRequest.getDateRecepTech())
                    .statutDeRecepTech(prestationRequest.getStatutDeRecepTech() != null ? prestationRequest.getStatutDeRecepTech() : "PENDING")
                    .datePf(prestationRequest.getDatePf())
                    .dateRecepSys(prestationRequest.getDateRecepSys())
                    .statutReceptionSystem(prestationRequest.getStatutReceptionSystem() != null ? prestationRequest.getStatutReceptionSystem() : "PENDING")
                    .delaiRecep(prestationRequest.getDelaiRecep() != null ? prestationRequest.getDelaiRecep() : 0)
                    .ot(ot)
                    .build();

            ot.getPrestations().add(prestation);
        }

        // Save Ot
        Ot savedOt = otRepository.save(ot);
        logger.info("OT created successfully: {}", savedOt.getNumOt());

        // Send notifications
        try {
            // Notify coordinator of the zone
            if (zone != null) {
                Optional<Coordinateur> coordinateurOpt = coordinateurRepository.findByZone(zone);
                if (coordinateurOpt.isPresent() && coordinateurOpt.get().getUser() != null) {
                    Integer coordinatorId = coordinateurOpt.get().getUser().getId();
                    String zoneName = zone.getNom() != null ? zone.getNom() : "Zone " + zone.getId();
                    String message = String.format("New OT created: %s for zone %s", savedOt.getNumOt(), zoneName);
                    notificationService.createNotification(coordinatorId, message);
                    logger.info("Notification sent to coordinator ID {} for OT: {}", coordinatorId, savedOt.getNumOt());
                } else {
                    logger.warn("No coordinator found for zone ID: {} for OT: {}", request.getZoneId(), savedOt.getNumOt());
                }
            } else {
                logger.warn("No zone assigned for OT: {}", savedOt.getNumOt());
            }

            // Notify back office
            if (b != null && b.getUser() != null) {
                Integer backOfficeId = b.getUser().getId();
                String message = String.format("You created OT: %s", savedOt.getNumOt());
                notificationService.createNotification(backOfficeId, message);
                logger.info("Notification sent to back office ID {} for OT: {}", backOfficeId, savedOt.getNumOt());
            } else {
                logger.warn("No back office user found for backOfficeId: {} for OT: {}", request.getBackOfficeId(), savedOt.getNumOt());
            }
        } catch (Exception e) {
            logger.error("Failed to send notifications for OT: {}. Error: {}", savedOt.getNumOt(), e.getMessage());
        }

        return savedOt;
    }

    @Transactional
    public Ot updateOt(String numOt, OtRequest request) {
        // Validate input
        if (numOt == null || numOt.isEmpty()) {
            throw new IllegalArgumentException("numOt is required");
        }
        if (request.getPrestations() == null || request.getPrestations().isEmpty()) {
            throw new IllegalArgumentException("At least one prestation is required");
        }

        // Fetch existing OT
        Optional<Ot> otOptional = otRepository.findById(numOt);
        if (otOptional.isEmpty()) {
            throw new IllegalArgumentException("OT not found: " + numOt);
        }
        Ot ot = otOptional.get();

        // Update OT fields if provided
        if (request.getDivisionProjet() != null) {
            ot.setDivisionProjet(request.getDivisionProjet());
        }
        if (request.getCodeProjet() != null) {
            ot.setCodeProjet(request.getCodeProjet());
        }
        if (request.getZoneId() != null) {
            if (!zoneRepository.existsById(request.getZoneId())) {
                throw new IllegalArgumentException("Invalid zoneId: " + request.getZoneId());
            }
            ot.setZone(zoneRepository.findById(request.getZoneId()).orElse(null));
        }
        if (request.getDateGo() != null) {
            ot.setDateGo(request.getDateGo());
        }
        if (request.getCodeSite() != null) {
            Site site = siteRepository.findByCodesite(request.getCodeSite());
            if (site == null) {
                throw new IllegalArgumentException("Invalid codeSite: " + request.getCodeSite());
            }
            ot.setCodeSite(site);
        }
        if (request.getBackOfficeId() != null) {
            if (!backOfficeRepository.existsById(request.getBackOfficeId())) {
                throw new IllegalArgumentException("Invalid backOfficeId: " + request.getBackOfficeId());
            }
            ot.setBackOffice(backOfficeRepository.findById(request.getBackOfficeId()).orElse(null));
        }

        // Update or create OtPrestation entities
        List<OtPrestation> updatedPrestations = new ArrayList<>();
        for (OtRequest.OtPrestationRequest prestationRequest : request.getPrestations()) {
            OtPrestation prestation;
            if (prestationRequest.getId() != null) {
                // Update existing prestation
                prestation = otPrestationRepository.findById(prestationRequest.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Invalid prestationId: " + prestationRequest.getId()));
            } else {
                // Create new prestation
                prestation = new OtPrestation();
                prestation.setOt(ot);
            }

            if (prestationRequest.getServiceId() != null) {
                if (!serviceRepository.existsById(prestationRequest.getServiceId())) {
                    throw new IllegalArgumentException("Invalid serviceId: " + prestationRequest.getServiceId());
                }
                prestation.setService(serviceRepository.findById(prestationRequest.getServiceId()).orElse(null));
            }
            if (prestationRequest.getCoordinateurId() != null) {
                if (!coordinateurRepository.existsById(prestationRequest.getCoordinateurId())) {
                    throw new IllegalArgumentException("Invalid coordinateurId: " + prestationRequest.getCoordinateurId());
                }
                prestation.setCoordinateur(coordinateurRepository.findById(prestationRequest.getCoordinateurId()).orElse(null));
            }

            if (prestationRequest.getNumLigne() != null) prestation.setNumLigne(prestationRequest.getNumLigne());
            if (prestationRequest.getQuantiteValide() != null) prestation.setQuantiteValide(prestationRequest.getQuantiteValide());
            if (prestationRequest.getQteRealise() != null) prestation.setQteRealise(prestationRequest.getQteRealise());
            if (prestationRequest.getFamille() != null) prestation.setFamille(prestationRequest.getFamille());
            if (prestationRequest.getFournisseur() != null) prestation.setFournisseur(prestationRequest.getFournisseur());
            if (prestationRequest.getDatePlanifiee() != null) prestation.setDatePlanifiee(prestationRequest.getDatePlanifiee());
            if (prestationRequest.getDateDebut() != null) prestation.setDateDebut(prestationRequest.getDateDebut());
            if (prestationRequest.getDateFin() != null) prestation.setDateFin(prestationRequest.getDateFin());
            if (prestationRequest.getDateRealisation() != null) prestation.setDateRealisation(prestationRequest.getDateRealisation());
            if (prestationRequest.getStatutDeRealisation() != null) prestation.setStatutDeRealisation(prestationRequest.getStatutDeRealisation());
            if (prestationRequest.getDateRecepTech() != null) prestation.setDateRecepTech(prestationRequest.getDateRecepTech());
            if (prestationRequest.getStatutDeRecepTech() != null) prestation.setStatutDeRecepTech(prestationRequest.getStatutDeRecepTech());
            if (prestationRequest.getDatePf() != null) prestation.setDatePf(prestationRequest.getDatePf());
            if (prestationRequest.getDateRecepSys() != null) prestation.setDateRecepSys(prestationRequest.getDateRecepSys());
            if (prestationRequest.getStatutReceptionSystem() != null) prestation.setStatutReceptionSystem(prestationRequest.getStatutReceptionSystem());
            if (prestationRequest.getRemarque() != null) prestation.setRemarque(prestationRequest.getRemarque());
            if (prestationRequest.getDelaiRecep() != null) prestation.setDelaiRecep(prestationRequest.getDelaiRecep());

            updatedPrestations.add(prestation);
        }

        // Update prestations list (remove old, add updated)
        ot.getPrestations().clear();
        ot.getPrestations().addAll(updatedPrestations);

        // Save updated OT
        Ot savedOt = otRepository.save(ot);
        logger.info("OT updated successfully: {}", savedOt.getNumOt());

        // Send notifications
        try {
            if (ot.getZone() != null) {
                Optional<Coordinateur> coordinateurOpt = coordinateurRepository.findByZone(ot.getZone());
                if (coordinateurOpt.isPresent() && coordinateurOpt.get().getUser() != null) {
                    Integer coordinatorId = coordinateurOpt.get().getUser().getId();
                    String zoneName = ot.getZone().getNom() != null ? ot.getZone().getNom() : "Zone " + ot.getZone().getId();
                    String message = String.format("OT updated: %s for zone %s", savedOt.getNumOt(), zoneName);
                    notificationService.createNotification(coordinatorId, message);
                    logger.info("Notification sent to coordinator ID {} for OT: {}", coordinatorId, savedOt.getNumOt());
                }
            }
            if (ot.getBackOffice() != null && ot.getBackOffice().getUser() != null) {
                Integer backOfficeId = ot.getBackOffice().getUser().getId();
                String message = String.format("You updated OT: %s", savedOt.getNumOt());
                notificationService.createNotification(backOfficeId, message);
                logger.info("Notification sent to back office ID {} for OT: {}", backOfficeId, savedOt.getNumOt());
            }
        } catch (Exception e) {
            logger.error("Failed to send notifications for OT: {}. Error: {}", savedOt.getNumOt(), e.getMessage());
        }

        return savedOt;
    }

    @Transactional
    public List<Ot> updateOtsBulk(List<OtRequest> requests) {
        logger.info("Updating {} OTs in bulk", requests.size());
        List<Ot> updatedOts = new ArrayList<>();

        for (OtRequest request : requests) {
            String numOt = request.getNumOt();
            if (numOt == null || numOt.isEmpty()) {
                logger.warn("Skipping OT update with null numOt");
                continue;
            }
            try {
                Ot updatedOt = updateOt(numOt, request);
                updatedOts.add(updatedOt);
            } catch (IllegalArgumentException e) {
                logger.error("Error updating OT {}: {}", numOt, e.getMessage());
                // Continue with next, or throw to rollback all
            }
        }

        logger.info("Bulk update completed, updated {} OTs", updatedOts.size());
        return updatedOts;
    }

    public Ot getOtByNum(String num) {
        return otRepository.findById(num).orElse(null);
    }

    public List<Ot> getAllOts() {
        return otRepository.findAll();
    }

    @Transactional(readOnly = true)
    public OtMetricsResponse getOtMetrics(String email) {
        logger.info("Fetching OT metrics for email: {}", email);
        Optional<BackOffice> backOfficeOpt = backOfficeRepository.findByUserEmail(email);
        if (backOfficeOpt.isEmpty()) {
            logger.warn("No BackOffice found for email: {}", email);
            throw new IllegalArgumentException("No BackOffice found for email: " + email);
        }
        return new OtMetricsResponse(
                otPrestationRepository.getTotalOtPrestationCostByEmail(email),
                otPrestationRepository.getRealisedOtPrestationCostByEmail(email),
                otPrestationRepository.getReceptionneOtPrestationCostByEmail(email)
        );
    }

    @Transactional
    public void linkOtToBdc(String numOt, String numBc) {
        logger.info("Starting OT to BDC linking: numOt={}, numBc={}", numOt, numBc);

        // Validate inputs
        if (numOt == null || numOt.isEmpty()) {
            throw new IllegalArgumentException("numOt is required");
        }
        if (numBc == null || numBc.isEmpty()) {
            throw new IllegalArgumentException("numBc is required");
        }

        // Fetch OT and BDC
        Optional<Ot> otOptional = otRepository.findById(numOt);
        if (otOptional.isEmpty()) {
            throw new IllegalArgumentException("OT not found: " + numOt);
        }
        Ot ot = otOptional.get();

        Optional<BonDeCommande> bdcOptional = bonDeCommandeRepository.findById(numBc);
        if (bdcOptional.isEmpty()) {
            throw new IllegalArgumentException("BonDeCommande not found: " + numBc);
        }
        BonDeCommande bdc = bdcOptional.get();

        // Validate compatibility (e.g., matching codeProjet)
        if (!ot.getCodeProjet().equals(bdc.getCodeProjet())) {
            throw new IllegalArgumentException("OT and BDC have different codeProjet values");
        }

        // Link OT to BDC
        bdc.setNumOt(numOt);
        if (bdc.getDivisionProjet() == null && ot.getDivisionProjet() != null) {
            bdc.setDivisionProjet(ot.getDivisionProjet());
        }

        // Process each OtPrestation
        for (OtPrestation otPrestation : ot.getPrestations()) {
            // Find matching Prestation in BDC by ServiceQ
            Prestation matchingPrestation = null;
            for (Prestation prestation : bdc.getPrestations()) {
                if (prestation.getService() != null && otPrestation.getService() != null &&
                        prestation.getService().getId().equals(otPrestation.getService().getId())) {
                    matchingPrestation = prestation;
                    break;
                }
            }

            // Throw error if no matching Prestation found
            if (matchingPrestation == null) {
                throw new IllegalArgumentException("No matching Prestation found for OtPrestation with Service ID: " +
                        (otPrestation.getService() != null ? otPrestation.getService().getId() : "null"));
            }

            // Create SuiviPrestation from OtPrestation
            SuiviPrestation suivi = SuiviPrestation.builder()
                    .prestation(matchingPrestation)
                    .coordinateur(otPrestation.getCoordinateur())
                    .zone(ot.getZone())
                    .fichierReceptionTech(otPrestation.getFichierReceptionTech())
                    .qteRealise(otPrestation.getQteRealise())
                    .fournisseur(otPrestation.getFournisseur())
                    .datePlanifiee(otPrestation.getDatePlanifiee())
                    .dateGo(otPrestation.getDateGo())
                    .dateDebut(otPrestation.getDateDebut())
                    .dateFin(otPrestation.getDateFin())
                    .dateRealisation(otPrestation.getDateRealisation())
                    .statutDeRealisation(otPrestation.getStatutDeRealisation())
                    .dateRecepTech(otPrestation.getDateRecepTech())
                    .statutDeRecepTech(otPrestation.getStatutDeRecepTech())
                    .datePf(otPrestation.getDatePf())
                    .dateRecepSys(otPrestation.getDateRecepSys())
                    .statutReceptionSystem(otPrestation.getStatutReceptionSystem())
                    .remarque(otPrestation.getRemarque())
                    .delaiRecep(otPrestation.getDelaiRecep())
                    .sentNotifications(new ArrayList<>())
                    .build();



            matchingPrestation.getSuivi().add(suivi);
        }

        // Save changes (cascades to Prestations and SuiviPrestations)
        bonDeCommandeRepository.save(bdc);
        logger.info("Successfully linked OT {} to BDC {}", numOt, numBc);

        // Delete OT
        otRepository.delete(ot);
        logger.info("Deleted OT {} after linking to BDC {}", numOt, numBc);

        // Send notifications
        try {
            if (bdc.getBackOffice() != null && bdc.getBackOffice().getUser() != null) {
                Integer backOfficeId = bdc.getBackOffice().getUser().getId();
                String message = String.format("OT %s linked to BDC %s and deleted", numOt, numBc);
                notificationService.createNotification(backOfficeId, message);
                logger.info("Notification sent to back office ID {} for OT-BDC link: {}-{}", backOfficeId, numOt, numBc);
            }
            if (ot.getZone() != null) {
                Optional<Coordinateur> coordinateurOpt = coordinateurRepository.findByZone(ot.getZone());
                if (coordinateurOpt.isPresent() && coordinateurOpt.get().getUser() != null) {
                    Integer coordinatorId = coordinateurOpt.get().getUser().getId();
                    String zoneName = ot.getZone().getNom() != null ? ot.getZone().getNom() : "Zone " + ot.getZone().getId();
                    String message = String.format("OT %s linked to BDC %s and deleted for zone %s", numOt, numBc, zoneName);
                    notificationService.createNotification(coordinatorId, message);
                    logger.info("Notification sent to coordinator ID {} for OT-BDC link: {}-{}", coordinatorId, numOt, numBc);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to send notifications for OT-BDC link: {}-{}, Error: {}", numOt, numBc, e.getMessage());
        }
    }
    // Helper method to generate a unique Prestation ID
    private String generatePrestationId(BonDeCommande bdc, OtPrestation otPrestation) {
        // Example: Combine numBc and a counter or OtPrestation ID
        return bdc.getNumBc() + "-P" + System.currentTimeMillis(); // Adjust as needed
    }
}