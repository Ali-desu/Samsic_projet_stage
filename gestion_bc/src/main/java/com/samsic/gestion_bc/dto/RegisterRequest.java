package com.samsic.gestion_bc.dto;

import com.samsic.gestion_bc.models.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String nom;
    private String email;
    private String password;
    private Role role;
    private Integer zoneId; // Optional, for COORDINATEUR
}