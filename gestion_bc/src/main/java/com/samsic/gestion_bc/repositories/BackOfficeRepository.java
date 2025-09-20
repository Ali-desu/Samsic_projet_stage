package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.BackOffice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BackOfficeRepository extends JpaRepository<BackOffice, Integer> {
    @Query("SELECT b FROM BackOffice b JOIN b.user u WHERE u.email = :email")
    Optional<BackOffice> findByUserEmail(@Param("email") String email);
}