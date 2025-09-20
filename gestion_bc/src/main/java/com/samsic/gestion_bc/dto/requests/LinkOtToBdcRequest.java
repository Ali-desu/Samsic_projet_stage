package com.samsic.gestion_bc.dto.requests;

public class LinkOtToBdcRequest {
    private String numOt;
    private String numBc;

    public String getNumOt() {
        return numOt;
    }

    public void setNumOt(String numOt) {
        this.numOt = numOt;
    }

    public String getNumBc() {
        return numBc;
    }

    public void setNumBc(String numBc) {
        this.numBc = numBc;
    }
}
