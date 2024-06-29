package cz.diploma.analysis.methods.classification;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Map;

public abstract class SubclassTest {

    public SubclassResult testSubclass(PetriNet net, Map<NetSubclass, SubclassResult> results) {
        SubclassResult result = new SubclassResult(getNetSubclass());
        doTestSubclass(result, net, results);
        return result;
    }

    public abstract NetSubclass getNetSubclass();

    protected abstract void doTestSubclass(SubclassResult result, PetriNet net, Map<NetSubclass, SubclassResult> results);
}
