package cz.diploma.analysis.methods.invariant;

import cz.diploma.analysis.methods.statespace.StateSpaceConstructor;
import cz.diploma.analysis.methods.statespace.StateSpaceConstructorBuilder;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.graphs.tree.Tree;
import cz.diploma.shared.utils.CollectionUtils;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.set.TIntSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;

public class SysTInvCalculator {

    private final StateSpaceConstructor ssConstructor;
    private final Stack<SysTInvTreeNode> nodesToProcess = new Stack<>();
    private final Map<String, Integer> transIdIndex = new HashMap<>();
    //--
    private StateSpaceGraph ssGraph;

    public SysTInvCalculator(PetriNet net) {
        ssConstructor = new StateSpaceConstructorBuilder(net).ignoreCovering().get();

        Set<String> transIds = CollectionUtils.exthractIds(net.getTransitions());
        for (String transId : CollectionUtils.sortedList(transIds)) {
            transIdIndex.put(transId, transIdIndex.size());
        }
    }

    public void calculateSystemInvariants(TInvariant invariant) throws Exception {
        List<List<String>> sysInvs = new ArrayList<>();

        Tree<SysTInvTreeNode> invTree = initInvTree(invariant);
        if (invTree != null) {
            nodesToProcess.add(invTree.getRoot());

            while (!nodesToProcess.isEmpty()) {
                SysTInvTreeNode curNode = nodesToProcess.pop();

                if (curNode.isLeaf()) {
                    List<String> sysInv = invTree.traceToRoot(curNode);
                    Collections.reverse(sysInv);
                    sysInvs.add(sysInv);
                } else {
                    nodesToProcess.addAll(createChildNodes(curNode));
                }
            }
        }

        invariant.getSystem().addAll(sysInvs);
    }

    private Tree<SysTInvTreeNode> initInvTree(Invariant invariant) {
        Tree<SysTInvTreeNode> invTree = null;

        ssGraph = ssConstructor.getGraph();
        if (ssGraph != null) {
            int initialMarking = ssGraph.getInitialNode();
            SysTInvTreeNode invRoot = new SysTInvTreeNode(initialMarking, invariant);
            invTree = new Tree<>(invRoot);
        }

        return invTree;
    }

    private List<SysTInvTreeNode> createChildNodes(SysTInvTreeNode curNode) throws Exception {
        List<SysTInvTreeNode> newNodes = new ArrayList<>();

        int curMarking = curNode.getMarking();
        Invariant invParcial = curNode.getInvParcial();

        List<Transition> enabledTransitions = ssConstructor.findEnabledTransitions(curMarking);
        for (Transition enabledTransition : enabledTransitions) {
            String transId = enabledTransition.getId();

            if (invParcial.getItem(transId) > 0) {
                Invariant newParcial = invParcial.adjustData(transId, -1);

                int transIndex = transIdIndex.get(transId);
                int newMarking = findChildOf(curMarking, transIndex);
                if (newMarking == -1) {
                    newMarking = ssConstructor.performTransition(curMarking, enabledTransition);
                }

                SysTInvTreeNode newNode = new SysTInvTreeNode(transId, curNode, newMarking, newParcial);
                curNode.addChild(newNode, transId);
                newNodes.add(newNode);
            }
        }

        return newNodes;
    }

    private int findChildOf(int curNode, int transition) {
        int child = -1;

        TIntSet successors = ssGraph.getSuccessorsOf(curNode);
        TIntIterator successorIterator = successors.iterator();
        while (successorIterator.hasNext()) {
            int successor = successorIterator.next();
            TIntSet edge = ssGraph.getEdgeBetween(curNode, successor);
            if (edge.contains(transition)) {
                child = successor;
                break;
            }
        }

        return child;
    }
}
