package com.samsic.gestion_bc.dto.responses;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OtMetricsResponse {
    private Double totalCost;
    private Double realisedCost;
    private Double receptionneCost;
}