package cz.diploma.analysis.methods;

import cz.diploma.analysis.methods.validation.InvalidPetriNetException;
import cz.diploma.analysis.methods.validation.PetriNetValidator;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public abstract class NetAnalysis<T extends NetAnalysisResult> {

    private final Logger log = Logger.getLogger(getClass().getName());

    public T performAnalysis(PetriNet net, Map<String, String> settings) throws Exception {
        Class<T> resultClass = getResultClass();
        if (resultClass == null) {
            throw new Exception("Analysis calculator " + getClass().getName() + " does not specify it's result class");
        }
        T result = resultClass.newInstance();

        try {
            PetriNetValidator validator = getNetValidator();
            if (validator != null) {
                validator.validatePetriNet(net);
            }

            doPerformAnalysis(result, net, settings);
        } catch (Exception ex) {
            if (ex instanceof InvalidPetriNetException) {
                InvalidPetriNetException ipnex = (InvalidPetriNetException) ex;
                for (String violation : ipnex.getViolations()) {
                    result.appendError(violation);
                }
            } else {
                result.appendError("An error has occured while performing this analysis. For detail information see server log output.");
                log.log(Level.SEVERE, "Error while performing analysis", ex);
            }
        }

        return result;
    }

    protected abstract Class<T> getResultClass();

    protected abstract PetriNetValidator getNetValidator();

    protected abstract void doPerformAnalysis(T result, PetriNet net, Map<String, String> settings) throws Exception;
}
