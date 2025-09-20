package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.models.BackOffice;
import com.samsic.gestion_bc.models.Ot;
import com.samsic.gestion_bc.models.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OtRepository extends JpaRepository<Ot, String> {
    List<Ot> findByZone(Zone zone);
    List<Ot> findAllByBackOffice(BackOffice backOffice);
}