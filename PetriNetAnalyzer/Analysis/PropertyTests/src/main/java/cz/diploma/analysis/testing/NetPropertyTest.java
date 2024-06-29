package cz.diploma.analysis.testing;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public abstract class NetPropertyTest {

    private final Logger log = Logger.getLogger(getClass().getName());

    //--
    protected class PropertyTestParams {

        final Map<NetProperty, NetPropertyTestResult> propertyResults;
        final Map<NetAnalysisMethod, NetAnalysisResult> analysisResults;
        final PetriNet petriNet;
        final Map<String, Map<String, String>> propertyPreferences;

        public PropertyTestParams(Map<NetProperty, NetPropertyTestResult> propertyResults, Map<NetAnalysisMethod, NetAnalysisResult> analysisResults,
               PetriNet petriNet, Map<String, Map<String, String>> propertyPreferences) {
            this.propertyResults = propertyResults;
            this.analysisResults = analysisResults;
            this.petriNet = petriNet;
            this.propertyPreferences = propertyPreferences;
        }

        public NetPropertyTestResult getPropertyResult(NetProperty property) {
            return propertyResults != null ? propertyResults.get(property) : null;
        }

        public NetAnalysisResult getAnalysisResult(NetAnalysisMethod method) {
            return analysisResults != null ? analysisResults.get(method) : null;
        }

        public PetriNet getPetriNet() {
            return petriNet;
        }
        
        public Map<String, String> getPropertyPreferences (String property) {
            return propertyPreferences != null ? propertyPreferences.get(property) : null;
        }
    }

    public NetPropertyTestResult testProperty(Map<NetProperty, NetPropertyTestResult> propertyResults,
            Map<NetAnalysisMethod, NetAnalysisResult> analysisResults, PetriNet petriNet, Map<String, Map<String, String>> propertyPreferences) {

        NetPropertyResultBuilder builder = new NetPropertyResultBuilder(getTestedProperty());
        try {
            PropertyTestParams params = new PropertyTestParams(propertyResults, analysisResults, petriNet, propertyPreferences);
            doTestProperty(params, builder);
        } catch (Exception ex) {
            String message = "An error has occured while testing this property. For detail information see server log output.";
            builder.logError(message);

            log.log(Level.SEVERE, "Error while testing property", ex);
        }
        return builder.result();
    }

    protected abstract NetProperty getTestedProperty();

    protected abstract void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception;
}
