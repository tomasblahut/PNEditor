package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.classification.ClassificationAnalysisResult;
import cz.diploma.analysis.methods.classification.NetSubclass;
import cz.diploma.analysis.methods.cycles.CyclesAnalysisResult;
import cz.diploma.analysis.methods.cycles.PNCycle;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysisResult;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import java.util.HashSet;
import java.util.Set;

public class SafetyTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.SAFETY;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus ssStatus = decideFromSSGraph(params, builder);
        TestResultStatus classStatus = decideFromClassification(params, builder);

        builder.setStatus(TestResultStatus.logicalOr(ssStatus, classStatus));
    }

    private TestResultStatus decideFromSSGraph(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus ssStatus = TestResultStatus.UNDECIDABLE;

        StateSpaceAnalysisResult ssAnalysisResult = (StateSpaceAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.STATE_SPACE);
        if (ssAnalysisResult != null) {
            if (ssAnalysisResult.hasErrors()) {
                builder.logError("State space analysis could not be performed");
            } else {
                StateSpaceGraph ssGraph = ssAnalysisResult.getGraph();

                TIntList nodes = ssGraph.getNodes();
                TIntIterator iterator = nodes.iterator();

                boolean safe = true;
                while (iterator.hasNext()) {
                    int node = iterator.next();
                    boolean[] nodeOmega = ssGraph.getOmegaOf(node);
                    safe = nodeOmega == null;
                    if (safe) {
                        int[] nodeTokens = ssGraph.getStateOf(node);
                        for (int token : nodeTokens) {
                            safe = token <= 1;
                            if (!safe) {
                                break;
                            }
                        }
                    }

                    if (!safe) {
                        break;
                    }
                }

                ssStatus = safe ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String reason = safe ? "Number of tokens in each place at every reachable marking is less or equal to one. "
                        + "Petri net is safe"
                        : "There is at least one place which number of tokens is greater than one at some reachable markings. "
                        + "Petri net is unsafe";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("State space analysis results are unavailable");
        }

        return ssStatus;
    }

    private TestResultStatus decideFromClassification(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus classStatus = TestResultStatus.UNDECIDABLE;

        ClassificationAnalysisResult classAnalysisResult = (ClassificationAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.CLASSIFICATION);
        if (classAnalysisResult != null) {
            if (classAnalysisResult.hasErrors()) {
                builder.logError("Classification analysis could not be performed");
            } else {
                TestResultStatus stateMachineStatus = decideFromStateMachine(classAnalysisResult, params, builder);
                TestResultStatus markedGraphStatus = decideFromMarkedGraph(classAnalysisResult, params, builder);
                classStatus = TestResultStatus.logicalOr(stateMachineStatus, markedGraphStatus);
            }
        } else {
            builder.addReason("Classification analysis results are unavailable");
        }

        return classStatus;
    }

    private TestResultStatus decideFromStateMachine(ClassificationAnalysisResult classAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus stateMachineStatus = TestResultStatus.UNDECIDABLE;

        boolean isStateMachine = classAnalysisResult.isOfType(NetSubclass.STATE_MACHINE);
        String reason;

        if (isStateMachine) {
            PetriNet net = params.getPetriNet();
            int tokenSum = 0;
            for (Place place : net.getPlaces()) {
                tokenSum += place.getTokens();
            }

            stateMachineStatus = tokenSum <= 1 ? TestResultStatus.PASS : TestResultStatus.FAIL;
            reason = tokenSum <= 1 ? "Petri net is classified as State machine and sum of tokens of initial marking "
                    + "is lesser or equal to one. Petri net is safe"
                    : "Petri net is classified as State machine and sum of tokens of initial marking is greater than one."
                    + "Petri net is unsafe";
        } else {
            reason = "Petri net is not classified as State machine. Safety cannot be decided based on this classification";
        }
        builder.addReason(reason);

        return stateMachineStatus;
    }

    private TestResultStatus decideFromMarkedGraph(ClassificationAnalysisResult classAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus markedGraphStatus = TestResultStatus.UNDECIDABLE;

        boolean isMarkedGraph = classAnalysisResult.isOfType(NetSubclass.MARKED_GRAPH);
        String reason;

        if (isMarkedGraph) {
            CyclesAnalysisResult cyclesAnalysisResult = (CyclesAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.CYCLES);
            if (cyclesAnalysisResult != null) {
                Set<Place> cyclePlaces = new HashSet<>();
                boolean cycleInvalid = false;

                for (PNCycle cycle : cyclesAnalysisResult.getCycles()) {
                    int cycleTokens = 0;
                    for (Place place : cycle.getPlaceSupport()) {
                        cycleTokens += place.getTokens();
                    }

                    cycleInvalid = cycleTokens > 1;
                    cyclePlaces.addAll(cycle.getPlaceSupport());
                    if (cycleInvalid) {
                        break;
                    }
                }

                PetriNet net = params.getPetriNet();
                boolean condition = !cycleInvalid && cyclePlaces.size() == net.getPlaces().size();

                markedGraphStatus = condition ? TestResultStatus.PASS : TestResultStatus.UNDECIDABLE;
                reason = condition ? "Petri net is classified as Marked graph and each place belongs to place support of some cycle, whose sum of "
                        + "tokens is equal to one. Petri net is safe"
                        : "Although Petri net is classified as Marked graph, there is at least one place that doesn't belong to place support of any cycle, whose sum of "
                        + "tokens is equal to one. Safety cannot be decided with regards to this classification";
            } else {
                reason = "Although Petri net is classified as Marked graph, cycles analysis results are unavailable. "
                        + "Safety cannot be decided based on this classification";
            }
        } else {
            reason = "Petri net is not classified as Marked graph. Safety cannot be decided based on this classification";
        }
        builder.addReason(reason);

        return markedGraphStatus;
    }
}
