package com.samsic.gestion_bc.repositories;


import com.samsic.gestion_bc.models.ChefProjet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChefProjetRepository extends JpaRepository<ChefProjet, Integer> {
    @Query("SELECT c FROM ChefProjet c")
    List<ChefProjet> findAll();
    Optional<ChefProjet> findByUserId(Integer userId);
}
