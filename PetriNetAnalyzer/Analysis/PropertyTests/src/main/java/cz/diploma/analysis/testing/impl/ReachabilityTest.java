package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.nmrt.NMRTAnalysisResult;
import cz.diploma.analysis.methods.nmrt.NMRTGraph;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult;
import cz.diploma.analysis.testing.TestResultStatus;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.map.hash.TIntObjectHashMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 *
 * @author Petr
 */
public class ReachabilityTest extends NetPropertyTest {

    private Map<String, String> preferences;
    
    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.REACHABILITY;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyTestResult.NetPropertyResultBuilder builder) throws Exception {
        preferences = params.getPropertyPreferences(NetProperty.REACHABILITY.toString());
        
        TestResultStatus nmrtStatus = decideFromNMRT(params, builder);
        
        builder.setStatus(nmrtStatus);
    }
    
    /**
     * Tests the reachability results using the NMRT. The reason results are stored in the builder so it can be displayed in the editor.
     * 
     * @param params Property parameters.
     * @param builder Builder for storing property test results.
     * @return TestResultStatus.UNDECIDABLE if the reachability cannot be decided using NMRT. <br>
     *          TestResultStatus.PASS if the marking is reachable. <br>
     *          TestResultStatus.FAIL if the marking is not reachable.
     */
    private TestResultStatus decideFromNMRT (PropertyTestParams params, NetPropertyTestResult.NetPropertyResultBuilder builder) {
        TestResultStatus nmrtStatus = TestResultStatus.UNDECIDABLE;
        
        NMRTAnalysisResult nmrtAnalysisResult = (NMRTAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.NMRT);
        if (nmrtAnalysisResult != null) {
            if (nmrtAnalysisResult.hasErrors()) {
                builder.logError("NMRT analysis could not be performed");
            } else {
                NMRTGraph nmrt = nmrtAnalysisResult.getGraph();
                if (nmrt.isNetWDependent()) {
                    builder.addReason("NMRT analysis cannot be used, because the analyzed Petri net is ω-dependent. "
                            + "It is undecidable if a specified marking is reachable in Petri net based on NMRT");
                } else {
                    List<String> sortedIds = CollectionUtils.sortedList(preferences.keySet());
                    ArrayList<Integer> desiredMarking = new ArrayList<>();
                    for (String id : sortedIds) {
                        desiredMarking.add(Integer.parseInt(preferences.get(id)));
                    }
                    
                    Set<Place> places = params.getPetriNet().getPlaces();
                    
                    List<String> idsSortedByName = sortPlaceByName(places);
                    String marking = "(";
                    for (String id : idsSortedByName) {
                        marking = marking.concat(getPlaceName(places, id) + ": " + preferences.get(id) + ", ");
                    }
                    marking = marking.substring(0, marking.length() - 2).concat(")");
                    
                    if (isMarkingReachable(nmrt, desiredMarking)) {
                        nmrtStatus = TestResultStatus.PASS;
                        builder.addReason("The tested marking " + marking + " is reachable in this Petri net");
                    } else {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("The tested marking " + marking + " is not reachable in this Petri net");
                    }
                }
            }
        } else {
            builder.addReason("NMRT analysis results are unavailable.");
        }
        
        return nmrtStatus;
    }
    
    /**
     * Tests, if the desired marking is reachable in the Petri net. 
     * 
     * @param graph NMRT that contains all reachable markings.
     * @param desiredMarking ArrayList of integers, that represents the desired marking.
     * @return True, if the marking is reachable in the Petri net, otherwise false.
     */
    private boolean isMarkingReachable (NMRTGraph graph, ArrayList<Integer> desiredMarking) {
        for (int i : graph.getNodes().toArray()) {
            if (isDesiredMarkingReachableIn(desiredMarking, graph.getTokenStateOf(i), graph.getOmegaNumbersOf(i))) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Tests, if the desired marking is reachable in the marking specified by its token state and w-numbers.
     * 
     * @param desiredMarking ArrayList of integers, that represents the desired marking. This marking will be tested if it is reachable in the specified marking.
     * @param tokenState Array of integers that represents the token state of the specified marking. If the value equals -1, it means that the amount of tokens of matching 
     *                      place is represented by w-number.
     * @param omegaNumbers Map with integers as keys and w-numbers represented by an array of integers as values. 
     * @return True, if the desiredMarking is reachable, otherwise false.
     */
    private boolean isDesiredMarkingReachableIn (ArrayList<Integer> desiredMarking, int [] tokenState, TIntObjectHashMap<int []> omegaNumbers) {
        for (int i = 0; i < desiredMarking.size(); i++) {
            if (tokenState[i] != -1) {
                if (tokenState[i] != desiredMarking.get(i)) {
                    return false;
                }
            } else {
                if (!isNumberInOmega(omegaNumbers.get(i), desiredMarking.get(i))) {
                    return false;
                }
            }
        }
        return true;
    }
    
    /**
     * Tests, if the w-number contains the specified number.
     * 
     * @param omegaNumber Array of integers that represents the w-number.
     * @param number Integer to be tested if it is contained in the w-number.
     * @return True, if the number is contained in the w-number, otherwise false.
     */
    private boolean isNumberInOmega (int [] omegaNumber, int number) {
        int test = omegaNumber[0] * omegaNumber[1] + omegaNumber[2];
        while (test <= number) {
            if (test == number) {
                return true;
            }
            test += omegaNumber[0];
        }
        return false;
    }
    
    /**
     * Returns the name of the Place, specified by its ID.
     * 
     * @param places The set of places of the Petri net.
     * @param id Id of the Place to get the name of.
     * @return The name of the Place specified by the id as a String, or an empty String ("") if the Place is not found in the set of places.
     */
    private String getPlaceName (Set<Place> places, String id) {
        for (Place p : places) {
            if (p.getId().equals(id)){
                return p.getName();
            }
        }
        return "";
    }
    
    private List<String> sortPlaceByName (Set<Place> places) {
        List<Place> sorted = new ArrayList<Place>(places);
        Collections.sort(sorted, new Comparator<Place> () {
            @Override
            public int compare(Place p1, Place p2) {
                return p1.getName().compareTo(p2.getName());
            }
        }
        );
        List<String> idsByName = new ArrayList<>();
        for (Place p : sorted) {
            idsByName.add(p.getId());
        }
        return idsByName;
    }
}
