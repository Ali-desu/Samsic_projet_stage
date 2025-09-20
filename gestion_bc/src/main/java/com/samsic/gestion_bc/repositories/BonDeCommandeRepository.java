package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.BackOffice;
import com.samsic.gestion_bc.models.BonDeCommande;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BonDeCommandeRepository extends JpaRepository<BonDeCommande, String> {
    Optional<BonDeCommande> findByNumBc(String numBc);
    List<BonDeCommande> findByBackOffice(BackOffice backOffice);
    List<BonDeCommande> findByIsOt(boolean ot);

    @Query("SELECT bc FROM BonDeCommande bc LEFT JOIN FETCH bc.prestations p LEFT JOIN FETCH p.suivi WHERE bc.isOt = :isOt")
    List<BonDeCommande> findByIsOtWithPrestations(boolean isOt);

}
