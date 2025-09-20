package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.dto.RegisterRequest;
import com.samsic.gestion_bc.dto.requests.SetPasswordRequest;
import com.samsic.gestion_bc.models.*;
import com.samsic.gestion_bc.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final CoordinateurRepository coordinateurRepository;
    private final ChefProjetRepository chefProjetRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final ZoneRepository zoneRepository;

    public UserService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            EmailService emailService,
            PasswordEncoder passwordEncoder,
            CoordinateurRepository coordinateurRepository,
            ChefProjetRepository chefProjetRepository,
            BackOfficeRepository backOfficeRepository,
            ZoneRepository zoneRepository
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.coordinateurRepository = coordinateurRepository;
        this.chefProjetRepository = chefProjetRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.zoneRepository = zoneRepository;
    }

    public Optional<Utilisateur> findByEmail(String email) throws UsernameNotFoundException {
        log.info("Loading user: {}", email);
        return userRepository.findByEmail(email);
    }

    public List<Utilisateur> findAllBackOfficeUsers() {
        log.info("Fetching all back office users");
        return userRepository.findAllBackOfficeUsers();
    }

    @Transactional
    public String registerUser(RegisterRequest request) throws IllegalArgumentException {
        log.info("Starting user registration for email: {}", request.getEmail());
        // Check if email exists
        log.debug("Checking if email exists: {}", request.getEmail());
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Email already exists: {}", request.getEmail());
            throw new IllegalArgumentException("Email already exists");
        }

        // Validate role
        log.debug("Validating role: {}", request.getRole());
        if (request.getRole() == null) {
            log.error("Invalid role provided");
            throw new IllegalArgumentException("Invalid role");
        }

        // Create user
        log.debug("Creating user with role: {}", request.getRole());
        Utilisateur user = Utilisateur.builder()
                .email(request.getEmail())
                .nom(request.getNom())
                .role(Role.valueOf(String.valueOf(request.getRole())))
                .mdp(passwordEncoder.encode(UUID.randomUUID().toString().substring(0, 12)))
                .build();
        log.info("Saving user to database");
        userRepository.save(user);

        // Save to role-specific table
        log.debug("Processing role-specific save for role: {}", request.getRole());
        switch (request.getRole()) {
            case COORDINATEUR:
                Zone zone = null;
                if (request.getZoneId() != null) {
                    log.debug("Fetching zone with ID: {}", request.getZoneId());
                    zone = zoneRepository.findById(request.getZoneId())
                            .orElseThrow(() -> {
                                log.error("Invalid zone ID: {}", request.getZoneId());
                                return new IllegalArgumentException("Invalid zone ID");
                            });
                }
                Coordinateur coordinateur = Coordinateur.builder()
                        .user(user)
                        .zone(zone)
                        .build();
                log.info("Saving Coordinateur");
                coordinateurRepository.save(coordinateur);
                break;
            case CHEF_PROJET:
                ChefProjet chefProjet = ChefProjet.builder()
                        .user(user)
                        .build();
                log.info("Saving ChefProjet");
                chefProjetRepository.save(chefProjet);
                break;
            case BACK_OFFICE:
                BackOffice backOffice = BackOffice.builder()
                        .user(user)
                        .build();
                log.info("Saving BackOffice");
                backOfficeRepository.save(backOffice);
                break;
            default:
                log.error("Unsupported role: {}", request.getRole());
                throw new IllegalArgumentException("Role not supported for registration");
        }

        // Generate OTP token
        log.debug("Generating OTP token");
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken(
                token,
                user,
                LocalDateTime.now().plusHours(24)
        );
        log.info("Saving OTP token");
        tokenRepository.save(resetToken);

        // Send OTP email asynchronously
        log.info("Triggering OTP email to: {}", request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), token);

        log.info("User registration completed successfully for email: {}", request.getEmail());
        return "User created, secure link sent to email";
    }

    @Transactional
    public String setPassword(SetPasswordRequest request) {
        log.info("Setting password with token: {}", request.getToken());
        PasswordResetToken token = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> {
                    log.error("Invalid or expired token: {}", request.getToken());
                    return new IllegalArgumentException("Invalid or expired token");
                });

        if (token.isUsed() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            log.error("Token is used or expired: {}", request.getToken());
            throw new IllegalArgumentException("Token is invalid or expired");
        }

        Utilisateur user = token.getUser();
        user.setMdp(passwordEncoder.encode(request.getPassword()));
        log.info("Saving updated user password");
        userRepository.save(user);

        token.setUsed(true);
        log.info("Marking token as used");
        tokenRepository.save(token);

        log.info("Password set successfully for user: {}", user.getEmail());
        return "Password set successfully";
    }
}