package cz.diploma.analysis.methods.classification;

import com.google.common.collect.Table;
import com.google.common.collect.Table.Cell;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Map;

public class OrdinaryTest extends SubclassTest {

    private static final String ARC_VIOLATIONS_KEY = "arcViolations";

    //--
    private class OrdinaryViolation implements Serializable {

        private final String srcId;
        private final String destId;

        public OrdinaryViolation(String srcId, String destId) {
            this.srcId = srcId;
            this.destId = destId;
        }

        public String getSrcId() {
            return srcId;
        }

        public String getDestId() {
            return destId;
        }
    }

    @Override
    public NetSubclass getNetSubclass() {
        return NetSubclass.ORDINARY;
    }

    @Override
    public void doTestSubclass(SubclassResult result, PetriNet net, Map<NetSubclass, SubclassResult> results) {
        Table<String, String, Arc> arcs = net.getArcs();
        ArrayList<OrdinaryViolation> violations = new ArrayList<>();

        for (Cell<String, String, Arc> cell : arcs.cellSet()) {
            String srcId = cell.getRowKey();
            String destId = cell.getColumnKey();
            Arc arc = cell.getValue();

            if (arc != null && arc.getMultiplicity() > 1) {
                violations.add(new OrdinaryViolation(srcId, destId));
            }
        }

        boolean matches = violations.isEmpty();
        String reason = matches ? "Multiplicity of each arc is equal to one" : "Multiplicity of at least one arc is not equal to one";

        result.setMatches(matches);
        result.setReason(reason);
        if (!matches) {
            result.getAdditionalData().put(ARC_VIOLATIONS_KEY, violations);
        }
    }
}
