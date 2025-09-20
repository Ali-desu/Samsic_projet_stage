package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Famille;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FamilleRepository extends JpaRepository<Famille, Long> {
    boolean existsByName(String name);
}