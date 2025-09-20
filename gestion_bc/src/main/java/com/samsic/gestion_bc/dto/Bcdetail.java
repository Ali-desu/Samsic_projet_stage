package com.samsic.gestion_bc.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
public class Bcdetail {
    private String numBc;
    private String divisionProjet;
    private String codeProjet;
    private Integer numLigne;
    private String dateEdition;
    private String descriptionPrestation;
    private String descriptionArticle;
    private Double qteBc;

    private Double realise;
    private Double enCours;
    private Double reliquat;

    private Double receptionTech;
    private Double deposeSys;
    private Double aDeposeSys;
    private Double receptionneSys;

    private Double montantHt;
    private Double montantCloture;
    private Double montantReceptionneTerrain;
    private Double montantEnCoursReceptionTech;
    private Double montantFactureSysteme;
    private Double montantDepose;
    private Double montantADeposer;


    private Double prixUnite;
    private String familleProjet;


    public Bcdetail(
            String numBc, String divisionProjet, String codeProjet, Integer numLigne,
            String dateEdition, String descriptionPrestation, String descriptionArticle,
            Double qteBc, Double realise, Double enCours, Double reliquat,
            Double receptionTech, Double deposeSys, Double aDeposeSys, Double receptionneSys,
            Double prixUnite, String familleProjet
    ) {
        this.numBc = numBc;
        this.divisionProjet = divisionProjet;
        this.codeProjet = codeProjet;
        this.numLigne = numLigne;
        this.dateEdition = dateEdition;
        this.descriptionPrestation = descriptionPrestation;
        this.descriptionArticle = descriptionArticle;
        this.qteBc = qteBc;
        this.realise = realise;
        this.enCours = enCours;
        this.reliquat = reliquat;
        this.receptionTech = receptionTech;
        this.deposeSys = deposeSys;
        this.aDeposeSys = aDeposeSys;
        this.receptionneSys = receptionneSys;
        this.prixUnite = prixUnite;
        this.familleProjet = familleProjet;

        // Derived fields
        this.montantHt = prixUnite * qteBc;
        this.montantCloture = prixUnite * realise;
        this.montantReceptionneTerrain = prixUnite * receptionTech;
        this.montantEnCoursReceptionTech = prixUnite * (realise - receptionTech);
        this.montantFactureSysteme = prixUnite * receptionneSys;
        this.montantDepose = prixUnite * deposeSys;
        this.montantADeposer = prixUnite * aDeposeSys;
    }

}
