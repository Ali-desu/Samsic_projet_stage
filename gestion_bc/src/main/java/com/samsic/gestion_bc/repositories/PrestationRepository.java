package com.samsic.gestion_bc.repositories;

import com.samsic.gestion_bc.dto.TableauDeBordDTO;
import com.samsic.gestion_bc.models.Prestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrestationRepository extends JpaRepository<Prestation, String> {
    List<Prestation> findByBonDeCommandeNumBc(String numBc);

    @Query(value = """
        SELECT
            bc.num_bc AS numBc,
            ANY_VALUE(bc.division_projet) AS divisionProjet,
            ANY_VALUE(bc.code_projet) AS codeProjet,
            ANY_VALUE(p.num_ligne) AS numLigne,
            DATE_FORMAT(ANY_VALUE(bc.date_edition), '%Y-%m-%d') AS dateEdition,
            ANY_VALUE(bc.description) AS descriptionPrestation,
            s.description AS descriptionArticle,
            SUM(p.qte_bc) AS totalQteBc,
            SUM(CASE WHEN sp.statut_de_realisation = 'Realise' THEN sp.qte_realise * s.prix ELSE 0 END) AS realise,
            SUM(CASE WHEN sp.statut_de_realisation = 'En cours' THEN sp.qte_encours * s.prix ELSE 0 END) AS enCours,
            (SUM(p.qte_bc) -
             SUM(CASE WHEN sp.statut_de_realisation = 'Realise' THEN sp.qte_realise ELSE 0 END) -
             SUM(CASE WHEN sp.statut_de_realisation = 'En cours' THEN sp.qte_encours ELSE 0 END)) AS reliquat,
            SUM(CASE WHEN sp.statut_de_recep_tech = 'Receptionne' THEN sp.qte_tech * s.prix ELSE 0 END) AS receptionTech,
            SUM(CASE WHEN sp.statut_reception_system = 'Depose Sys' THEN sp.qte_depose * s.prix ELSE 0 END) AS deposeSys,
            SUM(CASE WHEN sp.statut_reception_system = 'A déposer Sys' THEN sp.qteadepose * s.prix ELSE 0 END) AS aDeposeSys,
            SUM(CASE WHEN sp.statut_reception_system = 'Receptionne Sys' THEN sp.qte_sys * s.prix ELSE 0 END) AS receptionneSys,
            ANY_VALUE(s.prix) AS prixUnite,
            ANY_VALUE(p.famille) AS familleProjet
        FROM prestations p
        LEFT JOIN suivi_prestation sp ON p.id = sp.prestation_id
        LEFT JOIN bon_de_commande bc ON p.bc_id = bc.num_bc
        LEFT JOIN services s ON p.service_id = s.id
        JOIN back_office bo ON bc.back_office_id = bo.id
        JOIN utilisateurs u ON bo.user_id = u.id
        WHERE u.email = :email
        GROUP BY bc.num_bc, s.description
    """, nativeQuery = true)
    List<Object[]> getReportPrestationRaw(@Param("email") String email);

    @Query(value = """
        SELECT
            bc.num_bc AS numBc,
            MAX(bc.division_projet) AS divisionProjet,
            MAX(bc.code_projet) AS codeProjet,
            MAX(bc.date_edition) AS dateEdition,
            MAX(fam.name) AS familleProjet,
            MAX(bc.description) AS descriptionPrestation,
            SUM(p.qte_bc * s.prix) AS montantHt,
            SUM(sp.qte_realise * s.prix) AS montantCloture,
            SUM(sp.qte_sys * s.prix) AS montantFactureSys,
            SUM(sp.qte_depose * s.prix) AS montantDepose,
            SUM(sp.qteadepose * s.prix) AS montantADeposer,
            SUM(sp.qte_tech * s.prix) AS TEC,
            CASE
                WHEN SUM(p.qte_bc * s.prix) > 0
                THEN ROUND(SUM(sp.qte_realise * s.prix) / SUM(p.qte_bc * s.prix), 4)
                ELSE 0
            END AS tauxRealisation
        FROM bon_de_commande bc
        JOIN prestations p ON p.bc_id = bc.num_bc
        LEFT JOIN suivi_prestation sp ON sp.prestation_id = p.id
        LEFT JOIN services s ON s.id = p.service_id
        LEFT JOIN familles fam ON fam.id = s.famille_id
        JOIN back_office bo ON bc.back_office_id = bo.id
        JOIN utilisateurs u ON bo.user_id = u.id
        WHERE u.email = :email
        GROUP BY bc.num_bc
    """, nativeQuery = true)
    List<Object[]> getBonDeCommandeSummaries(@Param("email") String email);

    @Query(value = """
        SELECT 
            f.name AS famille_name,
            COALESCE(SUM(p.qte_bc * s.prix), 0) AS montant_total_bc,
            COALESCE(SUM(CASE WHEN sp.statut_de_realisation = 'Realise' THEN sp.qte_realise * s.prix ELSE 0 END), 0) AS montant_cloture_terrain,
            COALESCE(SUM(CASE WHEN sp.statut_de_realisation = 'Realise' THEN sp.qte_realise * s.prix ELSE 0 END) / NULLIF(SUM(p.qte_bc * s.prix), 0), 0) AS taux_realisation,
            COALESCE(SUM(CASE WHEN sp.statut_reception_system = 'Receptionne Sys' THEN sp.qte_sys * s.prix ELSE 0 END), 0) AS montant_receptionne_facture,
            COALESCE(SUM(CASE WHEN sp.statut_reception_system = 'Depose Sys' THEN sp.qte_depose * s.prix ELSE 0 END), 0) AS montant_depose_sys,
            COALESCE(SUM(CASE WHEN sp.statut_reception_system = 'A déposer Sys' THEN sp.qteadepose * s.prix ELSE 0 END), 0) AS montant_a_deposer_sys,
            COALESCE(SUM(CASE WHEN sp.statut_de_recep_tech = 'En cours' THEN sp.qte_tech * s.prix ELSE 0 END), 0) AS montant_en_cours_recep_tech,
            COALESCE(SUM(CASE WHEN sp.statut_de_recep_tech = 'Réserve' THEN sp.qte_tech * s.prix ELSE 0 END), 0) AS montant_en_cours_recep_tech_reserve,
            COALESCE(SUM(p.qte_bc * s.prix) - SUM(CASE WHEN sp.statut_de_realisation = 'Realise' THEN sp.qte_realise * s.prix ELSE 0 END), 0) AS montant_restant_bc,
            COALESCE(SUM(CASE WHEN sp.statut_de_realisation = 'En cours' THEN sp.qte_encours * s.prix ELSE 0 END), 0) AS montant_travaux_en_cours
        FROM prestations p
        JOIN suivi_prestation sp ON p.id = sp.prestation_id
        JOIN bon_de_commande bdc ON p.bc_id = bdc.num_bc
        JOIN services s ON p.service_id = s.id
        JOIN familles f ON s.famille_id = f.id
        JOIN back_office bo ON bdc.back_office_id = bo.id
        JOIN utilisateurs u ON bo.user_id = u.id
        WHERE u.email = :email
        GROUP BY f.name
    """, nativeQuery = true)
    List<Object[]> getDashboardData(@Param("email") String email);
}