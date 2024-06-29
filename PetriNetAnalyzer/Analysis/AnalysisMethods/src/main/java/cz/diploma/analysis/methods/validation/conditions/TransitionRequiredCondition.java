package cz.diploma.analysis.methods.validation.conditions;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Set;

public class TransitionRequiredCondition extends NotNullCondition {

    @Override
    public boolean meetsCondition(PetriNet net) {
        boolean isNotNull = super.meetsCondition(net);
        boolean hasTransitions = false;

        if (isNotNull) {
            Set transitions = net.getTransitions();
            hasTransitions = transitions != null && !transitions.isEmpty();
        }

        return hasTransitions;
    }

    @Override
    public String getErrorMessage() {
        return "Petri net does not have any transitions";
    }

}
