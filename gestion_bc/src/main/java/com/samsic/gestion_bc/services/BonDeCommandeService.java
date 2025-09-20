package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.BonDeCommandeRequest;
import com.samsic.gestion_bc.dto.PrestationRequest;
import com.samsic.gestion_bc.dto.ServiceSummary;
import com.samsic.gestion_bc.models.*;
import com.samsic.gestion_bc.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class BonDeCommandeService {
    private static final Logger logger = LoggerFactory.getLogger(BonDeCommandeService.class);
    private static final String ALPHA_NUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final java.security.SecureRandom RANDOM = new java.security.SecureRandom();

    private final BonDeCommandeRepository bonDeCommandeRepository;
    private final PrestationRepository prestationRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final ServiceRepository serviceRepository;
    private final ZoneRepository zoneRepository;
    private final SuiviPrestationRepository suiviPrestationRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final NotificationService notificationService;
    private final FileRepository fileRepository;

    public BonDeCommandeService(
            BonDeCommandeRepository bonDeCommandeRepository,
            PrestationRepository prestationRepository,
            BackOfficeRepository backOfficeRepository,
            ServiceRepository serviceRepository,
            ZoneRepository zoneRepository,
            SuiviPrestationRepository suiviPrestationRepository,
            CoordinateurRepository coordinateurRepository,
            NotificationService notificationService,
            FileRepository fileRepository) {
        this.bonDeCommandeRepository = bonDeCommandeRepository;
        this.prestationRepository = prestationRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.serviceRepository = serviceRepository;
        this.zoneRepository = zoneRepository;
        this.suiviPrestationRepository = suiviPrestationRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.notificationService = notificationService;
        this.fileRepository = fileRepository;
    }

    private String generateId(String prefix) {
        StringBuilder id = new StringBuilder(prefix);
        for (int i = 0; i < 6; i++) {
            id.append(ALPHA_NUMERIC.charAt(RANDOM.nextInt(ALPHA_NUMERIC.length())));
        }
        return id.toString();
    }

    @Transactional
    public BonDeCommande createBonDeCommande(BonDeCommandeRequest request) throws IOException {
        logger.info("Creating BonDeCommande with numOt: {}, isOt: {}", request.getNumOt(), request.isOt());

        if (request.getNumOt() != null) request.setOt(true);

        // Validate input
        validateBonDeCommandeRequest(request);

        BackOffice backOffice = backOfficeRepository.findById(request.getBackOfficeId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid back office ID: " + request.getBackOfficeId()));

//        Zone zone = request.getZoneId() != null
//                ? zoneRepository.findById(request.getZoneId())
//                .orElseThrow(() -> new IllegalArgumentException("Invalid zone ID: " + request.getZoneId()))
//                : null;

        // Generate numBc if not provided (for OT)
        String numBc = request.getNumBc() != null && !request.getNumBc().isBlank() ? request.getNumBc() : generateId("BC-");
        while (bonDeCommandeRepository.findByNumBc(numBc).isPresent()) {
            numBc = generateId("BC-");
        }

        BonDeCommande bonDeCommande = BonDeCommande.builder()
                .numBc(numBc)
                .divisionProjet(request.getDivisionProjet())
                .codeProjet(request.getCodeProjet())
                .dateEdition(request.getDateEdition() != null ? request.getDateEdition() : LocalDate.now())
                .description(request.getDescription())
                .numProjetFacturation(request.getNumProjetFacturation())
                .numPvReception(request.getNumPvReception())
                .isOt(request.isOt())
                .numOt(request.isOt() ? request.getNumOt() : null)
                .backOffice(backOffice)
                .build();

        // Handle file
        File file = null;
        if (request.getFileRequest() != null && request.getFileRequest().getFile() != null) {
            logger.debug("Processing file upload for BonDeCommande: {}", numBc);
            file = File.builder()
                    .bonDeCommande(bonDeCommande)
                    .name(request.getFileRequest().getFileName())
                    .content(request.getFileRequest().getFile().getBytes())
                    .contentType(request.getFileRequest().getFile().getContentType())
                    .build();
        }

        // Create prestations with multiple SuiviPrestation records
        List<Prestation> prestations = new ArrayList<>();
        List<PrestationRequest> prestationRequests = request.getPrestations();
        for (PrestationRequest prestationRequest : prestationRequests) {
            ServiceQ service = serviceRepository.findById(prestationRequest.getServiceId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid service ID: " + prestationRequest.getServiceId()));
            String prestationId = generateId("PST-");
            while (prestationRepository.findById(prestationId).isPresent()) {
                prestationId = generateId("PST-");
            }
//            Zone prestationZone = request.isOt() ? zone : prestationRequest.getZoneId() != null
//                    ? zoneRepository.findById(prestationRequest.getZoneId())
//                    .orElseThrow(() -> new IllegalArgumentException("Invalid zone ID: " + prestationRequest.getZoneId()))
//                    : null;



            Prestation prestation = Prestation.builder()
                    .id(prestationId)
                    .numLigne(prestationRequest.getNumLigne())
                    .famille(prestationRequest.getFamille())
                    .description(prestationRequest.getDescription())
                    .qteBc(prestationRequest.getQteBc() != null ? prestationRequest.getQteBc() : 0.0)
                    .service(service)
                    .codeSite(request.isOt() ? request.getCodeSite() : prestationRequest.getCodeSite())
                    .fournisseur(prestationRequest.getFournisseur())
                    .bonDeCommande(bonDeCommande)
                    .build();

            prestations.add(prestation);
        }

        bonDeCommande.setPrestations(prestations);
        BonDeCommande savedBonDeCommande = bonDeCommandeRepository.save(bonDeCommande);

        if (file != null) {
            fileRepository.save(file);
            logger.debug("File saved for BonDeCommande: {}", savedBonDeCommande.getNumBc());
        }


        if (backOffice.getUser() != null) {
            Integer utilisateurId = backOffice.getUser().getId();
            String message = String.format("New BonDeCommande %s created ", savedBonDeCommande.getNumBc());
            notificationService.createNotification(utilisateurId, message);
            logger.debug("Notification sent to back office user ID: {}", utilisateurId);
        }

        logger.info("BonDeCommande created successfully: {}", savedBonDeCommande.getNumBc());
        return savedBonDeCommande;
    }

    @Transactional
    public BonDeCommande updateBonDeCommande(String numBc, BonDeCommandeRequest request) throws IOException {
        logger.info("Updating BonDeCommande with numBc: {}, isOt: {}", numBc, request.isOt());

        // Validate OT flag and fields
        if (request.isOt()) {
            if (request.getNumOt() == null || request.getNumOt().isEmpty()) {
                throw new IllegalArgumentException("numOt is required for Ordre de Travail");
            }
            if (request.getZoneId() == null) {
                throw new IllegalArgumentException("zoneId is required for Ordre de Travail");
            }
        } else if (request.getNumOt() != null) {
            request.setOt(true);
        }

        // Validate request
        validateBonDeCommandeRequest(request);

        // Fetch existing BonDeCommande
        BonDeCommande bonDeCommande = bonDeCommandeRepository.findByNumBc(numBc)
                .orElseThrow(() -> new IllegalArgumentException("BonDeCommande not found: " + numBc));

        // Fetch BackOffice
        BackOffice backOffice = backOfficeRepository.findById(request.getBackOfficeId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid back office ID: " + request.getBackOfficeId()));

        // Fetch Zone (for OT)
        Zone zone = request.isOt() && request.getZoneId() != null
                ? zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid zone ID: " + request.getZoneId()))
                : null;

        // Update BonDeCommande fields
        bonDeCommande.setDivisionProjet(request.getDivisionProjet());
        bonDeCommande.setCodeProjet(request.getCodeProjet());
        bonDeCommande.setDateEdition(request.getDateEdition() != null ? request.getDateEdition() : LocalDate.now());
        bonDeCommande.setNumProjetFacturation(request.getNumProjetFacturation());
        bonDeCommande.setNumPvReception(request.getNumPvReception());
        bonDeCommande.setDescription(request.getDescription());
        bonDeCommande.setOt(request.isOt());
        bonDeCommande.setNumOt(request.isOt() ? request.getNumOt() : null);
        bonDeCommande.setBackOffice(backOffice);

        // Handle file
        if (request.getFileRequest() != null && request.getFileRequest().getFile() != null) {
            fileRepository.findByBonDeCommande(bonDeCommande).ifPresent(fileRepository::delete);
            File file = File.builder()
                    .bonDeCommande(bonDeCommande)
                    .name(request.getFileRequest().getFileName())
                    .content(request.getFileRequest().getFile().getBytes())
                    .contentType(request.getFileRequest().getFile().getContentType())
                    .build();
            fileRepository.save(file);
        }

        // Identify Prestations to keep, update, or delete
        List<Prestation> newPrestationList = new ArrayList<>();
        List<Prestation> existingPrestations = bonDeCommande.getPrestations();
        logger.debug("Existing prestations: {}", existingPrestations.stream().map(Prestation::getId).toList());

        // Process each PrestationRequest
        for (PrestationRequest prestationRequest : request.getPrestations()) {
            logger.debug("Processing PrestationRequest: id={}, numLigne={}", prestationRequest.getId(), prestationRequest.getNumLigne());

            ServiceQ service = serviceRepository.findById(prestationRequest.getServiceId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid service ID: " + prestationRequest.getServiceId()));

            Zone prestationZone = request.isOt() ? zone :
                    prestationRequest.getZoneId() != null
                            ? zoneRepository.findById(prestationRequest.getZoneId())
                            .orElseThrow(() -> new IllegalArgumentException("Invalid zone ID: " + prestationRequest.getZoneId()))
                            : null;

            if (prestationZone == null) {
                throw new IllegalArgumentException("Prestation must have a zone for SuiviPrestation creation");
            }

            Coordinateur coordinateur = coordinateurRepository.findByZoneId(prestationZone.getId())
                    .stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No coordinator found for zone ID: " + prestationZone.getId()));

            Prestation prestation;
            // Match by ID or numLigne for OTs
            Optional<Prestation> existingPrestation = existingPrestations.stream()
                    .filter(p -> {
                        if (prestationRequest.getId() != null && prestationRequest.getId().equals(p.getId())) {
                            return true;
                        }
                        if (request.isOt() && prestationRequest.getId() == null && prestationRequest.getNumLigne() == p.getNumLigne()) {
                            logger.debug("Matched OT prestation by numLigne: {} for prestation ID: {}", prestationRequest.getNumLigne(), p.getId());
                            return true;
                        }
                        return false;
                    })
                    .findFirst();

            if (existingPrestation.isPresent()) {
                // Update existing Prestation
                prestation = existingPrestation.get();
                prestation.setNumLigne(prestationRequest.getNumLigne());
                prestation.setFamille(prestationRequest.getFamille());
                prestation.setDescription(prestationRequest.getDescription());
                prestation.setQteBc(prestationRequest.getQteBc() != null ? prestationRequest.getQteBc() : 0.0);
                prestation.setService(service);
                prestation.setCodeSite(request.isOt() ? request.getCodeSite() : prestationRequest.getCodeSite());
                prestation.setFournisseur(prestationRequest.getFournisseur());

                // Create new SuiviPrestation for update
                SuiviPrestation suiviPrestation = SuiviPrestation.builder()
                        .prestation(prestation)
                        .coordinateur(coordinateur)
                        .zone(prestationZone)
                        .qteRealise(0.0)
                        .qteEncours(0.0)
                        .qteTech(0.0)
                        .qteDepose(0.0)
                        .qteADepose(0.0)
                        .qteSys(0.0)
                        .fournisseur(prestationRequest.getFournisseur())
                        .dateGo(request.getDateGo())
                        .remarque(prestationRequest.getRemarque() != null
                                ? prestationRequest.getRemarque()
                                : "Auto-assigned to coordinator on update")
                        .delaiRecep(0)
                        .build();

                // Add to Prestation's suivi list
                prestation.getSuivi().add(suiviPrestation);
                logger.debug("Added new SuiviPrestation to prestation: {}", prestation.getId());
            } else {
                // Validate no existing Prestation with same numLigne for OTs
                if (request.isOt() && existingPrestations.stream().anyMatch(p -> p.getNumLigne() == prestationRequest.getNumLigne())) {
                    throw new IllegalArgumentException("Duplicate numLigne " + prestationRequest.getNumLigne() + " for OT prestation");
                }

                // Create new Prestation
                String prestationId = prestationRequest.getId() != null ? prestationRequest.getId() : generateId("PST-");
                while (prestationRepository.findById(prestationId).isPresent()) {
                    prestationId = generateId("PST-");
                }

                prestation = Prestation.builder()
                        .id(prestationId)
                        .numLigne(prestationRequest.getNumLigne())
                        .famille(prestationRequest.getFamille())
                        .description(prestationRequest.getDescription())
                        .qteBc(prestationRequest.getQteBc() != null ? prestationRequest.getQteBc() : 0.0)
                        .service(service)
                        .codeSite(request.isOt() ? request.getCodeSite() : prestationRequest.getCodeSite())
                        .fournisseur(prestationRequest.getFournisseur())
                        .bonDeCommande(bonDeCommande)
                        .build();

                // Create new SuiviPrestation
                SuiviPrestation suiviPrestation = SuiviPrestation.builder()
                        .prestation(prestation)
                        .coordinateur(coordinateur)
                        .zone(prestationZone)
                        .qteRealise(0.0)
                        .qteEncours(0.0)
                        .qteTech(0.0)
                        .qteDepose(0.0)
                        .qteADepose(0.0)
                        .qteSys(0.0)
                        .fournisseur(prestationRequest.getFournisseur())
                        .dateGo(request.getDateGo())
                        .remarque(prestationRequest.getRemarque() != null
                                ? prestationRequest.getRemarque()
                                : "Auto-assigned to coordinator")
                        .delaiRecep(0)
                        .build();

                // Add to Prestation's suivi list
                prestation.getSuivi().add(suiviPrestation);
                logger.debug("Created Prestation with ID: {}", prestation.getId());
            }

            newPrestationList.add(prestation);
        }

        // Delete removed Prestations and their SuiviPrestations
        List<Prestation> toDelete = existingPrestations.stream()
                .filter(p -> newPrestationList.stream().noneMatch(np -> np.getId().equals(p.getId())))
                .toList();
        for (Prestation p : toDelete) {
            prestationRepository.delete(p); // Cascades to SuiviPrestation
            logger.debug("Deleted Prestation: {}", p.getId());
        }

        // Update BonDeCommande with new Prestation list
        bonDeCommande.getPrestations().clear();
        bonDeCommande.getPrestations().addAll(newPrestationList);
        BonDeCommande updatedBonDeCommande = bonDeCommandeRepository.save(bonDeCommande);

        // Send notifications
        for (Prestation prestation : updatedBonDeCommande.getPrestations()) {
            for (SuiviPrestation suivi : prestation.getSuivi()) {
                if (suivi.getCoordinateur() != null && suivi.getCoordinateur().getUser() != null) {
                    Integer utilisateurId = suivi.getCoordinateur().getUser().getId();
                    String message = String.format("SuiviPrestation %s for Prestation %s in BonDeCommande %s",
                            existingPrestations.stream().anyMatch(p -> p.getId().equals(prestation.getId())) ? "updated" : "created",
                            prestation.getId(), updatedBonDeCommande.getNumBc());
                    notificationService.createNotification(utilisateurId, message);
                    logger.debug("Notification sent to user ID: {} for prestation: {}", utilisateurId, prestation.getId());
                }
            }
        }

        if (backOffice.getUser() != null) {
            Integer utilisateurId = backOffice.getUser().getId();
            String message = String.format("BonDeCommande %s updated (OT: %s)",
                    updatedBonDeCommande.getNumBc(), updatedBonDeCommande.isOt());
            notificationService.createNotification(utilisateurId, message);
        }

        logger.info("BonDeCommande updated successfully: {}", updatedBonDeCommande.getNumBc());
        return updatedBonDeCommande;
    }

    @Transactional
    public void deleteBonDeCommande(String numBc) {
        logger.info("Deleting BonDeCommande with numBc: {}", numBc);
        BonDeCommande bonDeCommande = bonDeCommandeRepository.findByNumBc(numBc)
                .orElseThrow(() -> new IllegalArgumentException("BonDeCommande not found: " + numBc));
        for (Prestation prestation : bonDeCommande.getPrestations()) {
            prestationRepository.delete(prestation); // Cascades to SuiviPrestation
        }
        fileRepository.findByBonDeCommande(bonDeCommande).ifPresent(fileRepository::delete);
        bonDeCommandeRepository.delete(bonDeCommande);
        logger.info("BonDeCommande deleted successfully: {}", numBc);
    }

    public List<BonDeCommande> getBonDeCommandesByEmailBO(String emailBO) {
        logger.info("Fetching BonDeCommandes for emailBO: {}", emailBO);
        BackOffice backOffice = backOfficeRepository.findByUserEmail(emailBO)
                .orElseThrow(() -> new IllegalArgumentException("BackOffice not found for email: " + emailBO));
        List<BonDeCommande> bonDeCommandes = bonDeCommandeRepository.findByBackOffice(backOffice);
        logger.info("Found {} BonDeCommandes for emailBO: {}", bonDeCommandes.size(), emailBO);
        return bonDeCommandes;
    }

    private void validateBonDeCommandeRequest(BonDeCommandeRequest request) {
        if (request.getPrestations() == null || request.getPrestations().isEmpty()) {
            throw new IllegalArgumentException("At least one prestation is required");
        }
        if (request.isOt()) {
            if (request.getNumOt() == null || request.getNumOt().isBlank()) {
                throw new IllegalArgumentException("numOt is required when isOt is true");
            }
            if (request.getZoneId() == null) {
                throw new IllegalArgumentException("zoneId is required for OT");
            }
            if (request.getDateGo() == null) {
                throw new IllegalArgumentException("dateGo is required for OT");
            }
            if (request.getCodeSite() == null || request.getCodeSite().isBlank()) {
                throw new IllegalArgumentException("codeSite is required for OT");
            }
        } else {
            if (request.getNumBc() == null || request.getNumBc().isBlank()) {
                throw new IllegalArgumentException("numBc is required for non-OT");
            }
        }
        for (PrestationRequest prestation : request.getPrestations()) {
            if (prestation.getNumLigne() == null || prestation.getNumLigne() <= 0) {
                throw new IllegalArgumentException("Prestation numLigne must be positive");
            }
            if (prestation.getServiceId() == null) {
                throw new IllegalArgumentException("Prestation serviceId is required");
            }
        }
    }

    public List<BonDeCommande> getAllBonDeCommandes() {
        logger.info("Fetching all BonDeCommandes");
        return bonDeCommandeRepository.findAll();
    }

    public Optional<BonDeCommande> getBonDeCommandeByNumBc(String numBc) {
        logger.info("Fetching BonDeCommande with numBc: {}", numBc);
        return bonDeCommandeRepository.findByNumBc(numBc);
    }

    public List<BonDeCommandeRequest> getBcByOtStatut(boolean isOt) { //to be deleted
        logger.info("Fetching BonDeCommandes with isOt: {}", isOt);
        try {
            List<BonDeCommande> bonDeCommandes = bonDeCommandeRepository.findByIsOtWithPrestations(isOt);
            return bonDeCommandes.stream().map(bc -> {
                BonDeCommandeRequest request = new BonDeCommandeRequest();
                request.setNumBc(bc.getNumBc());
                request.setNumOt(bc.getNumOt());
                request.setDivisionProjet(bc.getDivisionProjet());
                request.setCodeProjet(bc.getCodeProjet());
                request.setDateGo(bc.getPrestations() != null && !bc.getPrestations().isEmpty() && !bc.getPrestations().get(0).getSuivi().isEmpty() ? bc.getPrestations().get(0).getSuivi().get(0).getDateGo() : null);
                request.setCodeSite(bc.getPrestations() != null && !bc.getPrestations().isEmpty() ? bc.getPrestations().get(0).getCodeSite() : null);
                request.setDescription(bc.getDescription());
                request.setDateEdition(bc.getDateEdition());
                request.setNumProjetFacturation(bc.getNumProjetFacturation());
                request.setNumPvReception(bc.getNumPvReception());
                request.setBackOfficeId(bc.getBackOffice() != null ? bc.getBackOffice().getId() : null);
                request.setOt(bc.isOt());
                request.setPrestations(bc.getPrestations().stream().map(prestation -> {
                    PrestationRequest prestationRequest = new PrestationRequest();
                    prestationRequest.setId(prestation.getId());
                    prestationRequest.setNumLigne(prestation.getNumLigne());
                    prestationRequest.setDescription(prestation.getDescription());
                    prestationRequest.setQteBc(prestation.getQteBc());
                    prestationRequest.setFamille(prestation.getFamille());
                    prestationRequest.setServiceId(prestation.getService() != null ? prestation.getService().getId() : null);
                      prestationRequest.setFournisseur(prestation.getFournisseur());
                    prestationRequest.setCodeSite(prestation.getCodeSite());
                    prestationRequest.setRemarque(prestation.getSuivi() != null && !prestation.getSuivi().isEmpty() ? prestation.getSuivi().get(0).getRemarque() : null);
                    return prestationRequest;
                }).collect(Collectors.toList()));
                return request;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching BonDeCommandes with isOt: {}", isOt, e);
            throw new RuntimeException("Failed to fetch BonDeCommandes", e);
        }
    }

    public List<ServiceSummary> getServicesByNumBc(String numBc) {
        Optional<BonDeCommande> bcOpt = bonDeCommandeRepository.findById(numBc);
        if (bcOpt.isEmpty()) {
            throw new IllegalArgumentException("BonDeCommande not found: " + numBc);
        }
        return bcOpt.get().getPrestations().stream()
                .map(prestation -> ServiceSummary.builder()
                        .id(prestation.getService().getId())
                        .description(prestation.getService().getDescription())
                        .familleName(prestation.getService().getFamille() != null ? prestation.getService().getFamille().getName() : null)
                        .build())
                .distinct()
                .collect(Collectors.toList());
    }
}