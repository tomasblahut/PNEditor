package cz.diploma.shared.graphs.conversion;

import com.google.common.collect.Table.Cell;
import cz.diploma.shared.graphs.DirectedGraph;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import java.util.HashMap;
import java.util.Map;

public class PetriNetToDirectedGraph {

    public static DirectedGraph convert(PetriNet net, Map<String, Integer> mapping) {
        DirectedGraph<Integer> graph = new DirectedGraph<>();

        for (Place place : net.getPlaces()) {
            int id = mapping.get(place.getId());
            graph.addNode(id);
        }

        for (Transition trans : net.getTransitions()) {
            int id = mapping.get(trans.getId());
            graph.addNode(id);
        }

        for (Cell<String, String, Arc> cell : net.getArcs().cellSet()) {
            int srcNodeId = mapping.get(cell.getRowKey());
            int destNodeId = mapping.get(cell.getColumnKey());
            Arc arc = cell.getValue();

            if (arc != null) {
                graph.setEdgeBetween(srcNodeId, destNodeId, arc.getMultiplicity());
            }
        }

        return graph;
    }

    public static DirectedGraph convert(PetriNet net) {
        Map<String, Integer> netIdToGraphId = new HashMap<>();
        for (Place place : net.getPlaces()) {
            int id = netIdToGraphId.size() + 1;
            netIdToGraphId.put(place.getId(), id);
        }

        for (Transition trans : net.getTransitions()) {
            int id = netIdToGraphId.size() + 1;
            netIdToGraphId.put(trans.getId(), id);
        }

        return PetriNetToDirectedGraph.convert(net, netIdToGraphId);
    }
}
