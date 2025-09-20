package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.OtPrestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface OtPrestationRepository extends JpaRepository<OtPrestation, Long> {

    // 1. Total sum of quantiteValide * prix for OT prestations by back office email
    @Query("SELECT COALESCE(SUM(op.quantiteValide * op.service.prix), 0.0) " +
            "FROM OtPrestation op WHERE op.ot.backOffice.user.email = :email")
    Double getTotalOtPrestationCostByEmail(String email);

    // 2. Sum of quantiteValide * prix where statutDeRealisation = 'REALISE' by back office email
    @Query("SELECT COALESCE(SUM(op.quantiteValide * op.service.prix), 0.0) " +
            "FROM OtPrestation op WHERE op.statutDeRealisation = 'REALISE' AND op.ot.backOffice.user.email = :email")
    Double getRealisedOtPrestationCostByEmail(String email);

    // 3. Sum of quantiteValide * prix where statutDeRecepTech = 'RECEPTIONNE' by back office email
    @Query("SELECT COALESCE(SUM(op.quantiteValide * op.service.prix), 0.0) " +
            "FROM OtPrestation op WHERE op.statutDeRecepTech = 'RECEPTIONNE' AND op.ot.backOffice.user.email = :email")
    Double getReceptionneOtPrestationCostByEmail(String email);
}