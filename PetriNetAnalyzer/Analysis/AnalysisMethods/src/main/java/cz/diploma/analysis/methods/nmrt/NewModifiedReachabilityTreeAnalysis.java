package cz.diploma.analysis.methods.nmrt;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.PlaceRequiredCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 *
 * @author Petr
 */
public class NewModifiedReachabilityTreeAnalysis extends NetAnalysis<NMRTAnalysisResult> {

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
    protected Class<NMRTAnalysisResult> getResultClass() {
        return NMRTAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return ssValidator;
    }

    /**
     * This function constructs the New Modified Reachability Tree that can be later used for Petri net analysis.
     * 
     * @param result Result of the analysis.
     * @param net Petri net that will be analyzed.
     * @param settings Map of settings for the analysis.
     * @throws Exception 
     */
    @Override
    protected void doPerformAnalysis(NMRTAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        NMRTConstructor constructor = new NMRTConstructor(net);
        NMRTGraph graph = constructor.construct();
        result.setGraph(graph);
    }
    
}
