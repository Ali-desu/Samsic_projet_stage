package com.samsic.gestion_bc.dto.requests;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SetPasswordRequest {
    private String token;
    private String password;
}