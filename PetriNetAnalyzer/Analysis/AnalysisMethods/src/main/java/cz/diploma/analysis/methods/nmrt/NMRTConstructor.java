package cz.diploma.analysis.methods.nmrt;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.interfaces.HasId;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import gnu.trove.stack.array.TIntArrayStack;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

/**
 *
 * @author Petr
 */
public class NMRTConstructor {
    private final PetriNet petriNet;
    private final Map<String, Integer> netObjectIdIndex = new HashMap<>();
    private final Table<Transition, Boolean, Map<Place, Arc>> transitionConnections = HashBasedTable.create();
    private final int placeCount;

    private final TIntSet visitedStateHashes = new TIntHashSet(); 
    private final TIntObjectHashMap<int []> computedOmegaMarkings = new TIntObjectHashMap<>();
    private final TIntObjectHashMap<TIntObjectHashMap<int []>> computedOmegaNumbers = new TIntObjectHashMap<>();
    private final TIntSet visitedOmegaDupliciteHashes = new TIntHashSet();
    private final TIntObjectHashMap<List<Transition>> enabledTransitionsCache = new TIntObjectHashMap<>();
    private final TIntObjectHashMap<List<Transition>> conditionallyEnabledTransitionsCache = new TIntObjectHashMap<>(); 

    private final TIntArrayStack markingStack = new TIntArrayStack();
    private final NMRTGraph graph;

    public NMRTConstructor(PetriNet petriNet) {
        this.petriNet = petriNet;
        
        int netObjIndex = 0;
        Set<String> placeIds = CollectionUtils.exthractIds(petriNet.getPlaces());
        for (String placeId : CollectionUtils.sortedList(placeIds)) {
            netObjectIdIndex.put(placeId, netObjIndex++);
        }
        placeCount = placeIds.size();

        netObjIndex = 0;
        for (Transition trans : CollectionUtils.sortedList(petriNet.getTransitions(), HasId.idComparator)) {
            netObjectIdIndex.put(trans.getId(), netObjIndex++);

            Map<Place, Arc> inConnections = petriNet.findConnectedPlaces(trans, true);
            transitionConnections.put(trans, Boolean.TRUE, inConnections);

            Map<Place, Arc> outConnections = petriNet.findConnectedPlaces(trans, false);
            transitionConnections.put(trans, Boolean.FALSE, outConnections);
        }

        graph = new NMRTGraph();
        createInitMarking();
        
    }
    
    /**
     * Creates the initial marking of the NMRT. The initial marking is obtained from the analyzed Petri net.
     */
    private void createInitMarking () {
        Map<String, Place> placeIdMap = CollectionUtils.mapById(petriNet.getPlaces());

        int[] initState = new int[placeIdMap.size()];
        for (Place place : placeIdMap.values()) {
            int index = netObjectIdIndex.get(place.getId());
            initState[index] = place.getTokens();
        }

        int stateHash = calculateStateHash(initState, null);
        int initialMarking = graph.createNode(initState, null, stateHash);
        visitedStateHashes.add(stateHash);
    }
    
    /**
     * This method constructs the NMRT. It uses stack of markings and runs while the stack is not empty. <br>
     * It finds all enabled and conditionally enabled transitions for every reachable marking and computes the next-state function 
     * (new marking resulting from firing some transitioon) for all of those transitions. <br><br>
     * 
     * For every new marking is computed a hashcode. This hashcode is used for detecting duplicate transitions. 
     * 
     * @return NMRTGraph that represents the NMRT of the analyzed Petri net.
     * @throws Exception 
     */
    public NMRTGraph construct() throws Exception {
        try {
            markingStack.clear();
            markingStack.push(graph.getInitialNode());

            while (markingStack.size() != 0) {
                if (graph.isNetWDependent()) break;
                
                int currentMarking = markingStack.pop();
                List<Transition> enabledTransitions = findEnabledTransitions(currentMarking);

                for (Transition trans : enabledTransitions) {
                    int[] newTokenState = calculateOrdinaryNextStateFunction(currentMarking, trans);
                    TIntObjectHashMap<int []> newOmegaState = calculateOmegaNextStateFunction(currentMarking, trans);
                    
                    boolean isOmegaMarking = handleCovering(currentMarking, newTokenState, newOmegaState, false);
                    int stateHash = calculateStateHash(newTokenState, newOmegaState);
                    
                    int newMarking = graph.createNode(newTokenState, newOmegaState, stateHash);
                    graph.setEdge(newMarking, currentMarking, netObjectIdIndex.get(trans.getId()));
                    
                    if (!visitedStateHashes.contains(stateHash) && !visitedOmegaDupliciteHashes.contains(stateHash)) {
                        if (isNodeOmegaDuplicite(newTokenState, newOmegaState)) {
                            visitedOmegaDupliciteHashes.add(stateHash);
                        } else {
                            markingStack.push(newMarking);
                            visitedStateHashes.add(stateHash);
                            if (isOmegaMarking) {
                                computedOmegaMarkings.put(newMarking, newTokenState);
                                computedOmegaNumbers.put(newMarking, newOmegaState);
                            }
                        }
                    }
                }
                
                List<Transition> conditionallyEnabledTransitions = findConditionallyEnabledTransitions(currentMarking);
                for (Transition trans : conditionallyEnabledTransitions) {
                    int[] newTokenState = calculateOrdinaryNextStateFunction(currentMarking, trans);
                    TIntObjectHashMap<int []> newOmegaState = calculateConditionalOmegaNextStateFunction(currentMarking, trans);
                    
                    boolean isOmegaMarking = handleCovering(currentMarking, newTokenState, newOmegaState, true);
                    int stateHash = calculateStateHash(newTokenState, newOmegaState);
                    
                    int newMarking = graph.createNode(newTokenState, newOmegaState, stateHash);
                    graph.setEdge(newMarking, currentMarking, netObjectIdIndex.get(trans.getId()));
                    
                    if (!visitedStateHashes.contains(stateHash) && !visitedOmegaDupliciteHashes.contains(stateHash)) {
                        if (isNodeOmegaDuplicite(newTokenState, newOmegaState)) {
                            visitedOmegaDupliciteHashes.add(stateHash);
                        } else {
                            markingStack.push(newMarking);
                            visitedStateHashes.add(stateHash);
                            if (isOmegaMarking) {
                                computedOmegaMarkings.put(newMarking, newTokenState);
                                computedOmegaNumbers.put(newMarking, newOmegaState);
                            }
                        }
                    }
                }
                
                if (enabledTransitions.size() + conditionallyEnabledTransitions.size() == 0) {
                    graph.addTerminalNode();
                }
                
                if (enabledTransitions.isEmpty() && !conditionallyEnabledTransitions.isEmpty()) {
                    graph.addFullConditionalNode();
                }
            }

            return graph;
        } catch (Exception ex) {
            throw new Exception("Error while generating NMRT", ex);
        }
    }
    
    /**
     * Finds enabled transitions in the marking specified by its ID.
     * 
     * @param markingId The ID of the marking.
     * @return List of enabled transitions.
     */
    public List<Transition> findEnabledTransitions (int markingId) {
        int stateHash = graph.getStateHashOf(markingId);
        List<Transition> enabledTransitions = enabledTransitionsCache.get(stateHash);
        if (enabledTransitions == null) {
            int [] tokenState = graph.getTokenStateOf(markingId);
            TIntObjectHashMap<int []> omegaNumbers = graph.getOmegaNumbersOf(markingId);
            enabledTransitions = calculateEnabledTransitions(tokenState, omegaNumbers);
            enabledTransitionsCache.put(stateHash, enabledTransitions);
        }
        return enabledTransitions;
    }
    
    /**
     * Calculates enabled transitions based on the marking specified by its token state and omega-numbers. <br>
     * If there is a value -1 in the token state, it means that there is an omega-number used to specify the number of tokens in that place.
     * 
     * @param tokenState Array of ints that represents the token state of the marking.
     * @param omegaNumbers TIntObjectHashMap that contains all omega-numbers of the marking. Each omega-number is represented by an array of ints.
     * @return List of enabled transitions.
     */
    public List<Transition> calculateEnabledTransitions (int [] tokenState, TIntObjectHashMap<int []> omegaNumbers) {
        List<Transition> enabledTransitions = new ArrayList<>();
        
        for (Transition trans : petriNet.getTransitions()) {
            Map<Place, Arc> connections = transitionConnections.get(trans, true);
            boolean isEnabled = true;
            
            for (Entry<Place, Arc> connection : connections.entrySet()) {
                String inputPlaceId = connection.getKey().getId();
                int arcMultiplicity = connection.getValue().getMultiplicity();
                int placeIndex = netObjectIdIndex.get(inputPlaceId);

                if (tokenState[placeIndex] == -1) {
                    int [] omegaNumber = omegaNumbers.get(placeIndex);
                    int leastBound = omegaNumber[0] * omegaNumber[1] + omegaNumber[2]; // minimalni pocet tokenu
                    isEnabled = leastBound >= arcMultiplicity;
                }
                else {
                    int tokens = tokenState[placeIndex];
                    isEnabled = tokens >= arcMultiplicity;
                }
                
                if (!isEnabled) {
                    break;
                }
            }
            if (isEnabled) {
                enabledTransitions.add(trans);
            }
        }
        
        return enabledTransitions;
    }
    
    /**
     * Finds conditionally enabled transitions in the marking specified by its ID.
     * 
     * @param markingId The ID of the marking.
     * @return List of conditionally enabled transitions.
     */
    private List<Transition> findConditionallyEnabledTransitions (int markingId) {
        int stateHash = graph.getStateHashOf(markingId);
        List<Transition> conditionallyEnabledTransitions = conditionallyEnabledTransitionsCache.get(stateHash);
        if (conditionallyEnabledTransitions == null) {
            int [] tokenState = graph.getTokenStateOf(markingId);
            TIntObjectHashMap<int []> omegaNumbers = graph.getOmegaNumbersOf(markingId);
            conditionallyEnabledTransitions = calculateConditionallyEnabledTransitions(tokenState, omegaNumbers);
            conditionallyEnabledTransitionsCache.put(stateHash, conditionallyEnabledTransitions);
        }
        return conditionallyEnabledTransitions;
    }
    
    /**
     * Calculates conditionally enabled transitions based on the marking specified by its token state and omega-numbers. <br>
     * If there is a value -1 in the token state, it means that there is an omega-number used to specify the number of tokens in that place.
     * 
     * @param tokenState Array of ints that represents the token state of the marking.
     * @param omegaNumbers TIntObjectHashMap that contains all omega-numbers of the marking. Each omega-number is represented by an array of ints.
     * @return List of conditionally enabled transitions.
     */
    private List<Transition> calculateConditionallyEnabledTransitions (int [] tokenState, TIntObjectHashMap<int []> omegaNumbers) {
        List<Transition> conditionallyEnabledTransitions = new ArrayList<>();
        
        for (Transition trans : petriNet.getTransitions()) {
            Map<Place, Arc> connections = transitionConnections.get(trans, true);
            boolean isConditionallyEnabled = false;
            boolean canBeConditional = false;
            
            for (Entry<Place, Arc> connection : connections.entrySet()) {
                canBeConditional = false;
                String inputPlaceId = connection.getKey().getId();
                int arcMultiplicity = connection.getValue().getMultiplicity();
                int placeIndex = netObjectIdIndex.get(inputPlaceId);

                if (tokenState[placeIndex] == -1) {
                    int [] omegaNumber = omegaNumbers.get(placeIndex);
                    int leastBound = omegaNumber[0] * omegaNumber[1] + omegaNumber[2]; // minimalni pocet tokenu
                    if (leastBound < arcMultiplicity) {
                        isConditionallyEnabled = true;
                    }
                    canBeConditional = true;
                }
                else {
                    int tokens = tokenState[placeIndex];
                    canBeConditional = tokens >= arcMultiplicity;
                }
                
                if (!canBeConditional) {
                    isConditionallyEnabled = false;
                    break;
                }
            }
            
            if (isConditionallyEnabled) {
                conditionallyEnabledTransitions.add(trans);
            }
        }
        
        return conditionallyEnabledTransitions;
    }
    
    /**
     * Calculates the next-state function (new token state) for the ordinary part of the marking. It ignores places that have tokens represented by omega-number. <br>
     * This function calculates number of tokens after firing the enabled transition.
     * 
     * @param currentMarking ID of the current marking.
     * @param transition Transition enabled in the current marking that will be "fired".
     * @return Array of ints that represents new token state.
     */
    private int [] calculateOrdinaryNextStateFunction (int currentMarking, Transition transition) {
        int[] tokenState = graph.getTokenStateOf(currentMarking);
        int[] newTokenState = Arrays.copyOfRange(tokenState, 0, placeCount);

        Map<Place, Arc> inConnections = transitionConnections.get(transition, true);
        for (Entry<Place, Arc> connection : inConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();

            int placeIndex = netObjectIdIndex.get(placeId);
            int curTokens = tokenState[placeIndex];
            if (curTokens != -1) {
                newTokenState[placeIndex] = curTokens - arcMultiplicity;
            }
        }

        Map<Place, Arc> outConnections = transitionConnections.get(transition, false);
        for (Entry<Place, Arc> connection : outConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();

            int placeIndex = netObjectIdIndex.get(placeId);
            int curTokens = newTokenState[placeIndex];
            if (curTokens != -1) {
                newTokenState[placeIndex] = curTokens + arcMultiplicity;
            }
        }

        return newTokenState;
    } 
    
    /**
     * Calculates the next-state function for the omega-numbers after firing conditionally enabled transition. It ignores ordinary part of the token state. <br>
     * This function calculates the omega-numbers resulting from firing the conditionally enabled transition.
     * 
     * @param currentMarking ID of the current marking.
     * @param transition Transition conditionally enabled in the current marking that will be "fired".
     * @return TIntObjectHashMap of arrays of ints that represents the omega-numbers.
     */
    private TIntObjectHashMap<int []> calculateConditionalOmegaNextStateFunction (int currentMarking, Transition transition) {
        TIntObjectHashMap<int []> newOmegaNumbers = copyOmegaNumbers(graph.getOmegaNumbersOf(currentMarking));
        
        Map<Place, Arc> inConnections = transitionConnections.get(transition, true);
        for (Entry<Place, Arc> connection : inConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();
            int placeIndex = netObjectIdIndex.get(placeId);

            int [] temp = null;
            if (newOmegaNumbers.get(placeIndex) != null) {
                temp = Arrays.copyOf(newOmegaNumbers.get(placeIndex), newOmegaNumbers.get(placeIndex).length);
                if (temp[0] * temp[1] + temp[2] < arcMultiplicity) {
                    temp = removeUnreachableValues(temp, arcMultiplicity);
                }
            } 

            int [] curOmegaNumber = addIntToOmegaNumber(temp, -arcMultiplicity);
            if (curOmegaNumber != null) {
                newOmegaNumbers.put(placeIndex, curOmegaNumber);
            }
        }

        Map<Place, Arc> outConnections = transitionConnections.get(transition, false);
        for (Entry<Place, Arc> connection : outConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();

            int placeIndex = netObjectIdIndex.get(placeId);
            int [] curOmegaNumber = addIntToOmegaNumber(newOmegaNumbers.get(placeIndex), arcMultiplicity);
            if (curOmegaNumber != null) {
                newOmegaNumbers.put(placeIndex, curOmegaNumber);
            }
        }
        
        return newOmegaNumbers;
    }
    
    /**
     * Removes unreachable values from omega-number. If a transition is conditionally enabled, it means that some token values represented by omega-number are 
     * not enough to fire that transition. Those values must be removed from the omega-number so the next-state function can be computed properly.
     * 
     * @param omegaNumber Array of ints representing the omega-number.
     * @param arcMultiplicity Value of arc multiplicity.
     * @return Array of ints that represents the new omega-number without unreachable values.
     */
    private int [] removeUnreachableValues (int [] omegaNumber, int arcMultiplicity) {
        int [] newOmegaNumber = Arrays.copyOf(omegaNumber, omegaNumber.length);

        int k = omegaNumber[0];
        int n = omegaNumber[1];
        int q = omegaNumber[2];

        while (k * n + q < arcMultiplicity){
                n += k;
        }

        newOmegaNumber[1] = n;

        return newOmegaNumber;
    }
    
    /**
     * Calculates the next-state function for the omega-numbers after firing enabled transition. It ignores ordinary part of the token state. <br>
     * This function calculates the omega-numbers resulting from firing the enabled transition.
     * 
     * @param currentMarking ID of the current marking.
     * @param transition Transition enabled in the current marking that will be "fired".
     * @return TIntObjectHashMap of arrays of ints that represents the omega-numbers.
     */
    private TIntObjectHashMap<int []> calculateOmegaNextStateFunction (int currentMarking, Transition transition) {
        TIntObjectHashMap<int []> newOmegaNumbers = copyOmegaNumbers(graph.getOmegaNumbersOf(currentMarking));
        
        Map<Place, Arc> inConnections = transitionConnections.get(transition, true);
        for (Entry<Place, Arc> connection : inConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();

            int placeIndex = netObjectIdIndex.get(placeId);
            int [] curOmegaNumber = addIntToOmegaNumber(newOmegaNumbers.get(placeIndex), -arcMultiplicity);
            if (curOmegaNumber != null) {
                newOmegaNumbers.put(placeIndex, curOmegaNumber);
            }
        }

        Map<Place, Arc> outConnections = transitionConnections.get(transition, false);
        for (Entry<Place, Arc> connection : outConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            int arcMultiplicity = connection.getValue().getMultiplicity();

            int placeIndex = netObjectIdIndex.get(placeId);
            int [] curOmegaNumber = addIntToOmegaNumber(newOmegaNumbers.get(placeIndex), arcMultiplicity);
            if (curOmegaNumber != null) {
                newOmegaNumbers.put(placeIndex, curOmegaNumber);
            }
        }
        
        return newOmegaNumbers;
    }
    
    private TIntObjectHashMap<int []> copyOmegaNumbers (TIntObjectHashMap<int []> omegaNumbers) {
        TIntObjectHashMap<int []> newOmegaNumbers = new TIntObjectHashMap<>();
        for (int key : omegaNumbers.keys()) {
            newOmegaNumbers.put(key, omegaNumbers.get(key));
        }
        return newOmegaNumbers;
    }
    
    /**
     * Tests if the marking is omega-duplicate. Omega-duplicate marking is contained in some other marking that was calculated before in the NMRT.
     * 
     * @param newTokenState Array of ints representing token state of the marking.
     * @param newOmegaNumbers TIntObjectHashMap of arrays of ints representing omega-numbers of the marking.
     * @return True, if the node is omega-duplicate, otherwise false.
     */
    private boolean isNodeOmegaDuplicite (int [] newTokenState, TIntObjectHashMap<int []> newOmegaNumbers) {
        boolean isDuplicate = false;
        for (int i : newTokenState) {
            if (i == -1) {
                isDuplicate = true;
            }
        }
        if (!isDuplicate) {
            return false;
        }
        isDuplicate = false;
        
        Outer:
        for (int key : computedOmegaMarkings.keys()) {
            isDuplicate = false;
            int [] otherTokenState = computedOmegaMarkings.get(key);
            TIntObjectHashMap<int []> otherOmegaNumbers = computedOmegaNumbers.get(key);
            for (int index = 0; index < placeCount; index++) {
                if (otherTokenState[index] != -1) {
                    if (otherTokenState[index] != newTokenState[index]) {
                        isDuplicate = false;
                        continue Outer;
                    }
                } else {
                    if (newTokenState[index] != -1) {
                        isDuplicate = false;
                        continue Outer;
                    } else {
                        Integer result = compareOmegaNumbers(otherOmegaNumbers.get(index), newOmegaNumbers.get(index));
                        if (result == null || result == 1) {
                            isDuplicate = false;
                            continue Outer;
                        } else if (result == -1) {
                            isDuplicate = true;
                        }
                    }
                }
            }
            if (isDuplicate) {
                break;
            }
        }
        
        return isDuplicate;
    }
    
    /**
     * Adds int value to omega-number.
     * 
     * @param omegaNumber Array of ints representing omega-number.
     * @param value Int value that will be added to the omega-number.
     * @return Array of ints representing newly calculated omega-number.
     */
    private int [] addIntToOmegaNumber (int [] omegaNumber, int value) {
        if (omegaNumber == null) {
            return null;
        }
        int k = omegaNumber[0];
        int n = omegaNumber[1];
        int q = omegaNumber[2];
        int left = q + value;
        
        int r = Math.abs(left % k);
        int s = (left - r) / k;
        
        int [] result = {k, n + s, r};
        return result;
    }
    
    /**
     * Checks, if the current marking is covering some other marking calculated before. Also detects if the net is omega-dependent. <br>
     * If the current marking is covering some other marking, the respective token state is set to -1 and the new omega-number is calculated to represent the amount of tokens. <br>
     * Also checks, if the new marking is omega-marking or ordinary marking.
     * 
     * @param currentMarking ID of the current marking.
     * @param newTokenState Array of int representing token state after firing transition at the current marking.
     * @param newOmegaNumbers TIntObjectHashMap of arrays of ints representing omega-numbers after firing transition at the current marking.
     * @param isConditional Incicator of whether the fired transition was conditionally enabled at the current marking.
     * @return True, if the new marking is omega-marking, otherwise false.
     */
    private boolean handleCovering (int currentMarking, int [] newTokenState, TIntObjectHashMap<int []> newOmegaNumbers, boolean isConditional) {
        boolean isOmegaMarking = false;
        
        int currentParent = currentMarking;
        int equalPlaces = 0;
        int coveredPlaces = 0;
        int coveredIndex = -1;
        while (currentParent != -1) {
            equalPlaces = 0;
            coveredPlaces = 0;
            coveredIndex = -1;
            int [] parentTokenState = graph.getTokenStateOf(currentParent);
            TIntObjectHashMap<int []> parentOmegaNumbers = graph.getOmegaNumbersOf(currentParent);
            
            boolean covers = false;
            
            for (int index = 0; index < placeCount; index++) {
                if (newTokenState[index] == -1) {
                    isOmegaMarking = true;
                    int [] parentOmegaNumber = parentOmegaNumbers.get(index);
                    int [] newOmegaNumber = newOmegaNumbers.get(index);
                    Integer answer = compareOmegaNumbers(parentOmegaNumber, newOmegaNumber);
                    if (answer == null) {
                        break;
                    } else if (answer == 0) {
                        equalPlaces++;
                    } else if (answer == -1) {
                        coveredPlaces++;
                    } else {
                        break;
                    }
                }
                else {
                    int newTokens = newTokenState[index];
                    int parentTokens = parentTokenState[index];
                    if (newTokens == parentTokens) {
                        equalPlaces++;
                    }
                    else if (newTokens > parentTokens) {
                        coveredPlaces++;
                        coveredIndex = index;
                    }
                    else {
                        break;
                    }
                }
            }
            
            if ((equalPlaces + coveredPlaces == placeCount) && (coveredPlaces > 0)) {
                covers = true;
                isOmegaMarking = true;
            }
            
            if (covers) {
                if (coveredIndex != -1) {
                    int [] newOmegaNumber = calculateNewOmegaNumber(parentTokenState[coveredIndex], newTokenState[coveredIndex]);
                    newTokenState[coveredIndex] = -1;
                    newOmegaNumbers.put(coveredIndex, newOmegaNumber);
                    
                    if ((coveredPlaces > 1) && (equalPlaces + coveredPlaces == placeCount) && (!isConditional)) {
                        graph.setIsNetWDependent(true);
                    }
                    
                    break;
                }
            }
            
            currentParent = graph.getParent(currentParent);
        }
        return isOmegaMarking;
    }
    
    private int [] calculateNewOmegaNumber (int parentValue, int coveringValue) {
        int k, n, q;
        k = coveringValue - parentValue;
        q = coveringValue % k;
        n = (coveringValue - q) / k;
        
        int [] omegaNumber = {k,n,q};
        return omegaNumber;
    }
    
    /**
    * Compares two omega numbers.
    * @param number1 Omega number represented by array of three ints
    * @param number2 Omega number represented by array of three ints
    * @return   -1 - If number1 is lesser than number2 <br>
    *           0 - If number1 == number2 <br>
    *           1 - If nummber 1 is greater than number2 <br>
    *           null - If number1 is not comparable with number2
    */
    private Integer compareOmegaNumbers (int [] number1, int [] number2) {
        if (number1 == null) {
            return null;
        }
        if (number1[0] != number2[0] || number1[2] != number2[2]) {
            return null;
        }
        if (number1[1] < number2[1]) {
            return -1;
        } else if (number1[1] == number2[1]) {
            
            return 0;
        } else {
            return 1;
        }
    }
    
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
    
    private int calculateStateHash(int[] tokenState, TIntObjectHashMap<int []> omegaNumbers) {
        ArrayList<Integer> marking = new ArrayList<Integer>();
        if (omegaNumbers == null) {
            for (int i : tokenState) {
                marking.add(i);
            }
        } 
        else {
            for (int index = 0; index < placeCount; index++) {
                if (tokenState[index] != -1) {
                    marking.add(tokenState[index]);
                }
                else {
                	for (int i : omegaNumbers.get(index)) {
                		marking.add(-i);
                	}
                }
            }
        }

        return marking.hashCode();
    }
    
    public NMRTGraph getGraph() {
        return graph;
    }
}
