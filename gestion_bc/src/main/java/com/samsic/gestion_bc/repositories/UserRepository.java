package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Utilisateur, Integer> {
    Optional<Utilisateur> findByEmail(String email);

    @Query("SELECT u FROM Utilisateur u WHERE u.role = 'BACK_OFFICE'")
    List<Utilisateur> findAllBackOfficeUsers();
}