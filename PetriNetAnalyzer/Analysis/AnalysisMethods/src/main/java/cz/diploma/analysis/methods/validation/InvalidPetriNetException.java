package cz.diploma.analysis.methods.validation;

import java.util.ArrayList;
import java.util.List;

public class InvalidPetriNetException extends Exception {

    private List<String> violations = new ArrayList<>();

    public List<String> getViolations() {
        return violations;
    }
}
