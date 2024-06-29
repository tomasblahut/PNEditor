package cz.diploma.analysis.methods.cycles;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CyclesAnalysisResult extends NetAnalysisResult {

    private final List<PNCycle> cycles = new ArrayList<>();
    private final Set<String> placesNotCovered = new HashSet<>();
    private final Set<String> transitionsNotCovered = new HashSet<>();

    public CyclesAnalysisResult() {
        super(NetAnalysisMethod.CYCLES);
    }

    public List<PNCycle> getCycles() {
        return cycles;
    }

    public Set<String> getPlacesNotCovered() {
        return placesNotCovered;
    }

    public Set<String> getTransitionsNotCovered() {
        return transitionsNotCovered;
    }
}
