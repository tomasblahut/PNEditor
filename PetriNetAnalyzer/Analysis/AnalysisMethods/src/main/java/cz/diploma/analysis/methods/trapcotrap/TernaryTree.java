package cz.diploma.analysis.methods.trapcotrap;

import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import cz.diploma.shared.graphs.tree.Tree;

public class TernaryTree extends Tree<TernaryTreeNode> {

    private final Multimap<Integer, TernaryTreeNode> nodeOnLevels = LinkedListMultimap.create();

    public TernaryTree(TernaryTreeNode root) {
        super(root);
    }

    TernaryTreeNode createChildFor(TernaryTreeNode parent, boolean value) {
        int parentLevel = parent.getLevel();

        TernaryTreeNode child = null;
        for (TernaryTreeNode existingNode : nodeOnLevels.get(parentLevel + 1)) {
            if (existingNode.getValue() == value) {
                child = existingNode;
                break;
            }
        }

        if (child == null) {
            child = new TernaryTreeNode(parent, value);
            nodeOnLevels.put(parentLevel + 1, child);
        }

        parent.addChild(child);
        return child;
    }

}
