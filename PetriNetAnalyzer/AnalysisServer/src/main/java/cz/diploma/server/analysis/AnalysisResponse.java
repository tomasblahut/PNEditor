package cz.diploma.server.analysis;

import cz.diploma.analysis.methods.NetAnalysisResult;
import cz.diploma.analysis.testing.NetPropertyTestResult;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class AnalysisResponse {

    private final List<NetPropertyTestResult> netProperties = new ArrayList<>();
    private final List<NetAnalysisResult> analysisResults = new ArrayList<>();

    public AnalysisResponse(Collection<NetPropertyTestResult> netProperties, Collection<NetAnalysisResult> analysisResults) {
        if (netProperties != null) {
            this.netProperties.addAll(netProperties);
        }

        if (analysisResults != null) {
            this.analysisResults.addAll(analysisResults);
        }
    }

    public List<NetPropertyTestResult> getNetProperties() {
        return netProperties;
    }

    public List<NetAnalysisResult> getAnalysisResults() {
        return analysisResults;
    }
}
