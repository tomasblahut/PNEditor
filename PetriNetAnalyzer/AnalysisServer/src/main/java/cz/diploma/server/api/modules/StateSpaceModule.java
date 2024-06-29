package cz.diploma.server.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import cz.diploma.analysis.methods.statespace.StateSpaceGraph;
import gnu.trove.iterator.TIntIterator;
import gnu.trove.list.TIntList;
import gnu.trove.list.array.TIntArrayList;
import gnu.trove.set.TIntSet;
import gnu.trove.set.hash.TIntHashSet;
import java.io.IOException;
import org.json.JSONArray;
import org.json.JSONObject;

public class StateSpaceModule extends SimpleModule {

    public static class SSGSerializer extends JsonSerializer<StateSpaceGraph> {

        @Override
        public void serialize(StateSpaceGraph graph, JsonGenerator jg, SerializerProvider serializers) throws IOException, JsonProcessingException {
            try {
                TIntSet childrenToProcess = new TIntHashSet();
                TIntList nodesToProcess = new TIntArrayList();
                nodesToProcess.add(graph.getInitialNode());

                TIntSet addedNodes = new TIntHashSet();
                JSONObject jsonNodes = new JSONObject();
                JSONArray jsonEdges = new JSONArray();

                Integer nodeLimit = graph.getNodeLimit();
                while (!nodesToProcess.isEmpty()) {
                    childrenToProcess.clear();
                    addedNodes.addAll(nodesToProcess);

                    TIntIterator nodeIterator = nodesToProcess.iterator();
                    while (nodeIterator.hasNext()) {
                        int currentNode = nodeIterator.next();
                        int[] tokens = graph.getStateOf(currentNode);
                        boolean[] omega = graph.getOmegaOf(currentNode);

                        if (omega != null) {
                            for (int index = 0; index < omega.length; index++) {
                                if (omega[index]) {
                                    tokens[index] = -1;
                                }
                            }
                        }
                        JSONObject jsonNode = new JSONObject();
                        jsonNode.put("tokens", new JSONArray(tokens));
                        jsonNode.put("stateHash", graph.getStateHashOf(currentNode));

                        boolean nodeFullyConnected = true;
                        TIntSet successors = graph.getSuccessorsOf(currentNode);
                        TIntIterator successorIterator = successors.iterator();

                        while (successorIterator.hasNext()) {
                            int successor = successorIterator.next();
                            boolean successorVisited = addedNodes.contains(successor);
                            boolean nodesExceeded = nodeLimit != null && addedNodes.size() + childrenToProcess.size() >= nodeLimit;

                            if (!nodesExceeded || successorVisited) {
                                TIntSet edge = graph.getEdgeBetween(currentNode, successor);
                                JSONObject jsonEdge = new JSONObject();
                                jsonEdge.put("src", currentNode);
                                jsonEdge.put("dest", successor);
                                jsonEdge.put("transitions", edge.toArray());
                                jsonEdges.put(jsonEdge);
                            }

                            nodeFullyConnected = nodeFullyConnected && !nodesExceeded;
                            if (!nodesExceeded && !successorVisited) {
                                childrenToProcess.add(successor);
                            }
                        }

                        jsonNode.put("deadlock", successors.isEmpty());
                        jsonNode.put("fullyConnected", nodeFullyConnected);
                        jsonNodes.put(String.valueOf(currentNode), jsonNode);
                    }

                    nodesToProcess.clear();
                    nodesToProcess.addAll(childrenToProcess);
                }

                JSONObject ssJson = new JSONObject();
                ssJson.put("initialMarking", graph.getInitialNode());
                ssJson.put("markings", jsonNodes);
                ssJson.put("edges", jsonEdges);
                jg.writeRawValue(ssJson.toString());
            } catch (Exception ex) {
                throw new IOException("Error while serializing state space", ex);
            }
        }

        @Override
        public Class<StateSpaceGraph> handledType() {
            return StateSpaceGraph.class;
        }
    }

    public StateSpaceModule() {
        addSerializer(new SSGSerializer());
    }
}
