package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.DashboardMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DashboardMetricRepository extends JpaRepository<DashboardMetric, Long> {
    List<DashboardMetric> findByBackOfficeIdAndCalculationDateBetween(
            Integer backOfficeId, LocalDate startDate, LocalDate endDate);

    List<DashboardMetric> findByBackOfficeIdAndFamilleAndCalculationDateBetween(
            Integer backOfficeId, String famille, LocalDate startDate, LocalDate endDate);

    void deleteByBackOfficeIdAndCalculationDate(Integer backOfficeId, LocalDate calculationDate);

    boolean existsByBackOfficeIdAndCalculationDate(Integer backOfficeId, LocalDate calculationDate);
}