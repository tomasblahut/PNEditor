package cz.diploma.shared.graphs.tree;

public class TreeNodeLink<T extends TreeNode> {

    private final T node;
    private final String arcValue;

    public TreeNodeLink(T node, String arcValue) {
        this.node = node;
        this.arcValue = arcValue;
    }

    public T getNode() {
        return node;
    }

    public String getArcValue() {
        return arcValue;
    }
}
