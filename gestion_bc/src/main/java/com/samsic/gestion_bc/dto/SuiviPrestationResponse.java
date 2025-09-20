package com.samsic.gestion_bc.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.Date;

@Data
public class SuiviPrestationResponse {
    private Integer id;
    private PrestationResponse prestation;
    private Integer coordinateurId;
    private ZoneResponse zone;
    private Double qteRealise;
    private Double qteEncours;
    private Double qteTech;
    private Double qteDepose;
    private Double qteADepose;
    private Double qteSys;
    private String fournisseur;
    private Date datePlanifiee;
    private LocalDate dateGo;
    private Date dateDebut;
    private Date dateFin;
    private Date dateRealisation;
    private String statutDeRealisation;
    private Date dateRecepTech;
    private String statutReceptionTech;
    private Date datePf;
    private Date dateRecepSys;
    private String statutReceptionSystem;
    private String remarque;
    private Integer delaiRecep;
    private String bc_num;
    private String site;
    private boolean isOt; //added
    private LocalDate dateEdition;
    private FileResponse fichierReceptionTech;
    private String error;

    @Data
    public static class FileResponse {
        private Long id;
        private String name;
        private String contentType;

        public FileResponse(Long id, String name, String contentType) {
            this.id = id;
            this.name = name;
            this.contentType = contentType;
        }
    }
}