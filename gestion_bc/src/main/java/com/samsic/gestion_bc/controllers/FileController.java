package com.samsic.gestion_bc.controllers;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.samsic.gestion_bc.models.File;
import com.samsic.gestion_bc.repositories.FileRepository;

@RestController
@RequestMapping("/api/bon-de-commande")
@CrossOrigin(origins = "https://samsic.vercel.app")
public class FileController {
    private final FileRepository fileRepository;

    public FileController(FileRepository fileRepository) {
        this.fileRepository = fileRepository;
    }

    @GetMapping("/{numBc}/file")
    public ResponseEntity<Resource> getFileByBonDeCommandeId(@PathVariable String numBc) {
        File file = fileRepository.findByBonDeCommandeNumBc(numBc)
                .orElseThrow(() -> new IllegalArgumentException("File not found for BonDeCommande numBc: " + numBc));

        ByteArrayResource resource = new ByteArrayResource(file.getContent());
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(file.getContent().length)
                .body(resource);
    }
}