package com.samsic.gestion_bc.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceSummary {
    private Integer id;
    private String description;
    private String familleName;
}