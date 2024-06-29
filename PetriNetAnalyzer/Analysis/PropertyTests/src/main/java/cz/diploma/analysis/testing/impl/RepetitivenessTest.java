/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.invariant.Invariant;
import cz.diploma.analysis.methods.invariant.InvariantAnalysisResult;
import cz.diploma.analysis.methods.invariant.TInvariant;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 *
 * @author Mamut
 */
public class RepetitivenessTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.REPETITIVENESS;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus invStatus = decideFromInvariants(params, builder);

        builder.setStatus(invStatus);
    }

    private TestResultStatus decideFromInvariants(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus invStatus = TestResultStatus.UNDECIDABLE;

        InvariantAnalysisResult invAnalysisResult = (InvariantAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.INVARIANT);
        if (invAnalysisResult != null) {
            if (invAnalysisResult.hasErrors()) {
                builder.logError("Invariant analysis could not be performed");
            } else {
                List<TInvariant> tInvariants = invAnalysisResult.gettInvariants();

                Set<String> nonZeroTransitions = new HashSet();
                for (Invariant inv : tInvariants) {
                    for (Map.Entry<String, Integer> invEntry : inv.getStruct().entrySet()) {
                        if (invEntry.getValue() > 0) {
                            nonZeroTransitions.add(invEntry.getKey());
                        }
                    }
                }

                boolean matches = nonZeroTransitions.size() == params.getPetriNet().getTransitions().size();
                invStatus = matches ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String reason = matches ? "There is at least one T-invariant that covers entire set of petri net transitions. "
                        + "Petri net is repetitive"
                        : "There is at least one transition, that is not covered by any of computed T-invariants. "
                        + "Petri net is not repetitive";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("Invariant analysis results are unavailable");
        }

        return invStatus;
    }
}
