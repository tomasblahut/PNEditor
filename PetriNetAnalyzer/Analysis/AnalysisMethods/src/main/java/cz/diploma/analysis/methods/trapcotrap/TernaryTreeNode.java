package cz.diploma.analysis.methods.trapcotrap;

import cz.diploma.shared.graphs.tree.TreeNode;
import cz.diploma.shared.graphs.tree.TreeNodeLink;

public class TernaryTreeNode extends TreeNode<TernaryTreeNode> {

    private final boolean value;

    public TernaryTreeNode() {
        this(null, false);
    }

    public TernaryTreeNode(TernaryTreeNode parent, boolean value) {
        super(parent);
        this.value = value;
    }

    protected TernaryTreeNode findChildWithValue(boolean value) {
        TernaryTreeNode child = null;
        for (TreeNodeLink<TernaryTreeNode> childLink : children) {
            TernaryTreeNode toCheck = childLink.getNode();
            if (toCheck.value == value) {
                child = toCheck;
                break;
            }
        }
        return child;
    }

    public boolean getValue() {
        return value;
    }
}
