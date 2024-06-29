package cz.diploma.shared.graphs.tree;

import java.util.ArrayList;
import java.util.List;

public class Tree<T extends TreeNode> {

    protected final T root;

    public Tree(T root) {
        this.root = root;
    }

    public T getRoot() {
        return root;
    }

    public List<String> traceToRoot(T node) {
        List<String> arcValues = new ArrayList<>();

        TreeNodeLink parentLink = node.getParent();
        while (parentLink != null) {
            arcValues.add(parentLink.getArcValue());
            parentLink = parentLink.getNode().getParent();
        }

        return arcValues;
    }
}
