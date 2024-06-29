package cz.diploma.analysis.methods.statespace;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.interfaces.HasId;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.map.hash.TIntIntHashMap;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import gnu.trove.stack.TIntStack;
import gnu.trove.stack.array.TIntArrayStack;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

public class StateSpaceConstructor {

    private static final int OMEGA = -1;
    //--
    private final PetriNet net;
    private final Map<String, Integer> netObjectIdIndex = new HashMap<>();
    private final Table<Transition, Boolean, Map<Place, Arc>> transitionConnections = HashBasedTable.create();
    private final int placeCount;
    //--
    private final TIntSet stateHashToNonOmegaMarking = new TIntHashSet(); //Used to store state hashes of non omega markings
    private final TIntSet visitedStateHashes = new TIntHashSet(); //Used to check if node is duplicate
    private final TIntObjectHashMap<List<Transition>> enabledTransitionsCache = new TIntObjectHashMap<>(); //Contains information what transitions are enabled at what Net state
    //--
    private final TIntArrayStack markingStack = new TIntArrayStack();
    private final StateSpaceGraph graph;
    private final TIntIntHashMap coveringLevels;
    private final TIntArrayList coveredIndexes;
    //--
    private boolean ignoreCovering;
    private int lazyCoveringLevel = 1;
    private boolean expandWholeTree = false;

    public StateSpaceConstructor(PetriNet net) {
        this.net = net;

        int netObjIndex = 0;
        Set<String> placeIds = CollectionUtils.exthractIds(net.getPlaces());
        for (String placeId : CollectionUtils.sortedList(placeIds)) {
            netObjectIdIndex.put(placeId, netObjIndex++);
        }
        placeCount = placeIds.size();

        netObjIndex = 0;
        for (Transition trans : CollectionUtils.sortedList(net.getTransitions(), HasId.idComparator)) {
            netObjectIdIndex.put(trans.getId(), netObjIndex++);

            Map<Place, Arc> inConnections = net.findConnectedPlaces(trans, true);
            transitionConnections.put(trans, Boolean.TRUE, inConnections);

            Map<Place, Arc> outConnections = net.findConnectedPlaces(trans, false);
            transitionConnections.put(trans, Boolean.FALSE, outConnections);
        }

        graph = new StateSpaceGraph();
        createInitMarking();

        coveringLevels = new TIntIntHashMap(placeCount);
        coveredIndexes = new TIntArrayList(placeCount);
    }

    private int createInitMarking() {
        Map<String, Place> placeIdMap = CollectionUtils.mapById(net.getPlaces());

        int[] initState = new int[placeIdMap.size()];
        for (Place place : placeIdMap.values()) {
            int index = netObjectIdIndex.get(place.getId());
            initState[index] = place.getTokens();
        }

        int stateHash = calculateStateHash(initState, null);
        int initialMarking = graph.registerNode(initState, null, stateHash);
        stateHashToNonOmegaMarking.add(stateHash);
        if (!expandWholeTree) {
            visitedStateHashes.add(stateHash);
        }

        return initialMarking;
    }

    public StateSpaceGraph getGraph() {
        return graph;
    }

    public StateSpaceGraph construct() throws Exception {
        try {
            markingStack.clear();
            markingStack.push(graph.getInitialNode());

            while (markingStack.size() != 0) {
                int currentMarking = markingStack.pop();
                List<Transition> enabledTransitions = findEnabledTransitions(currentMarking);

                for (Transition trans : enabledTransitions) {
                    int[] newTokenState = calculateNewTokenState(currentMarking, trans);
                    boolean[] newOmegaState = handleCovering(currentMarking, newTokenState);
                    int stateHash = calculateStateHash(newTokenState, newOmegaState);
                    
                    /*
                    System.out.println("trans: " + trans.getName());
                    System.out.print("StateSpaceConstructor: newTokenState: ");
                    for (int i : newTokenState)
                    {
                        System.out.print(i + " ");
                    }
                    System.out.println("");
                    
                    System.out.print("StateSpaceConstructor: newOmegaState: ");
                    for (boolean i : newOmegaState)
                    {
                        System.out.print(i + " ");
                    }
                    System.out.println("");
                    */
                    
                    int newMarking = graph.registerNode(newTokenState, newOmegaState, stateHash);
                    graph.setParentOf(newMarking, currentMarking, netObjectIdIndex.get(trans.getId()));

                    if (newOmegaState == null) {
                        stateHashToNonOmegaMarking.add(stateHash);
                    }

                    if (!visitedStateHashes.contains(stateHash)) {
                        markingStack.push(newMarking);
                        if (!expandWholeTree) {
                            visitedStateHashes.add(stateHash);
                        }
                    }
                }
            }

            expandOmegaNodes();
            return graph;
        } catch (Exception ex) {
            throw new Exception("Error while generating coverability tree", ex);
        }
    }

    public List<Transition> findEnabledTransitions(int marking) {
        int stateHash = graph.getStateHashOf(marking);
        List<Transition> enabledTransitions = enabledTransitionsCache.get(stateHash);
        if (enabledTransitions == null) {
            int[] tokenState = graph.getStateOf(marking);
            boolean[] omegaState = graph.getOmegaOf(marking);
            enabledTransitions = calculateEnabledTransitions(tokenState, omegaState);
            enabledTransitionsCache.put(stateHash, enabledTransitions);
        }
        return enabledTransitions;
    }

    public int performTransition(int currentMarking, Transition transition) {
        int[] newTokenState = calculateNewTokenState(currentMarking, transition);
        boolean[] newOmegaState = handleCovering(currentMarking, newTokenState);
        int stateHash = calculateStateHash(newTokenState, newOmegaState);

        int newMarking = graph.registerNode(newTokenState, newOmegaState, stateHash);
        graph.setParentOf(newMarking, currentMarking, netObjectIdIndex.get(transition.getId()));

        return newMarking;
    }

    private List<Transition> calculateEnabledTransitions(int[] tokenState, boolean[] omegaState) {
        List<Transition> enabledTransitions = new ArrayList<>();

        for (Transition trans : net.getTransitions()) {
            Map<Place, Arc> connections = transitionConnections.get(trans, true);
            boolean isEnabled = true;

            for (Entry<Place, Arc> connection : connections.entrySet()) {
                String inputPlaceId = connection.getKey().getId();
                Arc arc = connection.getValue();

                int placeIndex = netObjectIdIndex.get(inputPlaceId);
                boolean omegaMarked = !ignoreCovering && (omegaState != null && omegaState[placeIndex]);

                if (omegaMarked) {
                    isEnabled = true;
                } else {
                    int tokens = tokenState[placeIndex];
                    isEnabled = tokens >= arc.getMultiplicity();
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

    private int[] calculateNewTokenState(int currentMarking, Transition transition) {
        int[] tokenState = graph.getStateOf(currentMarking);
        int[] newTokenState = Arrays.copyOfRange(tokenState, 0, placeCount);

        //Remove tokens from input places
        Map<Place, Arc> inConnections = transitionConnections.get(transition, true);
        for (Entry<Place, Arc> connection : inConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            Arc arc = connection.getValue();

            int placeIndex = netObjectIdIndex.get(placeId);
            int curTokens = tokenState[placeIndex];
            if (curTokens != -1) {
                int newTokens = curTokens - arc.getMultiplicity();
                if (newTokens < 0) {
                    newTokens = OMEGA;
                }
                newTokenState[placeIndex] = newTokens;
            }
        }

        //Add tokens to output places
        Map<Place, Arc> outConnections = transitionConnections.get(transition, false);
        for (Entry<Place, Arc> connection : outConnections.entrySet()) {
            String placeId = connection.getKey().getId();
            Arc arc = connection.getValue();

            int placeIndex = netObjectIdIndex.get(placeId);
            int curTokens = newTokenState[placeIndex];
            if (curTokens != OMEGA) {
                newTokenState[placeIndex] = curTokens + arc.getMultiplicity();
            }
        }

        return newTokenState;
    }

    private boolean[] handleCovering(int currentMarking, int[] newTokenState) {
        boolean[] newOmegaState = null;

        if (expandWholeTree) {
            visitedStateHashes.clear();
        } else if (ignoreCovering) {
            return newOmegaState;
        }
        coveringLevels.clear();

        int curParent = currentMarking;
        while (curParent != -1) {
            if (expandWholeTree) {
                visitedStateHashes.add(graph.getStateHashOf(curParent));
            }

            if (!ignoreCovering) {
                int[] parentTokenState = graph.getStateOf(curParent);
                boolean[] parentOmegaState = graph.getOmegaOf(curParent);
                if (curParent == currentMarking && parentOmegaState != null) {
                    newOmegaState = Arrays.copyOfRange(parentOmegaState, 0, placeCount);
                }
                coveredIndexes.clear();

                boolean covers = false;
                for (int index = 0; index < placeCount; index++) {
                    if (newOmegaState != null && newOmegaState[index]) {
                        continue;
                    }

                    int newTokens = newTokenState[index];
                    int parentTokens = parentTokenState[index];

                    covers = newTokens >= parentTokens;
                    if (!covers) {
                        break;
                    } else if (newTokens > parentTokens) {
                        coveredIndexes.add(index);
                    }
                }

                if (covers && !coveredIndexes.isEmpty()) {
                    TIntIterator iterator = coveredIndexes.iterator();
                    while (iterator.hasNext()) {
                        int index = iterator.next();

                        int coverLevel = 0;
                        if (coveringLevels.containsKey(index)) {
                            coverLevel = coveringLevels.get(index);
                        }
                        coverLevel++;

                        if (coverLevel >= lazyCoveringLevel) {
                            if (newOmegaState == null) {
                                newOmegaState = new boolean[placeCount];
                            }
                            newOmegaState[index] = true;
                        } else {
                            coveringLevels.put(index, coverLevel);
                        }
                    }
                }
            }

            curParent = graph.getParent(curParent);
        }

        return newOmegaState;
    }

    private int calculateStateHash(int[] tokenState, boolean[] omegaState) {
        int[] stateVector;
        if (omegaState == null) {
            stateVector = tokenState;
        } else {
            stateVector = new int[placeCount];
            for (int index = 0; index < placeCount; index++) {
                stateVector[index] = omegaState[index] ? OMEGA : tokenState[index];
            }
        }

        return Arrays.hashCode(stateVector);
    }

    private void expandOmegaNodes() {
        TIntStack nodeStack = new TIntArrayStack();
        nodeStack.push(graph.getInitialNode());

        while (nodeStack.size() != 0) {
            int curMarking = nodeStack.pop();

            TIntSet children = graph.getSuccessorsOf(curMarking);
            TIntIterator childrenIterator = children.iterator();
            while (childrenIterator.hasNext()) {
                int child = childrenIterator.next();
                nodeStack.push(child);
            }

            boolean[] omegaState = graph.getOmegaOf(curMarking);
            if (omegaState != null) {
                int[] tokenState = graph.getStateOf(curMarking);
                boolean conditionalState = false;
                for (int tokens : tokenState) {
                    conditionalState = tokens < 0;
                    if (conditionalState) {
                        break;
                    }
                }

                if (!conditionalState) {
                    int stateHash = calculateStateHash(tokenState, null);
                    boolean nonOmegaMarking = stateHashToNonOmegaMarking.contains(stateHash);

                    if (nonOmegaMarking || checkDeadlock(stateHash, tokenState)) {
                        int parent = graph.getParent(curMarking);
                        int newChild = graph.registerNode(tokenState, null, stateHash);
                        TIntSet edge = graph.getEdgeBetween(parent, curMarking);
                        graph.setParentOf(newChild, parent, edge.iterator().next());
                    }
                }
            }
        }
    }

    private boolean checkDeadlock(int stateHash, int[] tokenState) {
        List<Transition> enabledTransitions = enabledTransitionsCache.get(stateHash);
        if (enabledTransitions == null) {
            enabledTransitions = calculateEnabledTransitions(tokenState, null);
        }
        return enabledTransitions.isEmpty();
    }

    void setIgnoreCovering(boolean ignoreCovering) {
        this.ignoreCovering = ignoreCovering;
    }

    void setLazyCoveringLevel(int lazyCoveringLevel) {
        this.lazyCoveringLevel = lazyCoveringLevel;
        this.graph.setLazyCoveringLevel(lazyCoveringLevel);
    }

    void setExpandWholeTree(boolean expandWholeTree) {
        this.expandWholeTree = expandWholeTree;
    }

    void setNodeLimit(Integer nodeLimit) {
        this.graph.setNodeLimit(nodeLimit);
    }
}
