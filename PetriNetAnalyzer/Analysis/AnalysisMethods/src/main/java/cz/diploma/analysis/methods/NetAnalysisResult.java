package cz.diploma.analysis.methods;

import java.util.ArrayList;
import java.util.List;

public abstract class NetAnalysisResult {

    private final NetAnalysisMethod method;
    private final List<String> errors = new ArrayList<>();

    public NetAnalysisResult(NetAnalysisMethod method) {
        this.method = method;
    }

    public NetAnalysisMethod getMethod() {
        return method;
    }

    public List<String> getErrors() {
        return errors;
    }

    public void appendError(String error) {
        this.errors.add(error);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
