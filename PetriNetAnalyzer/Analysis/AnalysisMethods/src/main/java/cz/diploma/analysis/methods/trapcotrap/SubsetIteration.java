package cz.diploma.analysis.methods.trapcotrap;

import java.util.HashSet;
import java.util.Set;

public class SubsetIteration {

    private TernaryTreeNode treeNode;
    private final Set<String> placeIds = new HashSet<>();
    private boolean newBranch = false;

    public SubsetIteration() {
    }

    public SubsetIteration(SubsetIteration derivedFrom) {
        this.treeNode = derivedFrom.treeNode;
        this.placeIds.addAll(derivedFrom.placeIds);
        this.newBranch = derivedFrom.newBranch;
    }

    public TernaryTreeNode getTreeNode() {
        return treeNode;
    }

    public void setTreeNode(TernaryTreeNode treeNode) {
        this.treeNode = treeNode;
    }

    public Set<String> getPlaceIds() {
        return placeIds;
    }

    public boolean isNewBranch() {
        return newBranch;
    }

    public void markAsNewBranch() {
        this.newBranch = true;
    }
}
