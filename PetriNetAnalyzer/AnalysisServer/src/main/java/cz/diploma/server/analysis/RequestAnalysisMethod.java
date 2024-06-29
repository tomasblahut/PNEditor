package cz.diploma.server.analysis;

import java.util.Map;

public class RequestAnalysisMethod {

    private String type;
    private Map<String, String> preferences;

    public RequestAnalysisMethod() {
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Map<String, String> getPreferences() {
        return preferences;
    }

    public void setPreferences(Map<String, String> preferences) {
        this.preferences = preferences;
    }
}
