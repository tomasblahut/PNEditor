package cz.diploma.analysis.testing;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class NetPropertyTestResult implements Serializable {

    private final NetProperty type;
    private TestResultStatus status;
    private final List<String> reasons = new ArrayList<>();
    private final List<String> errors = new ArrayList<>();
    private final Map<String, Serializable> additionalData = new HashMap<>();

    public static class NetPropertyResultBuilder {

        private final NetPropertyTestResult result;

        public NetPropertyResultBuilder(NetProperty netProperty) {
            this.result = new NetPropertyTestResult(netProperty);
        }

        public NetPropertyResultBuilder setStatus(TestResultStatus status) {
            this.result.status = status;
            return this;
        }

        public NetPropertyResultBuilder addReason(String reason) {
            this.result.reasons.add(reason);
            return this;
        }

        public NetPropertyResultBuilder logError(String error) {
            this.result.errors.add(error);
            return this;
        }

        public NetPropertyResultBuilder addAdditionalData(Map<String, Serializable> data) {
            if (data != null) {
                this.result.additionalData.putAll(data);
            }
            return this;
        }

        public NetPropertyTestResult result() {
            return this.result;
        }
    }

    protected NetPropertyTestResult(NetProperty type) {
        this.type = type;
    }

    public NetProperty getType() {
        return type;
    }

    public TestResultStatus getStatus() {
        return status;
    }

    public List<String> getReasons() {
        return reasons;
    }

    public List<String> getErrors() {
        return errors;
    }

    public Map<String, Serializable> getAdditionalData() {
        return additionalData;
    }
}
