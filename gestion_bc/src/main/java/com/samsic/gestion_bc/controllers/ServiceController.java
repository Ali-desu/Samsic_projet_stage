package com.samsic.gestion_bc.controllers;

import com.samsic.gestion_bc.models.ServiceQ;
import com.samsic.gestion_bc.services.BoqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class ServiceController {

    private final BoqService boqService;

    @Autowired
    public ServiceController(BoqService boqService) {
        this.boqService = boqService;
    }

    @GetMapping
    ResponseEntity<List<ServiceQ>> getServices() {
        try{
            System.out.println("fetching services");
            List<ServiceQ> services = boqService.getServices();
            return ResponseEntity.ok(services);
        }
        catch (Exception e){
            System.out.println("error in fetching services :" + e.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CHEF_PROJET', 'BACK_OFFICE')")
    ResponseEntity<ServiceQ> createService(@RequestBody ServiceQ service) {
        try {
            ServiceQ savedService = boqService.addService(service);
            if (savedService != null) {
                return ResponseEntity.ok(savedService); // Return the saved service as JSON
            } else {
                return ResponseEntity.badRequest().body(null); // Return 400 for invalid data
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null); // Return 500 with null body
        }
    }

    // ✅ FIXED
    @GetMapping("/by-famille/{familleName}")
    public ResponseEntity<List<ServiceQ>> getServiceByFamilleName(@PathVariable String familleName) {
        Optional<List<ServiceQ>> service = boqService.getServiceByFamilleName(familleName);
        return service.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-famille/{id}")
    public ResponseEntity<ServiceQ> getServiceById(@PathVariable int id) {
        try{
            Optional<ServiceQ> res = boqService.getServiceById(id);
            return res.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        }
        catch (Exception e){
            return ResponseEntity.internalServerError().body(null);
        }
    }



}
