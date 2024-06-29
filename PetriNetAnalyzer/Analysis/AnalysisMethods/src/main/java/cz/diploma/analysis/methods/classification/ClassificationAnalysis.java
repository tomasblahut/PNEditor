package cz.diploma.analysis.methods.classification;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.validation.ConditionConnector;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.analysis.methods.validation.conditions.PlaceRequiredCondition;
import cz.diploma.analysis.methods.validation.conditions.TransitionRequiredCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ClassificationAnalysis extends NetAnalysis<ClassificationAnalysisResult> {

    private final PetriNetValidator classificationValidator = new PetriNetValidator() {

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
    //--
    private final Map<NetSubclass, SubclassTest> subclassTests = new HashMap<>();

    public ClassificationAnalysis() {
        subclassTests.put(NetSubclass.ORDINARY, new OrdinaryTest());
        subclassTests.put(NetSubclass.STATE_MACHINE, new StateMachineTest());
        subclassTests.put(NetSubclass.MARKED_GRAPH, new MarkedGraphTest());
        subclassTests.put(NetSubclass.FREE_CHOICE, new FreeChoiceTest());
    }

    @Override
    protected Class<ClassificationAnalysisResult> getResultClass() {
        return ClassificationAnalysisResult.class;
    }

    @Override
    protected PetriNetValidator getNetValidator() {
        return classificationValidator;
    }

    @Override
    protected void doPerformAnalysis(ClassificationAnalysisResult result, PetriNet net, Map<String, String> settings) throws Exception {
        Map<NetSubclass, SubclassResult> subclassResults = new LinkedHashMap<>();

        List<NetSubclass> subclasses = CollectionUtils.sortedList(Arrays.asList(NetSubclass.values()), NetSubclass.priorityComparator);
        for (NetSubclass subclass : subclasses) {
            SubclassTest test = subclassTests.get(subclass);
            if (test == null) {
                throw new Exception("Testing for subclass " + subclass + " is not implemented");
            }

            SubclassResult subclassResult = test.testSubclass(net, subclassResults);
            subclassResults.put(subclass, subclassResult);
        }

        result.getSubclassResults().addAll(subclassResults.values());
    }

}
