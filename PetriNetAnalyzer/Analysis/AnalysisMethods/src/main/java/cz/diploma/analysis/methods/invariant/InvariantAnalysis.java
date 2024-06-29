package cz.diploma.analysis.methods.invariant;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.PlaceRequiredCondition;
import cz.diploma.analysis.methods.validation.conditions.TransitionRequiredCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class InvariantAnalysis extends NetAnalysis<InvariantAnalysisResult> {

    private final PetriNetValidator invValidator = new PetriNetValidator() {

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
    protected Class<InvariantAnalysisResult> getResultClass() {
        return InvariantAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return invValidator;
    }

    @Override
    protected void doPerformAnalysis(InvariantAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        InvariantCalculator invCalc = new InvariantCalculator(net);

        List<PInvariant> pInvs = invCalc.calculatePInvariants();
        if (pInvs != null) {
            result.getpInvariants().addAll(pInvs);
        }

        List<TInvariant> tInvs = invCalc.calculateTInvariants();
        if (tInvs != null) {
            result.gettInvariants().addAll(tInvs);
        }
    }
}
