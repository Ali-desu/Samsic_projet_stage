package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Coordinateur;
import com.samsic.gestion_bc.models.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoordinateurRepository extends JpaRepository<Coordinateur, Integer> {
    Optional<Coordinateur> findByUserId(Integer userId);
    List<Coordinateur> findByZoneId(Integer zoneId);
    Optional<Coordinateur> findByZone(Zone zone);
    Optional<Coordinateur> findByUserEmail(String email);
}