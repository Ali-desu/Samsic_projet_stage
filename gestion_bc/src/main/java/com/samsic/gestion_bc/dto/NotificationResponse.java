package com.samsic.gestion_bc.dto;

import com.samsic.gestion_bc.models.Role;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Getter
@Setter
public class NotificationResponse {
    private Integer id;
    private Integer utilisateurId;
    private Role role;
    private String message;
    private Date createdAt;
    private boolean isRead;
}