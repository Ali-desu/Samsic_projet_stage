package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.models.DashboardMetric;
import com.samsic.gestion_bc.services.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class DashboardController {
    private final DashboardService dashboardService;

    @Autowired
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('COORDINATOR', 'BACK_OFFICE')")
    public List<DashboardMetric> getDashboardMetrics(
            @RequestParam String email,
            @RequestParam(required = false) String famille,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        LocalDate start = LocalDate.parse(startDate);
        LocalDate end = LocalDate.parse(endDate);
        return dashboardService.getMetricsByBackOfficeEmailAndFamily(email, famille, start, end);
    }
}