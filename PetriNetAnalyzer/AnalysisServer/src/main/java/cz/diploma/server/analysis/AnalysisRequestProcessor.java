package cz.diploma.server.analysis;

import cz.diploma.analysis.methods.NetAnalysis;
import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import cz.diploma.analysis.methods.classification.ClassificationAnalysis;
import cz.diploma.analysis.methods.cycles.CyclesAnalysis;
import cz.diploma.analysis.methods.trapcotrap.TrapCotrapAnalysis;
import cz.diploma.analysis.methods.invariant.InvariantAnalysis;
import cz.diploma.analysis.methods.nmrt.NewModifiedReachabilityTreeAnalysis;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysis;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult;
import cz.diploma.analysis.testing.impl.BoundednessTest;
import cz.diploma.analysis.testing.impl.ConservativenessTest;
import cz.diploma.analysis.testing.impl.DeadlockFreeTest;
import cz.diploma.analysis.testing.impl.LivenessTest;
import cz.diploma.analysis.testing.impl.ReachabilityTest;
import cz.diploma.analysis.testing.impl.RepetitivenessTest;
import cz.diploma.analysis.testing.impl.ReversibilityTest;
import cz.diploma.analysis.testing.impl.SafetyTest;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Level;
import java.util.logging.Logger;

public class AnalysisRequestProcessor {

    private static final Map<NetAnalysisMethod, NetAnalysis> analysisCalculators = new HashMap<>();
    private static final Map<NetProperty, NetPropertyTest> propertyTests = new HashMap<>();

    static {
        analysisCalculators.put(NetAnalysisMethod.CLASSIFICATION, new ClassificationAnalysis());
        analysisCalculators.put(NetAnalysisMethod.STATE_SPACE, new StateSpaceAnalysis());
        analysisCalculators.put(NetAnalysisMethod.INVARIANT, new InvariantAnalysis());
        analysisCalculators.put(NetAnalysisMethod.TRAP_COTRAP, new TrapCotrapAnalysis());
        analysisCalculators.put(NetAnalysisMethod.CYCLES, new CyclesAnalysis());
        analysisCalculators.put(NetAnalysisMethod.NMRT, new NewModifiedReachabilityTreeAnalysis());

        propertyTests.put(NetProperty.BOUNDEDNESS, new BoundednessTest());
        propertyTests.put(NetProperty.CONSERVATIVENESS, new ConservativenessTest());
        propertyTests.put(NetProperty.LIVENESS, new LivenessTest());
        propertyTests.put(NetProperty.REPETITIVENESS, new RepetitivenessTest());
        propertyTests.put(NetProperty.REVERSIBILITY, new ReversibilityTest());
        propertyTests.put(NetProperty.SAFETY, new SafetyTest());
        propertyTests.put(NetProperty.DEADLOCK_FREE, new DeadlockFreeTest());
        propertyTests.put(NetProperty.REACHABILITY, new ReachabilityTest());
    }
    //--
    private final Logger log = Logger.getLogger(getClass().getName());
    private final AnalysisRequest request;

    public AnalysisRequestProcessor(AnalysisRequest request) throws Exception {
        if (request == null) {
            throw new NullPointerException("Invalid request NULL");
        }
        this.request = request;
    }

    public AnalysisResponse processRequest() {
        Map<NetAnalysisMethod, NetAnalysisResult> analysisResults = calculateAnalysisResults();
        Map<NetProperty, NetPropertyTestResult> testResults = testNetProperties(analysisResults);
        analysisResults.remove(NetAnalysisMethod.NMRT);
        return new AnalysisResponse(testResults.values(), analysisResults.values());
    }

    private Map<NetAnalysisMethod, NetAnalysisResult> calculateAnalysisResults() {
        Map<NetAnalysisMethod, NetAnalysisResult> results = new LinkedHashMap<>();

        Set<RequestAnalysisMethod> requestedMethods = request.getAnalysisMethods();
        for (RequestAnalysisMethod requestedMethod : requestedMethods) {
            try {
                String methodStr = requestedMethod.getType();
                NetAnalysisMethod method = NetAnalysisMethod.parse(methodStr);
                
                if (method == null) {
                    throw new Exception("Unknown analysis method: " + methodStr);
                }

                NetAnalysis calculator = analysisCalculators.get(method);
                if (calculator == null) {
                    throw new Exception("No calculator implemented for method: " + methodStr);
                }

                NetAnalysisResult analysisResult = calculator.performAnalysis(request.getPetriNet(), requestedMethod.getPreferences());
                results.put(method, analysisResult);
            } catch (Exception ex) {
                log.log(Level.SEVERE, "Error while calculating analysis", ex);
            }
        }

        return results;
    }

    private Map<NetProperty, NetPropertyTestResult> testNetProperties(Map<NetAnalysisMethod, NetAnalysisResult> analysisResults) {
        Map<NetProperty, NetPropertyTestResult> results = new LinkedHashMap<>();
        
        Map<String, Map<String, String>> propertyPreferences = new HashMap<String, Map<String, String>>();
        propertyPreferences.put(NetProperty.REACHABILITY.toString(), request.getReachabilityPreferences());

        List<NetProperty> testedProperties = identifyTestedProperties(request.getPropertiesToCheck());
        for (NetProperty testedProperty : testedProperties) {
            try {
                NetPropertyTest propertyTest = propertyTests.get(testedProperty);
                if (propertyTest == null) {
                    throw new Exception("No test implemented for property: " + testedProperty);
                }

                NetPropertyTestResult testResult = propertyTest.testProperty(results, analysisResults, request.getPetriNet(), propertyPreferences);
                results.put(testedProperty, testResult);
            } catch (Exception ex) {
                log.log(Level.SEVERE, "Error while testing net properties", ex);
            }
        }

        return results;
    }

    private List<NetProperty> identifyTestedProperties(Collection<String> propIds) {
        List<NetProperty> netProperties = new ArrayList<>();

        for (String propId : propIds) {
            NetProperty property = NetProperty.parse(propId);
            if (property == null) {
                log.log(Level.SEVERE, "Error while testing net properties", new Exception("Unknown net property: " + propId));
            } else {
                netProperties.add(property);
            }
        }

        return CollectionUtils.sortedList(netProperties, NetProperty.priorityComparator);
    }
}
