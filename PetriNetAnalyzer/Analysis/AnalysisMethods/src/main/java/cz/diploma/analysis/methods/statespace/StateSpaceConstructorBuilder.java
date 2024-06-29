package cz.diploma.analysis.methods.statespace;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.utils.StringUtils;
import java.util.Map;

public class StateSpaceConstructorBuilder {

    public static final String PARAM_IGNORE_COVERING = "ignoreCovering";
    public static final String PARAM_LAZY_COVERING_LEVEL = "lazyCoveringLevel";
    public static final String PARAM_EXPAND_WHOLE_TREE = "expandWholeTree";
    public static final String PARAM_GRAPH_NODE_LIMIT = "graphNodeLimit";
    //--
    private final StateSpaceConstructor ssConstructor;

    public StateSpaceConstructorBuilder(PetriNet net) {
        this.ssConstructor = new StateSpaceConstructor(net);
    }

    public StateSpaceConstructorBuilder ignoreCovering() {
        ssConstructor.setIgnoreCovering(true);
        return this;
    }

    public StateSpaceConstructorBuilder usingLazyCovering(int level) {
        ssConstructor.setLazyCoveringLevel(level);
        return this;
    }

    public StateSpaceConstructorBuilder expandingAllTreeBranches(boolean expanding) {
        ssConstructor.setExpandWholeTree(expanding);
        return this;
    }

    public StateSpaceConstructorBuilder limitGraphNodesTo(Integer nodeCount) {
        ssConstructor.setNodeLimit(nodeCount);
        return this;
    }

    public StateSpaceConstructorBuilder usingSettings(Map<String, String> settings) {
        if (settings.containsKey(PARAM_IGNORE_COVERING)) {
            String paramStr = settings.get(PARAM_IGNORE_COVERING);
            ssConstructor.setIgnoreCovering(Boolean.parseBoolean(paramStr));
        }

        if (settings.containsKey(PARAM_LAZY_COVERING_LEVEL)) {
            String paramStr = settings.get(PARAM_LAZY_COVERING_LEVEL);
            ssConstructor.setLazyCoveringLevel(Integer.parseInt(paramStr));
        }

        if (settings.containsKey(PARAM_EXPAND_WHOLE_TREE)) {
            String paramsStr = settings.get(PARAM_EXPAND_WHOLE_TREE);
            ssConstructor.setExpandWholeTree(Boolean.parseBoolean(paramsStr));
        }

        if (settings.containsKey(PARAM_GRAPH_NODE_LIMIT)) {
            String paramsStr = settings.get(PARAM_GRAPH_NODE_LIMIT);
            if (!StringUtils.isNullOrEmpty(paramsStr)) {
                ssConstructor.setNodeLimit(Integer.parseInt(paramsStr));
            }
        }
        return this;
    }

    public StateSpaceConstructor get() {
        return ssConstructor;
    }
}
