package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.LoginRequest;
import com.samsic.gestion_bc.dto.RegisterRequest;
import com.samsic.gestion_bc.models.BackOffice;
import com.samsic.gestion_bc.models.Utilisateur;
import com.samsic.gestion_bc.repositories.BackOfficeRepository;
import com.samsic.gestion_bc.repositories.UserRepository;
import com.samsic.gestion_bc.services.AuthService;
import com.samsic.gestion_bc.services.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final BackOfficeRepository backOfficeRepository;
    private final AuthService authService;

    @Autowired
    public AuthController(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserDetailsService userDetailsService,
            UserRepository userRepository,
            BackOfficeRepository backOfficeRepository, AuthService authService
            ) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
        this.backOfficeRepository = backOfficeRepository;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok("User registered successfully");
        } catch (IllegalArgumentException e) {
            logger.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        try {
            logger.info("Attempting login for email: {}", request.getEmail());
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));
            UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
            String token = jwtUtil.generateToken(userDetails);

            // Fetch user details
            Optional<Utilisateur> userOpt = userRepository.findByEmail(request.getEmail());
            if (userOpt.isEmpty()) {
                logger.error("User not found for email: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not found"));
            }
            Utilisateur user = userOpt.get();

            // Fetch backOfficeId if the user is a BACK_OFFICE
            Integer backOfficeId = null;
            if (user.getRole().toString().equals("BACK_OFFICE")) {
                Optional<BackOffice> backOfficeOpt = backOfficeRepository.findByUserEmail(request.getEmail());
                if (backOfficeOpt.isPresent()) {
                    backOfficeId = backOfficeOpt.get().getId();
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("userId", user.getId());
            response.put("role", userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "").toLowerCase());
            response.put("backOfficeId", backOfficeId); // null if not a BACK_OFFICE user
            response.put("name", user.getNom() != null ? user.getNom() : request.getEmail().split("@")[0]);
            response.put("email", request.getEmail());

            logger.info("Login successful for user: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Login failed for email: {}. Error: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials"));
        }
    }
}