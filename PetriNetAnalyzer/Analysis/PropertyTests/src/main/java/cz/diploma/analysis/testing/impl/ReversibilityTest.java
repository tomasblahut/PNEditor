package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.nmrt.NMRTAnalysisResult;
import cz.diploma.analysis.methods.nmrt.NMRTGraph;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysisResult;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import cz.diploma.shared.graphs.algorithm.SCCDetector;
import gnu.trove.set.TIntSet;
import java.util.List;

public class ReversibilityTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.REVERSIBILITY;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus ssStatus = decideFromSSGraph(params, builder);
        TestResultStatus nmrtStatus = decideFromNMRT(params, builder);

        builder.setStatus(ssStatus);
        if (nmrtStatus == TestResultStatus.FAIL) {
            builder.setStatus(nmrtStatus);
        }
    }

    /**
     * Tries to decide whether the Petri net is reversible based on NMRT analysis. It can be decided that Petri net is not reversible if NMRT contains deadlock. 
     * Otherwise it is undecidable.
     * 
     * @param params Property parameters.
     * @param builder Builder for storing property test results.
     * @return TestResultStatus.UNDECIDABLE if the reversibility cannot be decided using NMRT. <br>
     *          TestResultStatus.FAIL if the Petri net is not reversible (NMRT contains deadlock).
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
                    builder.addReason("NMRT analysis cannot be used, because the analyzed Petri net is ω-dependent. Reversibility cannot be decided based on NMRT");
                } else {
                    if (nmrt.getNumberOfTerminalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one terminal node, so Petri net has deadlock. Petri net is not reversible");
                    }
                    if (nmrt.getNumberOfFullConditionalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one fully conditional node, so Petri net has deadlock. Petri net is not reversible");
                    }
                }
                if ((nmrtStatus == TestResultStatus.UNDECIDABLE) && (!nmrt.isNetWDependent())) {
                    builder.addReason("Petri net is deadlock free. Reversibility cannot be decided based on NMRT");
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
                SCCDetector sccDetector = new SCCDetector(ssGraph);
                List<TIntSet> scComponents = sccDetector.findSCC();
                boolean reversible = scComponents.size() == 1;
                
                int lazyCoveringLevel = ssGraph.getLazyCoveringLevel();

                ssStatus = reversible ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String reason = reversible ? "State space graph of analyzed net is strongly connected, meaning that initial marking is reachable from every reachable marking. "
                        + "Petri net is reversible (Lazy covering level used for this analysis: " + lazyCoveringLevel + ")" 
                        : "State space graph of analyzed net contains more than one final strongly connected component. Initial marking is not reachable "
                        + "from every reachable marking. Petri net is not reversible (Lazy covering level used for this analysis: " + lazyCoveringLevel + ")";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("State space analysis results are unavailable");
        }

        return ssStatus;
    }
}
