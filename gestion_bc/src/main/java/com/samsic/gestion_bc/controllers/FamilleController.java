package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.models.Famille;
import com.samsic.gestion_bc.repositories.FamilleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/familles")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class FamilleController {

    @Autowired
    private FamilleRepository familleRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public List<Famille> getAllFamilles() {
        return familleRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    public ResponseEntity<Famille> createFamille(@RequestBody Famille famille) {
        if (famille.getName() == null || famille.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }
        if (familleRepository.existsByName(famille.getName())) {
            return ResponseEntity.badRequest().body(null);
        }
        Famille savedFamille = familleRepository.save(famille);
        return ResponseEntity.ok(savedFamille);
    }
}