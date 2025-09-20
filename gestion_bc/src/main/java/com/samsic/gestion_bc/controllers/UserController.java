package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.dto.RegisterRequest;
import com.samsic.gestion_bc.dto.requests.SetPasswordRequest;
import com.samsic.gestion_bc.models.Utilisateur;
import com.samsic.gestion_bc.services.EmailService;
import com.samsic.gestion_bc.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class UserController {
    private final UserService userService;
    private final EmailService emailService;

    public UserController(UserService userService,
                          EmailService emailService) {
        this.userService = userService;
        this.emailService = emailService;
    }

    @GetMapping("/id-by-email/{email:.+}")
    @PreAuthorize("hasAnyRole('COORDINATEUR', 'BACK_OFFICE')")
    public ResponseEntity<Integer> getUtilisateurIdByEmail(@PathVariable String email) {
        try {
            Utilisateur utilisateur = userService.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));
            return ResponseEntity.ok(utilisateur.getId());
        } catch (IllegalArgumentException e) {
            System.out.println("Error fetching user ID for email " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        } catch (Exception e) {
            System.out.println("Server error fetching user ID for email " + email + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/backoffices")
    @PreAuthorize("hasRole('CHEF_PROJET')")
    public ResponseEntity<List<String>> getAllBackOffices() {
        try {
            System.out.println("Fetching all backoffice users");
            List<Utilisateur> backOfficeUsers = userService.findAllBackOfficeUsers();
            List<String> backOfficeEmails = backOfficeUsers.stream()
                    .map(Utilisateur::getEmail)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(backOfficeEmails);
        } catch (Exception e) {
            System.out.println("Error fetching backoffice users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @PostMapping("/register")
    @PreAuthorize("hasRole('CHEF_PROJET')")
    public ResponseEntity<String> registerUser(@RequestBody RegisterRequest request) {
        try {
            String message = userService.registerUser(request);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("Error registering user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create user");
        }
    }

    @PostMapping("/set-password")
    public ResponseEntity<String> setPassword(@RequestBody SetPasswordRequest request) {
        try {
            String message = userService.setPassword(request);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.out.println("Error setting password: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to set password");
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<String> testEmail(@RequestBody String email) {
        try {
            emailService.sendOtpEmail(email, "test-token-123");
            return ResponseEntity.ok("Email sent successfully");
        } catch (Exception e) {
            System.out.println("Email test failed " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Email failed: " + e.getMessage());
        }
    }
}