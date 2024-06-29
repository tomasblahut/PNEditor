package cz.diploma.shared.graphs.tree;

import cz.diploma.shared.graphs.GraphNode;
import java.util.ArrayList;
import java.util.List;

public class TreeNode<SELF extends TreeNode<SELF>> extends GraphNode {

    protected final int level;
    protected final TreeNodeLink<SELF> parent;
    protected final List<TreeNodeLink<SELF>> children = new ArrayList<>();

    public TreeNode() {
        this(null, null);
    }

    public TreeNode(SELF parent) {
        this(parent, null);
    }

    public TreeNode(SELF parent, String arcValue) {
        this.parent = parent == null ? null : new TreeNodeLink<>(parent, arcValue);
        this.level = parent == null ? 0 : parent.level + 1;
    }

    public void addChild(SELF child) {
        this.addChild(child, null);
    }

    public void addChild(SELF child, String arcValue) {
        TreeNodeLink<SELF> childNode = new TreeNodeLink(child, arcValue);
        children.add(childNode);
    }

    public int getLevel() {
        return level;
    }

    public TreeNodeLink<SELF> getParent() {
        return (TreeNodeLink<SELF>) parent;
    }

    public SELF findChild(String arcValue) {
        SELF child = null;
        for (TreeNodeLink<SELF> childLink : children) {
            if (arcValue.equals(childLink.getArcValue())) {
                child = childLink.getNode();
            }
        }
        return (SELF) child;
    }

    public List<TreeNodeLink<SELF>> getChildren() {
        return children;
    }
}
