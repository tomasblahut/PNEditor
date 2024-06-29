package cz.diploma.analysis.methods.invariant;

import java.util.ArrayList;
import java.util.List;

public class TInvariant extends Invariant {

    private final List<List<String>> system = new ArrayList();

    public List<List<String>> getSystem() {
        return system;
    }

    public TInvariant() {
    }
}
