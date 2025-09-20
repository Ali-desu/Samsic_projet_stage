package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.models.BackOffice;
import com.samsic.gestion_bc.models.DashboardMetric;
import com.samsic.gestion_bc.repositories.BackOfficeRepository;
import com.samsic.gestion_bc.repositories.DashboardMetricRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.time.LocalDate;
import java.util.List;
@Service
public class DashboardService {
    private final BackOfficeRepository backOfficeRepository;
    private final DashboardMetricRepository dashboardMetricRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public DashboardService(
            BackOfficeRepository backOfficeRepository,
            DashboardMetricRepository dashboardMetricRepository) {
        this.backOfficeRepository = backOfficeRepository;
        this.dashboardMetricRepository = dashboardMetricRepository;
    }

    @Scheduled(cron = "0 0 1 * * *") // Run daily at 1 AM
    @Transactional
    public void calculateDailyMetrics() {
        List<BackOffice> backOffices = backOfficeRepository.findAll();
        LocalDate today = LocalDate.now();

        for (BackOffice backOffice : backOffices) {
            // Skip if metrics already exist for today
            if (!dashboardMetricRepository.existsByBackOfficeIdAndCalculationDate(backOffice.getId(), today)) {
                String sql = """
                     SELECT 
                    p.famille,
                    COALESCE(SUM(p.qte_bc * s.prix), 0.0) as montant_total_bc,
                    COALESCE(SUM(sp.qte_tech * s.prix), 0.0) as montant_cloture_terrain,
                    COALESCE(CASE 
                        WHEN SUM(p.qte_bc) > 0 
                        THEN (SUM(sp.qte_realise) / SUM(p.qte_bc) * 100) 
                        ELSE 0.0 
                    END, 0.0) as taux_realisation,
                    COALESCE(SUM(CASE 
                        WHEN sp.date_recep_sys IS NOT NULL 
                        THEN sp.qte_sys * s.prix 
                        ELSE 0.0 
                    END), 0.0) as montant_receptionne,
                    COALESCE(SUM(sp.qte_depose * s.prix), 0.0) as montant_depose_sys,
                    COALESCE(SUM(sp.qteadepose * s.prix), 0.0) as montant_a_depose_sys
                FROM prestations p
                JOIN bon_de_commande bc ON p.bc_id = bc.num_bc
                JOIN services s ON p.service_id = s.id
                LEFT JOIN suivi_prestation sp ON p.id = sp.prestation_id
                WHERE bc.back_office_id = :backOfficeId
                GROUP BY p.famille
                """;

                Query query = entityManager.createNativeQuery(sql);
                query.setParameter("backOfficeId", backOffice.getId());
                List<Object[]> results = query.getResultList();

                for (Object[] row : results) {
                    String famille = (String) row[0];
                    Double montantTotalBc = ((Number) row[1]).doubleValue();
                    Double montantClotureTerrain = ((Number) row[2]).doubleValue();
                    Double tauxRealisation = ((Number) row[3]).doubleValue();
                    Double montantReceptionneFacture = ((Number) row[4]).doubleValue();
                    Double montantDeposeSys = ((Number) row[5]).doubleValue();
                    Double montantADeposeSys = ((Number) row[6]).doubleValue();

                    DashboardMetric metric = DashboardMetric.builder()
                            .backOfficeId(backOffice.getId())
                            .famille(famille)
                            .calculationDate(today)
                            .montantTotalBc(montantTotalBc)
                            .montantClotureTerrain(montantClotureTerrain)
                            .tauxRealisation(tauxRealisation)
                            .montantReceptionneFacture(montantReceptionneFacture)
                            .montantDeposeSys(montantDeposeSys)
                            .montantADeposeSys(montantADeposeSys)
                            .build();

                    dashboardMetricRepository.save(metric);
                }
            }
        }
    }

    public List<DashboardMetric> getMetricsByBackOfficeEmailAndFamily(String email, String famille, LocalDate startDate, LocalDate endDate) {
        BackOffice backOffice = backOfficeRepository.findByUserEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Back-office not found for email: " + email));
        if (famille == null || famille.equalsIgnoreCase("all")) {
            return dashboardMetricRepository.findByBackOfficeIdAndCalculationDateBetween(
                    backOffice.getId(), startDate, endDate);
        } else {
            return dashboardMetricRepository.findByBackOfficeIdAndFamilleAndCalculationDateBetween(
                    backOffice.getId(), famille, startDate, endDate);
        }
    }
}