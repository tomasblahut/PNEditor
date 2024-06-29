package cz.diploma.analysis.methods.statespace;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;

public class StateSpaceAnalysisResult extends NetAnalysisResult {

    private StateSpaceGraph graph;

    public StateSpaceAnalysisResult() {
        super(NetAnalysisMethod.STATE_SPACE);
    }

    public StateSpaceGraph getGraph() {
        return graph;
    }

    public void setGraph(StateSpaceGraph graph) {
        this.graph = graph;
    }
}
