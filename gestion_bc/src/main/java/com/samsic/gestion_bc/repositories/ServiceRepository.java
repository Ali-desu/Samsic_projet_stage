package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Famille;
import com.samsic.gestion_bc.models.ServiceQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceQ, Integer> {
    Optional<ServiceQ> findById(Integer id);

    boolean existsByDescription(String description);
    Optional<List<ServiceQ>> getServiceByFamille_Name(String familleName);
}