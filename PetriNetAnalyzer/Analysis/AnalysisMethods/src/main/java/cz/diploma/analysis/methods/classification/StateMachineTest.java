package cz.diploma.analysis.methods.classification;

import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import java.util.HashSet;
import java.util.Map;

public class StateMachineTest extends SubclassTest {

    private static final String TRANSITION_VIOLATIONS_KEY = "transitionViolations";

    @Override
    public NetSubclass getNetSubclass() {
        return NetSubclass.STATE_MACHINE;
    }

    @Override
    public void doTestSubclass(SubclassResult result, PetriNet net, Map<NetSubclass, SubclassResult> results) {
        SubclassResult ordinaryResult = results.get(NetSubclass.ORDINARY);
        boolean isOrdinary = ordinaryResult != null && ordinaryResult.isMatches();

        if (!isOrdinary) {
            result.setMatches(false);
            result.setReason("Petri net is not ordinary");
        } else {
            HashSet<String> violations = new HashSet<>();
            for (Transition transition : net.getTransitions()) {
                Map<Place, Arc> inputArcs = net.findConnectedPlaces(transition, true);
                Map<Place, Arc> outputArcs = net.findConnectedPlaces(transition, false);

                if (inputArcs.size() != 1 || outputArcs.size() != 1) {
                    violations.add(transition.getId());
                }
            }

            boolean matches = violations.isEmpty();
            String reason = matches ? "Each transition has exactly one input and one output place"
                    : "At least one transition does not have exactly one input and one output place";

            result.setMatches(matches);
            result.setReason(reason);
            if (!matches) {
                result.getAdditionalData().put(TRANSITION_VIOLATIONS_KEY, violations);
            }
        }
    }
}
