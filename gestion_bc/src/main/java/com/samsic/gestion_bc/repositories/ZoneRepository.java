package com.samsic.gestion_bc.repositories;


import com.samsic.gestion_bc.models.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Integer> {
    Optional<Zone> findByNom(String nom);
}
