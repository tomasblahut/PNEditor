package cz.diploma.analysis.methods.cycles;

import com.google.common.collect.BiMap;
import com.google.common.collect.HashBiMap;
import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.PlaceRequiredCondition;
import cz.diploma.analysis.methods.validation.conditions.TransitionRequiredCondition;
import cz.diploma.shared.graphs.DirectedGraph;
import cz.diploma.shared.graphs.algorithm.ECDetector;
import cz.diploma.shared.graphs.conversion.PetriNetToDirectedGraph;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.list.TIntList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CyclesAnalysis extends NetAnalysis<CyclesAnalysisResult> {

    private final PetriNetValidator cyclesValidator = new PetriNetValidator() {

        @Override
        protected ConditionConnector getConnector() {
            return ConditionConnector.AND;
        }

        @Override
        protected Set<PetriNetCondition> getCheckedConditions() {
            Set<PetriNetCondition> conditions = new HashSet<>();
            conditions.add(new PlaceRequiredCondition());
            conditions.add(new TransitionRequiredCondition());
            return conditions;
        }
    };

    @Override
    protected Class<CyclesAnalysisResult> getResultClass() {
        return CyclesAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return cyclesValidator;
    }

    @Override
    protected void doPerformAnalysis(CyclesAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        BiMap<String, Integer> netMapping = mapPetriNet(net);

        DirectedGraph graph = PetriNetToDirectedGraph.convert(net, netMapping);
        ECDetector ecDetector = new ECDetector(graph);
        List<TIntList> cycles = ecDetector.findCycles();

        Map<String, Place> placeIdMap = CollectionUtils.mapById(net.getPlaces());
        Map<String, Transition> transIdMap = CollectionUtils.mapById(net.getTransitions());
        Map<Integer, String> invertedMapping = netMapping.inverse();

        result.getPlacesNotCovered().addAll(placeIdMap.keySet());
        result.getTransitionsNotCovered().addAll(transIdMap.keySet());

        for (TIntList cycle : cycles) {
            PNCycle pnCycle = new PNCycle();

            for (int index = 0; index < cycle.size() - 1; index++) {
                int cycleComponent = cycle.get(index);
                String netComponent = invertedMapping.get(cycleComponent);

                pnCycle.getComponentIds().add(netComponent);
                Place place = placeIdMap.get(netComponent);
                if (place == null) {
                    Transition trans = transIdMap.get(netComponent);
                    result.getTransitionsNotCovered().remove(trans.getId());
                    pnCycle.getTransSupport().add(trans);
                } else {
                    result.getPlacesNotCovered().remove(place.getId());
                    pnCycle.getPlaceSupport().add(place);
                }
            }

            result.getCycles().add(pnCycle);
        }
    }

    private BiMap<String, Integer> mapPetriNet(PetriNet net) {
        BiMap<String, Integer> netMapping = HashBiMap.create();
        for (Place place : net.getPlaces()) {
            int id = netMapping.size() + 1;
            netMapping.put(place.getId(), id);
        }

        for (Transition trans : net.getTransitions()) {
            int id = netMapping.size() + 1;
            netMapping.put(trans.getId(), id);
        }
        return netMapping;
    }
}
