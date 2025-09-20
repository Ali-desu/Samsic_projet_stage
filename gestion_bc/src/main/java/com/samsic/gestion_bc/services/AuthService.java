package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.RegisterRequest;
import com.samsic.gestion_bc.models.*;
import com.samsic.gestion_bc.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
public class AuthService {
    private final UserRepository utilisateurRepository;
    private final CoordinateurRepository coordinateurRepository;
    private final ChefProjetRepository chefProjetRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final ZoneRepository zoneRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AuthService(UserRepository utilisateurRepository,
                       CoordinateurRepository coordinateurRepository,
                       ChefProjetRepository chefProjetRepository,
                       BackOfficeRepository backOfficeRepository,
                       ZoneRepository zoneRepository,
                       PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.coordinateurRepository = coordinateurRepository;
        this.chefProjetRepository = chefProjetRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.zoneRepository = zoneRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public void register(RegisterRequest request) throws IllegalArgumentException {
        // Check if email exists
        if (utilisateurRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Invalid role");
        }

        // Create and save Utilisateur
        Utilisateur user = Utilisateur.builder()
                .nom(request.getNom())
                .email(request.getEmail())
//                .mdp(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();
        utilisateurRepository.save(user);

        // Save to role-specific table
        switch (request.getRole()) {
            case COORDINATEUR:
                Zone zone = null;
                if (request.getZoneId() != null) {
                    zone = zoneRepository.findById(request.getZoneId())
                            .orElseThrow(() -> new IllegalArgumentException("Invalid zone ID"));
                }
                Coordinateur coordinateur = Coordinateur.builder()
                        .user(user)
                        .zone(zone)
                        .build();
                coordinateurRepository.save(coordinateur);
                break;
            case CHEF_PROJET:
                ChefProjet chefProjet = ChefProjet.builder()
                        .user(user)
                        .build();
                chefProjetRepository.save(chefProjet);
                break;
            case BACK_OFFICE:
                BackOffice backOffice = BackOffice.builder()
                        .user(user)
                        .build();
                backOfficeRepository.save(backOffice);
                break;
            default:
                throw new IllegalArgumentException("Role not supported for registration");
        }
    }
}