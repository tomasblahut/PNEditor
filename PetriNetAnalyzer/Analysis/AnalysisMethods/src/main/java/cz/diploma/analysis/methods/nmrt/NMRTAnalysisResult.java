package cz.diploma.analysis.methods.nmrt;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;

/**
 *
 * @author Petr
 */
public class NMRTAnalysisResult extends NetAnalysisResult {
    
    private NMRTGraph graph;
    
    public NMRTAnalysisResult() {
        super(NetAnalysisMethod.NMRT);
    }

    public NMRTGraph getGraph() {
        return graph;
    }

    public void setGraph(NMRTGraph graph) {
        this.graph = graph;
    }
}
