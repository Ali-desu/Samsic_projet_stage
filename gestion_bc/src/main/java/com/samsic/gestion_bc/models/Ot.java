package com.samsic.gestion_bc.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ot")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ot {
    @Id
    @Column(name = "num_ot")
    private String numOt;

    private String divisionProjet;

    private String codeProjet;

    @OneToOne(cascade = CascadeType.MERGE)
    @JoinColumn(name = "zone_id")
    private Zone zone;

    private LocalDate dateGo;

    @ManyToOne(cascade = CascadeType.MERGE)
    @JoinColumn(name="codesite_id")
    private Site codeSite;

    @OneToOne
    @JoinColumn(name="back_office_id")
    private BackOffice backOffice;

    @OneToMany(mappedBy = "ot", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OtPrestation> prestations = new ArrayList<>();
}
