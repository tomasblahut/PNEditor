package cz.diploma.analysis.methods.validation.conditions;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Set;

public class PlaceRequiredCondition extends NotNullCondition {

    @Override
    public boolean meetsCondition(PetriNet net) {
        boolean isNotNull = super.meetsCondition(net);
        boolean hasPlaces = false;

        if (isNotNull) {
            Set places = net.getPlaces();
            hasPlaces = places != null && !places.isEmpty();
        }

        return hasPlaces;
    }

    @Override
    public String getErrorMessage() {
        return "Petri net does not have any places";
    }
}
