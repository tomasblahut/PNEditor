package cz.diploma.analysis.methods.invariant;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import java.util.ArrayList;
import java.util.List;

public class InvariantAnalysisResult extends NetAnalysisResult {

    private final List<PInvariant> pInvariants = new ArrayList<>();
    private final List<TInvariant> tInvariants = new ArrayList<>();

    public InvariantAnalysisResult() {
        super(NetAnalysisMethod.INVARIANT);
    }

    public List<PInvariant> getpInvariants() {
        return pInvariants;
    }

    public List<TInvariant> gettInvariants() {
        return tInvariants;
    }
}
