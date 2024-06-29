package cz.diploma.analysis.methods.statespace;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.PlaceRequiredCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class StateSpaceAnalysis extends NetAnalysis<StateSpaceAnalysisResult> {

    PetriNetValidator ssValidator = new PetriNetValidator() {

        @Override
        protected ConditionConnector getConnector() {
            return ConditionConnector.AND;
        }

        @Override
        protected Set<PetriNetCondition> getCheckedConditions() {
            Set<PetriNetCondition> conditions = new HashSet<>();
            conditions.add(new PlaceRequiredCondition());
            return conditions;
        }
    };

    @Override
    protected Class<StateSpaceAnalysisResult> getResultClass() {
        return StateSpaceAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return ssValidator;
    }

    @Override
    protected void doPerformAnalysis(StateSpaceAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        StateSpaceConstructor nSSConstructor = new StateSpaceConstructorBuilder(net).usingSettings(settings).get();
        StateSpaceGraph nSSGraph = nSSConstructor.construct();
        nSSGraph.transformToGraph();
        result.setGraph(nSSGraph);
    }
}
