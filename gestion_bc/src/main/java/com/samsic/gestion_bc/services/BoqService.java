package com.samsic.gestion_bc.services;

import com.samsic.gestion_bc.models.ServiceQ;
import com.samsic.gestion_bc.repositories.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class BoqService {
    private final ServiceRepository serviceRepository;


    public BoqService(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    public List<ServiceQ> getServices() {
        return serviceRepository.findAll();
    }

    @Transactional
    public ServiceQ addService(ServiceQ service) {
        // Check for duplicate service (e.g., by description or refAuxigene)
        if (service.getDescription() != null &&
                serviceRepository.existsByDescription(service.getDescription())) {
            return null; // Signal duplicate
        }
        return serviceRepository.save(service); // Save and return the service
    }

    public Optional<List<ServiceQ>> getServiceByFamilleName(String familleName) {
        return serviceRepository.getServiceByFamille_Name(familleName);
    }

    public Optional<ServiceQ> getServiceById(int id){
        return serviceRepository.findById(id);
    }

}
