package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Site;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SiteRepository extends JpaRepository<Site, Integer> {
    List<Site> findAll();

    Site findAllByCodesite(String codesite);

    Site findByCodesite(String codeSite);
}
