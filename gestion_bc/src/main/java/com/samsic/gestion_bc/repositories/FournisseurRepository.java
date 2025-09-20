package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FournisseurRepository extends JpaRepository<Fournisseur, Integer> {
    Optional<Fournisseur> findByNom(String name);
}
