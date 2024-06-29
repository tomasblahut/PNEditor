package cz.diploma.analysis.methods.classification;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class SubclassResult {

    private final NetSubclass type;
    private boolean matches;
    private String reason;
    private final Map<String, Serializable> additionalData = new HashMap<>();

    public SubclassResult(NetSubclass type) {
        this.type = type;
    }

    public NetSubclass getType() {
        return type;
    }

    public boolean isMatches() {
        return matches;
    }

    public void setMatches(boolean matches) {
        this.matches = matches;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Map<String, Serializable> getAdditionalData() {
        return additionalData;
    }
}
