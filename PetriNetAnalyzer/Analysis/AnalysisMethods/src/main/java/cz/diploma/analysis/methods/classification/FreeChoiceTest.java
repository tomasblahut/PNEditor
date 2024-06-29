package cz.diploma.analysis.methods.classification;

import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class FreeChoiceTest extends SubclassTest {

    private static final String TRANSITION_VIOLATIONS_KEY = "transitionViolations";

    @Override
    public NetSubclass getNetSubclass() {
        return NetSubclass.FREE_CHOICE;
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

            for (Transition transition : net.getTransitions()) {
                Map<Place, Arc> inputPlaces = net.findConnectedPlaces(transition, true);
                if (inputPlaces.size() <= 1) {
                    continue;
                }

                Set<String> transIds = new HashSet<>();
                for (Place place : inputPlaces.keySet()) {
                    Map<Transition, Arc> outputTransitions = net.findConnectedTransitions(place, false);
                    Set<String> outputTransIds = CollectionUtils.exthractIds(outputTransitions.keySet());

                    if (transIds.isEmpty()) {
                        transIds.addAll(outputTransIds);
                    } else {
                        if (!outputTransIds.equals(transIds)) {
                            violations.add(transition.getId());
                            break;
                        }
                    }
                }
            }

            boolean matches = violations.isEmpty();
            String reason = matches ? "Every input place of each transition has the same set of output transitions"
                    : "There is at least one transition, which input places does not have the same set of output transitions";

            result.setMatches(matches);
            result.setReason(reason);
            if (!matches) {
                result.getAdditionalData().put(TRANSITION_VIOLATIONS_KEY, violations);
            }
        }
    }
}
