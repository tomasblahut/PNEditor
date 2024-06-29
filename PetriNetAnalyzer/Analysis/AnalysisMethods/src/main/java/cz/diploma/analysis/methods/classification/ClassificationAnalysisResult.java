package cz.diploma.analysis.methods.classification;

import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.NetAnalysisResult;
import java.util.ArrayList;
import java.util.List;

public class ClassificationAnalysisResult extends NetAnalysisResult {

    private final List<SubclassResult> subclassResults = new ArrayList<>();

    public ClassificationAnalysisResult() {
        super(NetAnalysisMethod.CLASSIFICATION);
    }

    public List<SubclassResult> getSubclassResults() {
        return subclassResults;
    }

    public boolean isOfType(NetSubclass subclass) {
        boolean matchesType = false;

        for (SubclassResult result : subclassResults) {
            if (result.getType().equals(subclass)) {
                matchesType = result.isMatches();
                break;
            }
        }

        return matchesType;
    }
}
