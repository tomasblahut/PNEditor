/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.diploma.server.analysis;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Map;
import java.util.Set;

/**
 *
 * @author Mamut
 */
public class AnalysisRequest {

    private PetriNet petriNet;
    private Set<String> propertiesToCheck;
    private Set<RequestAnalysisMethod> analysisMethods;
    private Map<String, String> reachabilityPreferences;

    public AnalysisRequest() {

    }

    public PetriNet getPetriNet() {
        return petriNet;
    }

    public void setPetriNet(PetriNet petriNet) {
        this.petriNet = petriNet;
    }

    public Set<String> getPropertiesToCheck() {
        return propertiesToCheck;
    }

    public void setPropertiesToCheck(Set<String> propertiesToCheck) {
        this.propertiesToCheck = propertiesToCheck;
    }

    public Set<RequestAnalysisMethod> getAnalysisMethods() {
        return analysisMethods;
    }

    public void setAnalysisMethods(Set<RequestAnalysisMethod> analysisMethods) {
        this.analysisMethods = analysisMethods;
    }

    public Map<String, String> getReachabilityPreferences() {
        return reachabilityPreferences;
    }

    public void setReachabilityPreferences(Map<String, String> reachabilityPreferences) {
        this.reachabilityPreferences = reachabilityPreferences;
    }
    
}
