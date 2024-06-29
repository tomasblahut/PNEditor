package cz.diploma.analysis.testing.impl;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.classification.ClassificationAnalysisResult;
import cz.diploma.analysis.methods.classification.NetSubclass;
import cz.diploma.analysis.methods.cycles.CyclesAnalysisResult;
import cz.diploma.analysis.methods.cycles.PNCycle;
import cz.diploma.analysis.methods.invariant.InvariantAnalysisResult;
import cz.diploma.analysis.methods.invariant.PInvariant;
import cz.diploma.analysis.methods.nmrt.NMRTAnalysisResult;
import cz.diploma.analysis.methods.nmrt.NMRTGraph;
import cz.diploma.analysis.methods.statespace.StateSpaceAnalysisResult;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.analysis.methods.trapcotrap.PlaceSubset;
import cz.diploma.analysis.methods.trapcotrap.TrapCotrapAnalysisResult;
import cz.diploma.analysis.testing.NetProperty;
import cz.diploma.analysis.testing.NetPropertyTest;
import cz.diploma.analysis.testing.NetPropertyTestResult;
import cz.diploma.analysis.testing.NetPropertyTestResult.NetPropertyResultBuilder;
import cz.diploma.analysis.testing.TestResultStatus;
import cz.diploma.shared.graphs.DirectedGraph;
import cz.diploma.shared.graphs.algorithm.SCCDetector;
import cz.diploma.shared.graphs.conversion.PetriNetToDirectedGraph;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class LivenessTest extends NetPropertyTest {

    @Override
    protected NetProperty getTestedProperty() {
        return NetProperty.LIVENESS;
    }

    @Override
    protected void doTestProperty(PropertyTestParams params, NetPropertyResultBuilder builder) throws Exception {
        TestResultStatus ssStatus = decideFromSSGraph(params, builder);
        TestResultStatus invStatus = decideFromInvariants(params, builder);
        TestResultStatus classStatus = decideFromClassification(params, builder);
        TestResultStatus nmrtStatus = decideFromNMRT(params, builder);

        builder.setStatus(TestResultStatus.logicalOr(ssStatus, invStatus, classStatus));
        if (nmrtStatus == TestResultStatus.FAIL) {
            builder.setStatus(nmrtStatus);
        }
    }
    
    /**
     * Tries to decide whether the Petri net is live based on NMRT analysis. It can be decided that Petri net is not live if NMRT contains deadlock. 
     * Otherwise it is undecidable.
     * 
     * @param params Property parameters.
     * @param builder Builder for storing property test results.
     * @return TestResultStatus.UNDECIDABLE if the liveness cannot be decided using NMRT. <br>
     *          TestResultStatus.FAIL if the Petri net is not live (NMRT contains deadlock).
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
                    builder.addReason("NMRT analysis cannot be used, because the analyzed Petri net is ω-dependent. Liveness cannot be decided based on NMRT");
                } else {
                    if (nmrt.getNumberOfTerminalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one terminal node, so Petri net has deadlock. Petri net is not live");
                    }
                    if (nmrt.getNumberOfFullConditionalNodes() > 0) {
                        nmrtStatus = TestResultStatus.FAIL;
                        builder.addReason("NMRT contains at least one fully conditional node, so Petri net has deadlock. Petri net is not live");
                    }
                }
                
                if ((nmrtStatus == TestResultStatus.UNDECIDABLE) && (!nmrt.isNetWDependent())) {
                    builder.addReason("Petri net is deadlock free. Liveness cannot be decided based on NMRT");
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

                int transCount = params.getPetriNet().getTransitions().size();
                boolean live = !scComponents.isEmpty();
                
                int lazyCoveringLevel = ssGraph.getLazyCoveringLevel();

                TIntSet componentTransitions = new TIntHashSet();
                for (TIntSet ssComponent : scComponents) {
                    boolean isFinal = true;
                    componentTransitions.clear();

                    TIntIterator componentNodeIterator = ssComponent.iterator();
                    while (componentNodeIterator.hasNext()) {
                        int node = componentNodeIterator.next();
                        TIntSet connectedNodes = ssGraph.getSuccessorsOf(node);
                        TIntIterator connectedNodesIterator = connectedNodes.iterator();

                        boolean connectsOutsideOfComponent = false;
                        while (connectedNodesIterator.hasNext()) {
                            int connectedNode = connectedNodesIterator.next();
                            connectsOutsideOfComponent = !ssComponent.contains(connectedNode);

                            if (connectsOutsideOfComponent) {
                                break;
                            } else {
                                TIntSet edge = ssGraph.getEdgeBetween(node, connectedNode);
                                componentTransitions.addAll(edge);
                            }
                        }

                        if (connectsOutsideOfComponent) {
                            isFinal = false;
                            break;
                        }
                    }

                    if (isFinal) {
                        live = transCount > 0 && transCount == componentTransitions.size();
                        if (!live) {
                            break;
                        }
                    }
                }

                ssStatus = live ? TestResultStatus.PASS : TestResultStatus.FAIL;
                String reason = live ? "Each final strongly connected component of state space graph contains all transitions as it's arc labelling. "
                        + "Petri net is live (Lazy covering level used for this analysis: " + lazyCoveringLevel + ")" 
                        : "Not all final strongly connected components of state space graph contains every transition as it's arc labelling. "
                        + "Petri net is not live (Lazy covering level used for this analysis: " + lazyCoveringLevel + ")";
                builder.addReason(reason);
            }
        } else {
            builder.addReason("State space analysis results are unavailable");
        }

        return ssStatus;
    }

    private TestResultStatus decideFromInvariants(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus invStatus = TestResultStatus.UNDECIDABLE;

        InvariantAnalysisResult invAnalysisResult = (InvariantAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.INVARIANT);
        if (invAnalysisResult != null) {
            if (invAnalysisResult.hasErrors()) {
                builder.logError("Invariant analysis could not be performed");
            } else {
                TestResultStatus pInvStatus = decideFromPInvariants(invAnalysisResult, params, builder);
                TestResultStatus tInvStatus = decideFromTInvariants(invAnalysisResult, params, builder);
                invStatus = TestResultStatus.logicalOr(pInvStatus, tInvStatus);
            }
        } else {
            builder.addReason("Invariant analysis results are unavailable");
        }

        return invStatus;
    }

    private TestResultStatus decideFromPInvariants(InvariantAnalysisResult invAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        boolean zeroSystemInvExists = false;
        boolean zeroInvHasTrans = false;

        PetriNet net = params.getPetriNet();
        Map<String, Place> placeIdMap = CollectionUtils.mapById(net.getPlaces());

        for (PInvariant inv : invAnalysisResult.getpInvariants()) {
            if (inv.getSystem() <= 0) {
                zeroSystemInvExists = zeroSystemInvExists || inv.getSystem() <= 0;

                for (String placeId : inv.getStruct().keySet()) {
                    Place place = placeIdMap.get(placeId);
                    zeroInvHasTrans = !net.findConnectedTransitions(place).isEmpty();

                    if (zeroInvHasTrans) {
                        break;
                    }
                }
            }
        }

        TestResultStatus pInvStatus = zeroSystemInvExists && zeroInvHasTrans ? TestResultStatus.FAIL : TestResultStatus.UNDECIDABLE;
        String reason;
        if (zeroSystemInvExists) {
            reason = zeroInvHasTrans ? "There is a P-invariant whose system value is equal to zero. Petri net is not live"
                    : "Although there is at least one P-invariant whose system value is equal to zero, not a single one of them has "
                    + "any input neither output transitions. Liveness cannot be decided based on P-invariants";
        } else {
            reason = "System value of each P-invariant is greater than zero. Liveness cannot be decided based on P-invariants";
        }
        builder.addReason(reason);
        return pInvStatus;
    }

    private TestResultStatus decideFromTInvariants(InvariantAnalysisResult invAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus tInvStatus = TestResultStatus.UNDECIDABLE;

        NetPropertyTestResult boundednessResult = params.getPropertyResult(NetProperty.BOUNDEDNESS);
        NetPropertyTestResult repetitivenessResult = params.getPropertyResult(NetProperty.REPETITIVENESS);

        String reason;
        if (boundednessResult != null && repetitivenessResult != null) {
            boolean bounded = TestResultStatus.PASS.equals(boundednessResult.getStatus());
            boolean notRepetitive = TestResultStatus.FAIL.equals(repetitivenessResult.getStatus());
            if (bounded && notRepetitive) {
                tInvStatus = TestResultStatus.FAIL;
                reason = "Petri net is bounded and is not repetitive, therefore Petri net is not live";
            } else {
                reason = "Petri net is unbounded or repetitive. Liveness cannot be decided based on T-invariants";
            }
        } else {
            reason = "Boundedness or Repetitiveness test results are unavailable. Liveness cannot be decided based on T-invariants";
        }

        builder.addReason(reason);
        return tInvStatus;
    }

    private TestResultStatus decideFromClassification(PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus classStatus = TestResultStatus.UNDECIDABLE;

        ClassificationAnalysisResult classAnalysisResult = (ClassificationAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.CLASSIFICATION);
        if (classAnalysisResult != null) {
            if (classAnalysisResult.hasErrors()) {
                builder.logError("Classification analysis could not be performed");
            } else {
                TestResultStatus stateMachineStatus = decideFromStateMachine(classAnalysisResult, params, builder);
                TestResultStatus markedGraphStatus = decideFromMarkedGraph(classAnalysisResult, params, builder);
                TestResultStatus freeChoiceStatus = decideFromFreeChoice(classAnalysisResult, params, builder);
                classStatus = TestResultStatus.logicalOr(stateMachineStatus, markedGraphStatus, freeChoiceStatus);
            }
        } else {
            builder.addReason("Classification analysis results are unavailable");
        }

        return classStatus;
    }

    private TestResultStatus decideFromStateMachine(ClassificationAnalysisResult classAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus stateMachineStatus = TestResultStatus.UNDECIDABLE;

        boolean isStateMachine = classAnalysisResult.isOfType(NetSubclass.STATE_MACHINE);
        String reason;

        if (isStateMachine) {
            PetriNet net = params.getPetriNet();
            int tokenSum = 0;
            for (Place place : net.getPlaces()) {
                tokenSum += place.getTokens();
            }

            if (tokenSum <= 0) {
                reason = "Although Petri net is classified as State machine, sum of tokens of initial marking is equal to zero. "
                        + "Liveness cannot be decided based on this classification";
            } else {
                DirectedGraph graph = PetriNetToDirectedGraph.convert(net);
                SCCDetector sccDetector = new SCCDetector(graph);
                List<TIntSet> strongConnComps = sccDetector.findSCC();

                stateMachineStatus = strongConnComps.size() == 1 ? TestResultStatus.PASS : TestResultStatus.UNDECIDABLE;
                reason = strongConnComps.size() == 1 ? "Petri net is classified as State machine, sum of tokens of intial marking is greater than zero and "
                        + "net is strongly connected. Petri net is live" : "Although Petri net is classified as State machine and sum of tokens of "
                        + "intial marking is greater than zero, net is not strongly connected. Liveness cannot be decided based on this classification";
            }

        } else {
            reason = "Petri net is not classified as State machine. Liveness cannot be decided based on this classification";
        }
        builder.addReason(reason);

        return stateMachineStatus;
    }

    private TestResultStatus decideFromMarkedGraph(ClassificationAnalysisResult classAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus markedGraphStatus = TestResultStatus.UNDECIDABLE;

        boolean isMarkedGraph = classAnalysisResult.isOfType(NetSubclass.MARKED_GRAPH);
        String reason;

        if (isMarkedGraph) {
            CyclesAnalysisResult cyclesAnalysisResult = (CyclesAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.CYCLES);
            if (cyclesAnalysisResult != null) {
                boolean eachCycleHasTokens = true;
                for (PNCycle cycle : cyclesAnalysisResult.getCycles()) {
                    boolean cycleHasTokens = false;
                    for (Place place : cycle.getPlaceSupport()) {
                        cycleHasTokens = place.getTokens() > 0;
                        if (cycleHasTokens) {
                            break;
                        }
                    }

                    eachCycleHasTokens = cycleHasTokens;
                    if (!eachCycleHasTokens) {
                        break;
                    }
                }

                markedGraphStatus = eachCycleHasTokens ? TestResultStatus.PASS : TestResultStatus.UNDECIDABLE;
                reason = eachCycleHasTokens ? "Petri net is classified as Marked graph and every cycle (if there is one) contains at least one token at initial "
                        + "marking. Petri net is live"
                        : "Although Petri net is classified as Marked graph, not every cycle contains at least one token at initial marking. "
                        + "Liveness cannot be decided based on this classification";
            } else {
                reason = "Although Petri net is classified as Marked graph, cycles analysis results are unavailable. "
                        + "Liveness cannot be decided based on this classification";
            }
        } else {
            reason = "Petri net is not classified as Marked graph. Liveness cannot be decided based on this classification";
        }
        builder.addReason(reason);

        return markedGraphStatus;
    }

    private TestResultStatus decideFromFreeChoice(ClassificationAnalysisResult classAnalysisResult, PropertyTestParams params, NetPropertyResultBuilder builder) {
        TestResultStatus freeChoiceStatus = TestResultStatus.UNDECIDABLE;

        boolean isFreeChoice = classAnalysisResult.isOfType(NetSubclass.FREE_CHOICE);
        String reason;

        if (isFreeChoice) {
            TrapCotrapAnalysisResult trapCotrapAnalysisResult = (TrapCotrapAnalysisResult) params.getAnalysisResult(NetAnalysisMethod.TRAP_COTRAP);
            if (trapCotrapAnalysisResult != null) {
                PetriNet net = params.getPetriNet();
                Map<String, Place> placeIdMap = CollectionUtils.mapById(net.getPlaces());

                List<PlaceSubset> trapsWithTokens = new ArrayList<>();
                for (PlaceSubset trap : trapCotrapAnalysisResult.getTraps()) {
                    boolean hasTokens = false;
                    for (String placeId : trap.getPlaceIds()) {
                        Place place = placeIdMap.get(placeId);
                        hasTokens = place.getTokens() > 0;
                        if (hasTokens) {
                            break;
                        }
                    }

                    if (hasTokens) {
                        trapsWithTokens.add(trap);
                    }
                }

                List<PlaceSubset> cotraps = trapCotrapAnalysisResult.getCotraps();
                if (!cotraps.isEmpty()) {
                    boolean eachCotrapContainsTrap = false;
                    for (PlaceSubset cotrap : cotraps) {
                        Set<String> cotrapPlaceIds = cotrap.getPlaceIds();

                        boolean containsTrap = false;
                        for (PlaceSubset trap : trapsWithTokens) {
                            containsTrap = cotrapPlaceIds.containsAll(trap.getPlaceIds());
                            if (containsTrap) {
                                break;
                            }
                        }

                        eachCotrapContainsTrap = containsTrap;
                        if (!eachCotrapContainsTrap) {
                            break;
                        }
                    }
                    freeChoiceStatus = eachCotrapContainsTrap ? TestResultStatus.PASS : TestResultStatus.FAIL;
                    reason = eachCotrapContainsTrap ? "Petri net is classified as Free choice net and each of it's cotraps contains a trap with at least one token. "
                            + "Petri net is live" : "Petri net is classified as Free choice net, but not every cotrap contains a trap with at least one token. "
                            + "Petri net is not live";
                } else {
                    reason = "Although Petri net is classified as Free choice net, there are no cotraps."
                            + "Liveness cannot be decided based on this classification";
                }
            } else {
                reason = "Although Petri net is classified as Free choice net, cotraps and traps analysis results are unavailable. "
                        + "Liveness cannot be decided based on this classification";
            }
        } else {
            reason = "Petri net is not classified as Free choice net. Liveness cannot be decided based on this classification";
        }
        builder.addReason(reason);

        return freeChoiceStatus;
    }
}
