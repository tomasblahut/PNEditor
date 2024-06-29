package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.classification.ClassificationAnalysisResult;
import cz.diploma.analysis.methods.classification.NetSubclass;
import cz.diploma.analysis.methods.invariant.InvariantAnalysisResult;
import cz.diploma.analysis.methods.invariant.PInvariant;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysisResult;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class BoundednessTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.BOUNDEDNESS;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus ssStatus = decideFromSSGraph(params, builder);
        TestResultStatus invStatus = decideFromInvariants(params, builder);
        TestResultStatus classStatus = decideFromClassification(params, builder);

        builder.setStatus(TestResultStatus.logicalOr(ssStatus, invStatus, classStatus));
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

                boolean bounded = true;
                while (iterator.hasNext()) {
                    int node = iterator.next();
                    boolean[] nodeOmega = ssGraph.getOmegaOf(node);
                    bounded = nodeOmega == null;
                    if (!bounded) {
                        break;
                    }
                }

                ssStatus = bounded ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String ssGraphReason = bounded ? "Number of tokens in each place is finite at every reachable marking. "
                        + "Petri net is bounded"
                        : "The number of tokens in some places of Petri net may grow to infinity. "
                        + "Petri net is unbounded";
                builder.addReason(ssGraphReason);
            }
        } else {
            builder.addReason("State space analysis results are unavailable");
        }

        return ssStatus;
    }

    private TestResultStatus decideFromInvariants(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus invStatus = TestResultStatus.UNDECIDABLE;

        InvariantAnalysisResult invAnalysisResult = (InvariantAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.INVARIANT);
        if (invAnalysisResult != null) {
            if (invAnalysisResult.hasErrors()) {
                builder.logError("Invariant analysis could not be performed");
            } else {
                List<PInvariant> pInvariants = invAnalysisResult.getpInvariants();

                Set<String> nonZeroPlaces = new HashSet();
                for (PInvariant inv : pInvariants) {
                    for (Map.Entry<String, Integer> invEntry : inv.getStruct().entrySet()) {
                        if (invEntry.getValue() > 0) {
                            nonZeroPlaces.add(invEntry.getKey());
                        }
                    }
                }

                boolean bounded = nonZeroPlaces.size() == params.getPetriNet().getPlaces().size();
                String invReason = bounded ? "There is at least one P-invariant that covers entire set of Petri net places. "
                        + "Assuming that initial marking is finite, petri net is bounded"
                        : "There is at least one place, that is not covered by any of computed P-invariants. "
                        + "Boundedness of net is not decidable based on P-invariants";
                builder.addReason(invReason);
            }
        } else {
            builder.addReason("Invariant analysis results are unavailable");
        }

        return invStatus;
    }

    private TestResultStatus decideFromClassification(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus classStatus = TestResultStatus.UNDECIDABLE;

        ClassificationAnalysisResult classAnalysisResult = (ClassificationAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.CLASSIFICATION);
        if (classAnalysisResult != null) {
            if (classAnalysisResult.hasErrors()) {
                builder.logError("Classification analysis could not be performed");
            } else {
                boolean isStateMachine = classAnalysisResult.isOfType(NetSubclass.STATE_MACHINE);
                classStatus = isStateMachine ? TestResultStatus.PASS : TestResultStatus.UNDECIDABLE;
                String reason = isStateMachine ? "Petri net is classified as State machine, therefore it is bounded"
                        : "Petri net is not classified as State machine. Boundedness cannot be decided based on this classification";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("Classification analysis results are unavailable");
        }

        return classStatus;
    }
}
