package cz.diploma.analysis.methods.trapcotrap;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import java.util.ArrayList;
import java.util.List;

public class TrapCotrapAnalysisResult extends NetAnalysisResult {

    private final List<PlaceSubset> cotraps = new ArrayList<>();
    private final List<PlaceSubset> traps = new ArrayList<>();

    public TrapCotrapAnalysisResult() {
        super(NetAnalysisMethod.TRAP_COTRAP);
    }

    public List<PlaceSubset> getCotraps() {
        return cotraps;
    }

    public List<PlaceSubset> getTraps() {
        return traps;
    }
}
