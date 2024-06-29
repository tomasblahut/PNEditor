package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.nmrt.NMRTAnalysisResult;
import cz.diploma.analysis.methods.nmrt.NMRTGraph;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysisResult;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.set.TIntSet;

public class DeadlockFreeTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.DEADLOCK_FREE;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus ssStatus = decideFromSSGraph(params, builder);
        TestResultStatus livenessStatus = decideFromLiveness(params, builder);
        TestResultStatus nmrtStatus = decideFromNMRT(params, builder);

        builder.setStatus(TestResultStatus.logicalOr(ssStatus, ssStatus, livenessStatus));
        if (nmrtStatus != TestResultStatus.UNDECIDABLE) {
            builder.setStatus(nmrtStatus);
        }
    }
    
    /**
     * Decides whether the Petri net contains deadlock based on NMRT analysis.
     * 
     * @param params Property parameters.
     * @param builder Builder for storing property test results.
     * @return TestResultStatus.UNDECIDABLE if the existence of deadlock cannot be decided using NMRT. <br>
     *          TestResultStatus.FAIL if the Petri net contains deadlock. <br>
     *          TestResultStatus.PASS if the Petri net is deadlock free.
     */
    private TestResultStatus decideFromNMRT (PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus nmrtStatus = TestResultStatus.UNDECIDABLE;
        
        NMRTAnalysisResult nmrtAnalysisResult = (NMRTAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.NMRT);
        if (nmrtAnalysisResult != null) {
            if (nmrtAnalysisResult.hasErrors()) {
                builder.logError("NMRT analysis could not be performed");
            } else {
                NMRTGraph nmrt = nmrtAnalysisResult.getGraph();
                if (nmrt.isNetWDependent()) {
                    builder.addReason("NMRT analysis cannot be used, because the analyzed Petri net is ω-dependent. "
                            + "It is undecidable if a Petri net is deadlock free based on NMRT");
                } else {
                    if (nmrt.getNumberOfTerminalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one terminal node, so Petri net has deadlock");
                    }
                    if (nmrt.getNumberOfFullConditionalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one fully conditional node, so Petri net has deadlock");
                    }
                }
                if ((nmrtStatus == TestResultStatus.UNDECIDABLE) && (!nmrt.isNetWDependent())) {
                    nmrtStatus = TestResultStatus.PASS;
                    builder.addReason("NMRT contains no deadlocks. Petri net is deadlock free");
                }
            }
        } else {
            builder.addReason("NMRT analysis results are unavailable.");
        }
        
        return nmrtStatus;
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
                
                int lazyCoveringLevel = ssGraph.getLazyCoveringLevel();

                boolean containsDeadlock = false;
                while (iterator.hasNext()) {
                    int node = iterator.next();
                    TIntSet nodeSuccessors = ssGraph.getSuccessorsOf(node);
                    containsDeadlock = nodeSuccessors.isEmpty();
                    if (containsDeadlock) {
                        break;
                    }
                }

                ssStatus = containsDeadlock ? TestResultStatus.FAIL : TestResultStatus.PASS;
                String reason = containsDeadlock ? "State space graph contains nodes, that have no successors (leaf nodes). "
                        + "Petri net is not deadlock free (Lazy covering level used for this analysis: " + lazyCoveringLevel + ")"
                        : "Each node of state space graph has at least one successor. Petri net is deadlock free "
                        + "(Lazy covering level used for this analysis: " + lazyCoveringLevel + ")";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("State space analysis results are unavailable");
        }

        return ssStatus;
    }

    private TestResultStatus decideFromLiveness(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus livenessStatus = TestResultStatus.UNDECIDABLE;

        NetPropertyTestResult livenessResult = params.getPropertyResult(NetProperty.LIVENESS);
        if (livenessResult != null) {
            boolean live = TestResultStatus.PASS.equals(livenessResult.getStatus());
            livenessStatus = live ? TestResultStatus.FAIL : TestResultStatus.UNDECIDABLE;
            String reason = live ? "Petri net is live, therefore Petri net is deadlock free" : "Petri net is not live or the liveness test result status is undecidable. "
                    + "It is undecidable if a Petri net is deadlock free based on its liveness";
            builder.addReason(reason);
        } else {
            builder.addReason("Liveness test results are unavailable. Based on liveness, it is undecidable if a Petri net is deadlock free");
        }

        return livenessStatus;
    }
}
