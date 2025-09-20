package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.BcSummary;
import com.samsic.gestion_bc.dto.Bcdetail;
import com.samsic.gestion_bc.dto.TableauDeBordDTO;
import com.samsic.gestion_bc.models.Prestation;
import com.samsic.gestion_bc.repositories.PrestationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PrestationService {
    private static final Logger logger = LoggerFactory.getLogger(PrestationService.class);
    private final PrestationRepository prestationRepository;

    @Autowired
    public PrestationService(PrestationRepository prestationRepository) {
        this.prestationRepository = prestationRepository;
    }

    public List<Prestation> getAllPrestations(Authentication auth) {
        String email = auth.getName();
        logger.info("Fetching all prestations for email: {}", email);
        return prestationRepository.findAll();
    }

    public Optional<Prestation> getPrestationById(String id) {
        logger.info("Fetching prestation with ID: {}", id);
        return prestationRepository.findById(id);
    }

    public List<Prestation> getPrestationsByBonDeCommande(String bcId) {
        logger.info("Fetching prestations for BonDeCommande: {}", bcId);
        return prestationRepository.findByBonDeCommandeNumBc(bcId);
    }

    public List<Bcdetail> getReportPrestation(Authentication auth) {
        String email = auth.getName();
        logger.info("Fetching report prestation raw for email: {}", email);
        return getReportPrestationByEmail(email);
    }

    public List<Bcdetail> getReportPrestationByEmail(String email) {
        logger.info("Fetching report prestation raw for backoffice email: {}", email);
        List<Object[]> rows = prestationRepository.getReportPrestationRaw(email);
        return rows.stream().map(row -> new Bcdetail(
                (String) row[0],               // numBc
                (String) row[1],               // divisionProjet
                (String) row[2],               // codeProjet
                ((Number) row[3]).intValue(),  // numLigne
                (String) row[4],               // dateEdition
                (String) row[5],               // descriptionPrestation
                (String) row[6],               // descriptionArticle
                toDouble(row[7]),              // totalQteBc
                toDouble(row[8]),              // realise
                toDouble(row[9]),              // enCours
                toDouble(row[10]),             // reliquat
                toDouble(row[11]),             // receptionTech
                toDouble(row[12]),             // deposeSys
                toDouble(row[13]),             // aDeposeSys
                toDouble(row[14]),             // receptionneSys
                toDouble(row[15]),             // prixUnite
                (String) row[16]               // familleProjet
        )).collect(Collectors.toList());
    }

    public List<BcSummary> getBcSummaries(Authentication auth) {
        String email = auth.getName();
        logger.info("Fetching bon de commande summaries for email: {}", email);
        return getBcSummariesByEmail(email);
    }

    public List<BcSummary> getBcSummariesByEmail(String email) {
        logger.info("Fetching bon de commande summaries for backoffice email: {}", email);
        return prestationRepository.getBonDeCommandeSummaries(email)
                .stream()
                .map(row -> new BcSummary(
                        (String) row[0],               // numBc
                        (String) row[1],               // divisionProjet
                        (String) row[2],               // codeProjet
                        ((Date) row[3]).toLocalDate(), // dateEdition
                        (String) row[4],               // familleProjet
                        (String) row[5],               // descriptionPrestation
                        toDouble(row[6]),              // montantHt
                        toDouble(row[7]),              // montantCloture
                        toDouble(row[8]),              // montantFactureSys
                        toDouble(row[9]),              // montantDepose
                        toDouble(row[10]),             // montantADeposer
                        toDouble(row[11]),             // TEC
                        toDouble(row[12])              // tauxRealisation
                ))
                .collect(Collectors.toList());
    }

    public List<TableauDeBordDTO> getDashboard(Authentication auth) {
        String email = auth.getName();
        logger.info("Fetching dashboard metrics for email: {}", email);
        return getDashboardByBackofficeEmail(email);
    }

    public List<TableauDeBordDTO> getDashboardByBackofficeEmail(String backofficeEmail) {
        logger.info("Fetching dashboard metrics for backoffice email: {}", backofficeEmail);
        List<Object[]> results = prestationRepository.getDashboardData(backofficeEmail);
        return results.stream().map(row -> new TableauDeBordDTO(
                (String) row[0],               // familleName
                toBigDecimal(row[1]),          // montantTotalBc
                toBigDecimal(row[2]),          // montantClotureTerrain
                toBigDecimal(row[3]),          // tauxRealisation
                toBigDecimal(row[4]),          // montantReceptionneFacture
                toBigDecimal(row[5]),          // montantDeposeSys
                toBigDecimal(row[6]),          // montantADeposerSys
                toBigDecimal(row[7]),          // montantEnCoursRecepTech
                toBigDecimal(row[8]),          // montantEnCoursRecepTechReserve
                toBigDecimal(row[9]),          // montantRestantBc
                toBigDecimal(row[10])          // montantTravauxEnCours
        )).collect(Collectors.toList());
    }

    private Double toDouble(Object obj) {
        return obj != null ? ((Number) obj).doubleValue() : 0.0;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        return value instanceof BigDecimal ? (BigDecimal) value : new BigDecimal(value.toString());
    }
}