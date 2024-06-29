package cz.diploma.analysis.methods.invariant;

import cz.diploma.shared.graphs.tree.TreeNode;

public class SysTInvTreeNode extends TreeNode<SysTInvTreeNode> {

    private final int marking;
    private final Invariant invParcial;

    public SysTInvTreeNode(int marking, Invariant invParcial) {
        this(null, null, marking, invParcial);
    }

    public SysTInvTreeNode(String arcValue, SysTInvTreeNode parent, int marking, Invariant invParcial) {
        super(parent, arcValue);
        this.marking = marking;
        this.invParcial = invParcial;
    }

    public int getMarking() {
        return marking;
    }

    public Invariant getInvParcial() {
        return invParcial;
    }

    public boolean isLeaf() {
        return invParcial.isTrivial();
    }
}
