package cz.diploma.analysis.methods.validation.conditions;

import cz.diploma.shared.graphs.petrinet.PetriNet;

public class NotNullCondition implements PetriNetCondition {

    @Override
    public boolean meetsCondition(PetriNet net) {
        return net != null;
    }

    @Override
    public String getErrorMessage() {
        return "Petri net cannot be null";
    }

}
