package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Coordinateur;
import com.samsic.gestion_bc.models.SuiviPrestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public interface SuiviPrestationRepository extends JpaRepository<SuiviPrestation, Integer> {
    @Query("SELECT sp FROM SuiviPrestation sp " +
            "JOIN sp.prestation p " +
            "JOIN p.bonDeCommande bc " +
            "JOIN bc.backOffice bo " +
            "JOIN bo.user u " +
            "WHERE u.email = :emailBO")
    List<SuiviPrestation> findByBackOfficeEmail(@Param("emailBO") String emailBO);
    void deleteByPrestationId(String prestationId);

    List<SuiviPrestation> findByCoordinateur(Coordinateur coordinateur);
    List<SuiviPrestation> findByPrestationIdIn(List<String> prestationIds);
    List<SuiviPrestation> findByDateRealisationNotNullAndDateRecepTechIsNull();
    List<SuiviPrestation> findByDateRecepTechNotNullAndDateRecepSysIsNull();
    @Query("SELECT sp FROM SuiviPrestation sp JOIN FETCH sp.prestation p JOIN FETCH p.bonDeCommande bc JOIN FETCH bc.backOffice bo JOIN FETCH bo.user u WHERE u.email = :email")
    List<SuiviPrestation> findByUserEmail(@Param("email") String email);

    Optional<Object> findByPrestationId(String prestationId);
}
