package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.BonDeCommande;
import com.samsic.gestion_bc.models.File;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FileRepository extends JpaRepository<File, Long> {
    Optional<File> findByBonDeCommandeNumBc(String bonDeCommandeNumBc);

    Optional<File> findByBonDeCommande(BonDeCommande bonDeCommande);
    File findBySuiviPrestationId(Integer suiviPrestationId);
}