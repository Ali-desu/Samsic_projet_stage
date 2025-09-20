package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.models.Zone;
import com.samsic.gestion_bc.services.ZoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class ZoneController {
    private final ZoneService zoneService;

    @Autowired
    public ZoneController(ZoneService zoneService) {
        this.zoneService = zoneService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('BACK_OFFICE','CHEF_PROJET')")
    public ResponseEntity<List<Zone>> getAllZones() {
        try {
            List<Zone> zones = zoneService.getAllZones();
            return zones.isEmpty()
                    ? ResponseEntity.status(HttpStatus.NOT_FOUND).body(null)
                    : ResponseEntity.ok(zones);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}