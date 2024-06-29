package cz.diploma.analysis.methods.classification;

import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import java.util.HashSet;
import java.util.Map;

public class MarkedGraphTest extends SubclassTest {

    private static final String PLACE_VIOLATIONS_KEY = "placeViolations";

    @Override
    public NetSubclass getNetSubclass() {
        return NetSubclass.MARKED_GRAPH;
    }

    @Override
    protected void doTestSubclass(SubclassResult result, PetriNet net, Map<NetSubclass, SubclassResult> results) {
        SubclassResult ordinaryResult = results.get(NetSubclass.ORDINARY);
        boolean isOrdinary = ordinaryResult != null && ordinaryResult.isMatches();

        if (!isOrdinary) {
            result.setMatches(false);
            result.setReason("Petri net is not ordinary");
        } else {
            HashSet<String> violations = new HashSet<>();
            for (Place place : net.getPlaces()) {
                Map<Transition, Arc> inputArcs = net.findConnectedTransitions(place, true);
                Map<Transition, Arc> outputArcs = net.findConnectedTransitions(place, false);

                if (inputArcs.size() != 1 || outputArcs.size() != 1) {
                    violations.add(place.getId());
                }
            }

            boolean matches = violations.isEmpty();
            String reason = matches ? "Each place has exactly one input and one output transition"
                    : "At least one place does not have exactly one input and one output transition";

            result.setMatches(matches);
            result.setReason(reason);
            if (!matches) {
                result.getAdditionalData().put(PLACE_VIOLATIONS_KEY, violations);
            }
        }
    }
}
