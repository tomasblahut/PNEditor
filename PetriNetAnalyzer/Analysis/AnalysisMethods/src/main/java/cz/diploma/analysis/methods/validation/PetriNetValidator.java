package cz.diploma.analysis.methods.validation;

import cz.diploma.analysis.methods.validation.conditions.PetriNetCondition;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public abstract class PetriNetValidator {

    public void validatePetriNet(PetriNet net) throws InvalidPetriNetException {
        Set<PetriNetCondition> conditions = getCheckedConditions();
        List<String> conditionFailures = new ArrayList<>();

        for (PetriNetCondition condition : conditions) {
            boolean meets = condition.meetsCondition(net);
            if (!meets) {
                conditionFailures.add(condition.getErrorMessage());
            }
        }

        ConditionConnector connector = getConnector();
        boolean shouldThrow = (ConditionConnector.AND == connector && !conditionFailures.isEmpty())
                || (ConditionConnector.OR == connector && conditionFailures.size() == conditions.size());

        if (shouldThrow) {
            InvalidPetriNetException exception = new InvalidPetriNetException();
            exception.getViolations().addAll(conditionFailures);
            throw exception;
        }
    }

    protected abstract ConditionConnector getConnector();

    protected abstract Set<PetriNetCondition> getCheckedConditions();
}
