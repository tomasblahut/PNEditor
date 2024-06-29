package cz.diploma.analysis.methods.trapcotrap;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.TransitionRequiredCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class TrapCotrapAnalysis extends NetAnalysis<TrapCotrapAnalysisResult> {

    private final PetriNetValidator trapCotrapValidator = new PetriNetValidator() {

        @Override
        protected ConditionConnector getConnector() {
            return ConditionConnector.AND;
        }

        @Override
        protected Set<PetriNetCondition> getCheckedConditions() {
            Set<PetriNetCondition> conditions = new HashSet<>();
            conditions.add(new TransitionRequiredCondition());
            return conditions;
        }
    };

    @Override
    protected Class<TrapCotrapAnalysisResult> getResultClass() {
        return TrapCotrapAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return trapCotrapValidator;
    }

    @Override
    protected void doPerformAnalysis(TrapCotrapAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        TrapCotrapCalculator dtCalc = new TrapCotrapCalculator(net);
        dtCalc.initFormulas();

        List<PlaceSubset> cotraps = dtCalc.calculateCotraps();
        if (cotraps != null) {
            result.getCotraps().addAll(cotraps);
        }

        List<PlaceSubset> traps = dtCalc.calcuateTraps();
        if (traps != null) {
            result.getTraps().addAll(traps);
        }
    }
}
