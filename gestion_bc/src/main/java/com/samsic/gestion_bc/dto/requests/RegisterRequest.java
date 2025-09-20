package com.samsic.gestion_bc.dto.requests;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    private String email;
    private String nom;
    private String role;
}