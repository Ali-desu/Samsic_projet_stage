package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.*;
import com.samsic.gestion_bc.models.*;
import com.samsic.gestion_bc.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SuiviPrestationService {
    private static final Logger logger = LoggerFactory.getLogger(SuiviPrestationService.class);

    private final SuiviPrestationRepository suiviPrestationRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final BonDeCommandeRepository bonDeCommandeRepository;
    private final FileRepository fileRepository;
    private final ZoneRepository zoneRepository;
    private final PrestationRepository prestationRepository;
    private final NotificationService notificationService;
    private final SiteRepository siteRepository;

    @Autowired
    public SuiviPrestationService(
            SuiviPrestationRepository suiviPrestationRepository,
            CoordinateurRepository coordinateurRepository,
            BackOfficeRepository backOfficeRepository,
            BonDeCommandeRepository bonDeCommandeRepository,
            FileRepository fileRepository,
            ServiceRepository serviceRepository,
            ZoneRepository zoneRepository,
            PrestationRepository prestationRepository,
            NotificationService notificationService, SiteRepository siteRepository) {
        this.suiviPrestationRepository = suiviPrestationRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.bonDeCommandeRepository = bonDeCommandeRepository;
        this.fileRepository = fileRepository;
        this.zoneRepository = zoneRepository;
        this.prestationRepository = prestationRepository;
        this.notificationService = notificationService;
        this.siteRepository = siteRepository;
    }

    public SuiviPrestation getSuiviPrestationEntityById(Integer id) {
        logger.info("Fetching SuiviPrestation entity with ID: {}", id);
        return suiviPrestationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SuiviPrestation not found: " + id));
    }

    public SuiviPrestationResponse getSuiviPrestationById(Integer id) {
        logger.info("Fetching SuiviPrestation with ID: {}", id);
        SuiviPrestation suivi = suiviPrestationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SuiviPrestation not found: " + id));
        return mapToResponse(suivi);
    }

    public List<SuiviPrestationResponse> getAllSuiviPrestations() {
        logger.info("Fetching all SuiviPrestations");
        return suiviPrestationRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SuiviPrestationResponse> getSuiviPrestationsByEmail(String email) {
        logger.info("Fetching SuiviPrestations for coordinator email: {}", email);
        Coordinateur coordinateur = coordinateurRepository.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Coordinator not found for email: " + email));
        return suiviPrestationRepository.findByCoordinateur(coordinateur).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<SuiviPrestationResponse> getSuiviPrestationsByBackOfficeEmail(String email) {
        logger.info("Fetching SuiviPrestations for back-office email: {}", email);
        BackOffice backOffice = backOfficeRepository.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("BackOffice not found for email: " + email));
        List<BonDeCommande> bonDeCommandes = bonDeCommandeRepository.findByBackOffice(backOffice);
        List<String> prestationIds = bonDeCommandes.stream()
                .flatMap(bc -> bc.getPrestations().stream())
                .map(Prestation::getId)
                .collect(Collectors.toList());
        return suiviPrestationRepository.findByPrestationIdIn(prestationIds).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateSuiviPrestation(Integer id, SuiviPrestationResponse request) {
        logger.info("Updating SuiviPrestation with ID: {}", id);
        SuiviPrestation suivi = suiviPrestationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SuiviPrestation not found: " + id));

        // Define editable fields and their setters
        Map<String, Runnable> fieldSetters = new HashMap<>();
        fieldSetters.put("qteRealise", () -> {
            if (request.getQteRealise() != null) suivi.setQteRealise(request.getQteRealise());
        });
        fieldSetters.put("qteEncours", () -> {
            if (request.getQteEncours() != null) suivi.setQteEncours(request.getQteEncours());
        });
        fieldSetters.put("qteTech", () -> {
            if (request.getQteTech() != null) suivi.setQteTech(request.getQteTech());
        });
        fieldSetters.put("qteDepose", () -> {
            if (request.getQteDepose() != null) suivi.setQteDepose(request.getQteDepose());
        });
        fieldSetters.put("qteADepose", () -> {
            if (request.getQteADepose() != null) suivi.setQteADepose(request.getQteADepose());
        });
        fieldSetters.put("qteSys", () -> {
            if (request.getQteSys() != null) suivi.setQteSys(request.getQteSys());
        });
        fieldSetters.put("fournisseur", () -> {
            if (request.getFournisseur() != null) suivi.setFournisseur(request.getFournisseur());
        });
        fieldSetters.put("datePlanifiee", () -> {
            if (request.getDatePlanifiee() != null) suivi.setDatePlanifiee(request.getDatePlanifiee());
        });
        fieldSetters.put("dateGo", () -> {
            if (request.getDateGo() != null) suivi.setDateGo(request.getDateGo());
        });
        fieldSetters.put("dateDebut", () -> {
            if (request.getDateDebut() != null) suivi.setDateDebut(request.getDateDebut());
        });
        fieldSetters.put("dateFin", () -> {
            if (request.getDateFin() != null) suivi.setDateFin(request.getDateFin());
        });
        fieldSetters.put("dateRealisation", () -> {
            if (request.getDateRealisation() != null) suivi.setDateRealisation(request.getDateRealisation());
        });
        fieldSetters.put("dateRecepTech", () -> {
            if (request.getDateRecepTech() != null) suivi.setDateRecepTech(request.getDateRecepTech());
        });
        fieldSetters.put("datePf", () -> {
            if (request.getDatePf() != null) suivi.setDatePf(request.getDatePf());
        });
        fieldSetters.put("remarque", () -> {
            if (request.getRemarque() != null) suivi.setRemarque(request.getRemarque());
        });
        fieldSetters.put("delaiRecep", () -> {
            if (request.getDelaiRecep() != null) suivi.setDelaiRecep(request.getDelaiRecep());
        });
        fieldSetters.put("statutDeRealisation", () -> {
            if (request.getStatutDeRealisation() != null) suivi.setStatutDeRealisation(request.getStatutDeRealisation());
        });
        fieldSetters.put("statutReceptionTech", () -> {
            if (request.getStatutReceptionTech() != null) suivi.setStatutDeRecepTech(request.getStatutReceptionTech());
        });
        fieldSetters.put("statutReceptionSystem", () -> {
            if (request.getStatutReceptionSystem() != null) suivi.setStatutReceptionSystem(request.getStatutReceptionSystem());
        });

        // Apply updates for allowed fields
        fieldSetters.forEach((field, setter) -> setter.run());

        // Validate fields
        if (suivi.getQteRealise() != null && suivi.getQteRealise() < 0) {
            throw new IllegalArgumentException("Quantity realized cannot be negative");
        }

        suiviPrestationRepository.save(suivi);
        logger.info("SuiviPrestation updated successfully: {}", id);
    }

    @Transactional
    public List<SuiviPrestationResponse> updateSuiviPrestationsBulk(List<SuiviPrestationResponse> requests) {
        logger.info("Updating {} SuiviPrestations in bulk", requests.size());
        List<SuiviPrestationResponse> updatedResponses = new ArrayList<>();

        for (SuiviPrestationResponse request : requests) {
            Integer id = request.getId();
            if (id == null) {
                logger.warn("Skipping SuiviPrestation with null ID");
                continue;
            }
            try {
                SuiviPrestation suivi = suiviPrestationRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("SuiviPrestation not found: " + id));

                // Define editable fields and their setters
                Map<String, Runnable> fieldSetters = new HashMap<>();
                fieldSetters.put("qteRealise", () -> {
                    if (request.getQteRealise() != null) suivi.setQteRealise(request.getQteRealise());
                });
                fieldSetters.put("qteEncours", () -> {
                    if (request.getQteEncours() != null) suivi.setQteEncours(request.getQteEncours());
                });
                fieldSetters.put("qteTech", () -> {
                    if (request.getQteTech() != null) suivi.setQteTech(request.getQteTech());
                });
                fieldSetters.put("qteDepose", () -> {
                    if (request.getQteDepose() != null) suivi.setQteDepose(request.getQteDepose());
                });
                fieldSetters.put("qteADepose", () -> {
                    if (request.getQteADepose() != null) suivi.setQteADepose(request.getQteADepose());
                });
                fieldSetters.put("qteSys", () -> {
                    if (request.getQteSys() != null) suivi.setQteSys(request.getQteSys());
                });
                fieldSetters.put("fournisseur", () -> {
                    if (request.getFournisseur() != null) suivi.setFournisseur(request.getFournisseur());
                });
                fieldSetters.put("datePlanifiee", () -> {
                    if (request.getDatePlanifiee() != null) suivi.setDatePlanifiee(request.getDatePlanifiee());
                });
                fieldSetters.put("dateGo", () -> {
                    if (request.getDateGo() != null) suivi.setDateGo(request.getDateGo());
                });
                fieldSetters.put("dateDebut", () -> {
                    if (request.getDateDebut() != null) suivi.setDateDebut(request.getDateDebut());
                });
                fieldSetters.put("dateFin", () -> {
                    if (request.getDateFin() != null) suivi.setDateFin(request.getDateFin());
                });
                fieldSetters.put("dateRealisation", () -> {
                    if (request.getDateRealisation() != null) suivi.setDateRealisation(request.getDateRealisation());
                });
                fieldSetters.put("dateRecepTech", () -> {
                    if (request.getDateRecepTech() != null) suivi.setDateRecepTech(request.getDateRecepTech());
                });
                fieldSetters.put("datePf", () -> {
                    if (request.getDatePf() != null) suivi.setDatePf(request.getDatePf());
                });
                fieldSetters.put("remarque", () -> {
                    if (request.getRemarque() != null) suivi.setRemarque(request.getRemarque());
                });
                fieldSetters.put("delaiRecep", () -> {
                    if (request.getDelaiRecep() != null) suivi.setDelaiRecep(request.getDelaiRecep());
                });
                fieldSetters.put("statutDeRealisation", () -> {
                    if (request.getStatutDeRealisation() != null) suivi.setStatutDeRealisation(request.getStatutDeRealisation());
                });
                fieldSetters.put("statutReceptionTech", () -> {
                    if (request.getStatutReceptionTech() != null) suivi.setStatutDeRecepTech(request.getStatutReceptionTech());
                });
                fieldSetters.put("statutReceptionSystem", () -> {
                    if (request.getStatutReceptionSystem() != null) suivi.setStatutReceptionSystem(request.getStatutReceptionSystem());
                });

                // Apply updates for allowed fields
                fieldSetters.forEach((field, setter) -> setter.run());

                // Validate fields
                if (suivi.getQteRealise() != null && suivi.getQteRealise() < 0) {
                    throw new IllegalArgumentException("Quantity realized cannot be negative for ID: " + id);
                }

                suiviPrestationRepository.save(suivi);
                updatedResponses.add(mapToResponse(suivi));
                logger.info("SuiviPrestation updated successfully: {}", id);
            } catch (IllegalArgumentException e) {
                logger.error("Error updating SuiviPrestation ID {}: {}", id, e.getMessage());
                throw e;
            }
        }

        logger.info("Bulk update completed, updated {} SuiviPrestations", updatedResponses.size());
        return updatedResponses;
    }

    @Transactional
    public void uploadReceptionTechFile(Integer suiviPrestationId, MultipartFile file, String userEmail) throws IOException {
        logger.info("Uploading reception tech file for SuiviPrestation ID: {} by user: {}", suiviPrestationId, userEmail);
        SuiviPrestation suivi = suiviPrestationRepository.findById(suiviPrestationId)
                .orElseThrow(() -> new IllegalArgumentException("SuiviPrestation not found: " + suiviPrestationId));

        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new IllegalArgumentException("File size exceeds 10MB");
        }
        String[] allowedTypes = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/jpeg", "image/png"};
        if (!Arrays.asList(allowedTypes).contains(file.getContentType())) {
            throw new IllegalArgumentException("Invalid file type: " + file.getContentType());
        }

        // Delete existing file if present
        File existingFile = fileRepository.findBySuiviPrestationId(suiviPrestationId);
        if (existingFile != null) {
            fileRepository.delete(existingFile);
            logger.info("Deleted existing file for SuiviPrestation ID: {}", suiviPrestationId);
        }

        // Save new file
        File newFile = File.builder()
                .name(file.getOriginalFilename())
                .contentType(file.getContentType())
                .content(file.getBytes())
                .suiviPrestation(suivi)
                .build();
        fileRepository.save(newFile);
        suivi.setFichierReceptionTech(newFile);
        suiviPrestationRepository.save(suivi);
        logger.info("Reception tech file uploaded successfully for SuiviPrestation ID: {}", suiviPrestationId);
    }

    @Transactional
    public List<SuiviPrestation> createSuiviPrestation(SuiviPrestationRequest request) {
        logger.info("Creating SuiviPrestation for BonDeCommande: {}", request.getNumBc());

        if (request.getNumBc() == null || request.getNumBc().isEmpty()) {
            throw new IllegalArgumentException("numBc is required");
        }
        if (request.getPrestations() == null || request.getPrestations().isEmpty()) {
            throw new IllegalArgumentException("At least one prestation is required");
        }


        BonDeCommande bonDeCommande = bonDeCommandeRepository.findByNumBc(request.getNumBc())
                .orElseThrow(() -> new IllegalArgumentException("BonDeCommande not found: " + request.getNumBc()));



        List<SuiviPrestation> suivis = request.getPrestations().stream().map(prest -> {
            if (prest.getPrestationId() == null || prest.getPrestationId().isEmpty()) {
                throw new IllegalArgumentException("prestationId is required for prestation");
            }
            if (prest.getServiceId() == null) {
                throw new IllegalArgumentException("serviceId is required for prestation: " + prest.getPrestationId());
            }
            if (prest.getZoneId() == null) {
                throw new IllegalArgumentException("zoneId is required for prestation: " + prest.getPrestationId());
            }

            Site site = siteRepository.findById(prest.getSiteId())
                    .orElseThrow(() -> new IllegalArgumentException("Site not found: " + prest.getSiteId()));

            Prestation prestation = prestationRepository.findById(prest.getPrestationId())
                    .orElseThrow(() -> new IllegalArgumentException("Prestation not found: " + prest.getPrestationId()));
            Zone zone = zoneRepository.findById(prest.getZoneId())
                    .orElseThrow(() -> new IllegalArgumentException("Zone not found: " + prest.getZoneId()));

            // Validate that prestation.service.id matches the provided serviceId
            if (prestation.getService() == null || !Objects.equals(prestation.getService().getId(), prest.getServiceId())) {
                throw new IllegalArgumentException(
                        "serviceId " + prest.getServiceId() + " does not match prestation's service: " + prest.getPrestationId()
                );
            }


            SuiviPrestation suivi = new SuiviPrestation();
            suivi.setPrestation(prestation);
            suivi.setZone(zone);
            suivi.setCodesite(site);
            suivi.setRemarque(prest.getRemarque());
            suivi.setQuantiteValide(prest.getQuantiteValide());
            suivi.setFournisseur(prest.getFournisseur());
            // Set other fields to null or default as per schema
            return suivi;
        }).collect(Collectors.toList());

        List<SuiviPrestation> savedSuivis = suiviPrestationRepository.saveAll(suivis);
        logger.info("SuiviPrestations created successfully for BC: {}", request.getNumBc());

        // Send notifications
        try {
            // Notify coordinator of the zone for each SuiviPrestation
            for (SuiviPrestation suivi : savedSuivis) {
                Zone zone = suivi.getZone();
                Optional<Coordinateur> coordinateurOpt = coordinateurRepository.findByZone(zone);
                if (coordinateurOpt.isPresent() && coordinateurOpt.get().getUser() != null) {
                    Integer coordinatorId = coordinateurOpt.get().getUser().getId();
                    String zoneName = zone.getNom() != null ? zone.getNom() : "Zone " + zone.getId();
                    String message = String.format(
                            "New SuiviPrestation created for BC: %s, Prestation: %s in zone %s",
                            request.getNumBc(), suivi.getPrestation().getId(), zoneName
                    );
                    notificationService.createNotification(coordinatorId, message);
                    logger.info("Notification sent to coordinator ID {} for SuiviPrestation ID: {}", coordinatorId, suivi.getId());
                } else {
                    logger.warn("No coordinator found for zone ID: {} for SuiviPrestation ID: {}", zone.getId(), suivi.getId());
                }
            }

            // Notify back office
            if (bonDeCommande.getBackOffice() != null && bonDeCommande.getBackOffice().getUser() != null) {
                Integer backOfficeId = bonDeCommande.getBackOffice().getUser().getId();
                String message = String.format("You created SuiviPrestation for BC: %s", request.getNumBc());
                notificationService.createNotification(backOfficeId, message);
                logger.info("Notification sent to back office ID {} for BC: {}", backOfficeId, request.getNumBc());
            } else {
                logger.warn("No back office user found for BC: {}", request.getNumBc());
            }
        } catch (Exception e) {
            logger.error("Failed to send notifications for BC: {}. Error: {}", request.getNumBc(), e.getMessage());
        }

        return savedSuivis;
    }

    private SuiviPrestationResponse mapToResponse(SuiviPrestation suivi) {
        SuiviPrestationResponse response = new SuiviPrestationResponse();
        response.setId(suivi.getId());

        if (suivi.getPrestation() != null) {
            PrestationResponse prestation = getPrestationResponse(suivi);
            response.setPrestation(prestation);
            response.setBc_num(suivi.getPrestation().getBonDeCommande().getNumBc());
            response.setSite(suivi.getCodesite() != null ? suivi.getCodesite().getCodesite() : "null" );
            response.setDateEdition(suivi.getPrestation().getBonDeCommande().getDateEdition());
        }

        response.setCoordinateurId(suivi.getCoordinateur() != null ? suivi.getCoordinateur().getId() : null);

        if (suivi.getZone() != null) {
            ZoneResponse zone = new ZoneResponse();
            zone.setId(suivi.getZone().getId());
            zone.setName(suivi.getZone().getNom());
            response.setZone(zone);
        }

        response.setQteRealise(suivi.getQteRealise());
        response.setQteEncours(suivi.getQteEncours());
        response.setQteTech(suivi.getQteTech());
        response.setQteDepose(suivi.getQteDepose());
        response.setStatutReceptionTech(suivi.getStatutDeRecepTech());
        response.setQteADepose(suivi.getQteADepose());
        response.setQteSys(suivi.getQteSys());
        response.setFournisseur(suivi.getFournisseur());
        response.setDatePlanifiee(suivi.getDatePlanifiee());
        response.setDateGo(suivi.getDateGo());
        response.setDateDebut(suivi.getDateDebut());
        response.setDateFin(suivi.getDateFin());
        response.setDateRealisation(suivi.getDateRealisation());
        response.setStatutDeRealisation(suivi.getStatutDeRealisation());
        response.setDateRecepTech(suivi.getDateRecepTech());
        response.setDatePf(suivi.getDatePf());
        response.setOt(suivi.getPrestation().getBonDeCommande().isOt());
        response.setDateRecepSys(suivi.getDateRecepSys());
        response.setStatutReceptionSystem(suivi.getStatutReceptionSystem());
        response.setRemarque(suivi.getRemarque());
        response.setDelaiRecep(suivi.getDelaiRecep());

        if (suivi.getFichierReceptionTech() != null) {
            response.setFichierReceptionTech(new SuiviPrestationResponse.FileResponse(
                    suivi.getFichierReceptionTech().getId(),
                    suivi.getFichierReceptionTech().getName(),
                    suivi.getFichierReceptionTech().getContentType()
            ));
        }

        return response;
    }

    private static PrestationResponse getPrestationResponse(SuiviPrestation suivi) {
        PrestationResponse prestation = new PrestationResponse();
        prestation.setId(suivi.getPrestation().getId());
        prestation.setNumLigne(suivi.getPrestation().getNumLigne());
        prestation.setDescription(suivi.getPrestation().getDescription());
        prestation.setQteBc(suivi.getPrestation().getQteBc());
        prestation.setFamille(suivi.getPrestation().getService().getFamille().getName());
        if (suivi.getPrestation().getService() != null) {
            ServiceResponse service = new ServiceResponse();
            service.setId(suivi.getPrestation().getService().getId());
            service.setNomService(suivi.getPrestation().getService().getDescription());
            service.setPrix(suivi.getPrestation().getService().getPrix());
            prestation.setService(service);
        }
        return prestation;
    }
}