package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.classification.ClassificationAnalysisResult;
import cz.diploma.analysis.methods.classification.NetSubclass;
import cz.diploma.analysis.methods.invariant.InvariantAnalysisResult;
import cz.diploma.analysis.methods.invariant.PInvariant;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ConservativenessTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.CONSERVATIVENESS;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus invStatus = decideFromInvariants(params, builder);
        TestResultStatus classStatus = decideFromClassification(params, builder);

        builder.setStatus(TestResultStatus.logicalOr(invStatus, classStatus));
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

                boolean conservative = nonZeroPlaces.size() == params.getPetriNet().getPlaces().size();
                invStatus = conservative ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String reason = conservative ? "There is at least one P-invariant that covers entire set of petri net places. "
                        + "Petri net is conservative"
                        : "There is at least one place, that is not covered by any of computed P-invariants. "
                        + "Petri net is not conservative";
                builder.addReason(reason);
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
                String reason = isStateMachine ? "Petri net is classified as State machine, therefore it is conservative"
                        : "Petri net is not classified as State machine. Conservativeness cannot be decided based on this classification";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("Classification analysis results are unavailable");
        }

        return classStatus;
    }
}
