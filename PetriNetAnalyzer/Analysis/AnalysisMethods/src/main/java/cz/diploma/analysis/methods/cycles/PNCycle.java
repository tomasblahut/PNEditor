package cz.diploma.analysis.methods.cycles;

import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class PNCycle {

    private final List<String> componentIds = new ArrayList<>();
    private final Set<Place> placeSupport = new HashSet<>();
    private final Set<Transition> transSupport = new HashSet<>();

    public List<String> getComponentIds() {
        return componentIds;
    }

    public Set<Place> getPlaceSupport() {
        return placeSupport;
    }

    public Set<Transition> getTransSupport() {
        return transSupport;
    }
}
