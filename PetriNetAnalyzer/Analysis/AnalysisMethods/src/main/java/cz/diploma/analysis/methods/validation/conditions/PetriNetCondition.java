package cz.diploma.analysis.methods.validation.conditions;

import cz.diploma.shared.graphs.petrinet.PetriNet;

public interface PetriNetCondition {

    public boolean meetsCondition(PetriNet net);

    public String getErrorMessage();
}
