package com.samsic.gestion_bc.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ServiceResponse {
    private Integer id;
    private String nomService;
    private double prix;
}
