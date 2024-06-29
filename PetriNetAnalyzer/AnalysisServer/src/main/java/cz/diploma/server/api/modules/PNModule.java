/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package cz.diploma.server.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.utils.CollectionUtils;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import org.json.JSONObject;

public class PNModule extends SimpleModule {

    public static class NetDeserializer extends JsonDeserializer<PetriNet> {

        @Override
        public PetriNet deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException, JsonProcessingException {
            try {
                JsonNode node = jp.getCodec().readTree(jp);
                PetriNet net = new PetriNet();

                ArrayNode places = (ArrayNode) node.get("places");
                if (places == null) {
                    throw new IOException("Petri net is missing places");
                }

                List<Place> placeList = new ArrayList<Place>();
                for (JsonNode child : places) {
                    ObjectNode placeNode = (ObjectNode) child;

                    Place place = new Place(placeNode.get("id").asText());
                    place.setName(placeNode.get("name").asText());
                    place.setTokens(placeNode.get("tokens").asInt());
                    
                    place.setxCoord(placeNode.get("position").get("x").asDouble());
                    place.setyCoord(placeNode.get("position").get("y").asDouble());
                    
                    placeList.add(place);
                }
                CollectionUtils.sortById(placeList);
                net.getPlaces().addAll(placeList);

                ArrayNode transitions = (ArrayNode) node.get("transitions");
                if (transitions == null) {
                    throw new IOException("Petri net is missing transitions");
                }

                List<Transition> transitionList = new ArrayList<Transition>();
                for (JsonNode child : transitions) {
                    ObjectNode transNode = (ObjectNode) child;

                    Transition transition = new Transition(transNode.get("id").asText());
                    transition.setName(transNode.get("name").asText());
                    
                    transition.setxCoord(transNode.get("position").get("x").asDouble());
                    transition.setyCoord(transNode.get("position").get("y").asDouble());
                    
                    transitionList.add(transition);
                }
                CollectionUtils.sortById(transitionList);
                net.getTransitions().addAll(transitionList);

                ObjectNode arcs = (ObjectNode) node.get("arcs");
                if (arcs == null) {
                    throw new IOException("Petri net is missing arcs");
                }

                Iterator<Entry<String, JsonNode>> rowsIter = arcs.fields();
                while (rowsIter.hasNext()) {
                    Entry<String, JsonNode> row = rowsIter.next();
                    String rowKey = row.getKey();

                    ObjectNode columnNode = (ObjectNode) row.getValue();
                    Iterator<Entry<String, JsonNode>> colsIter = columnNode.fields();
                    while (colsIter.hasNext()) {
                        Entry<String, JsonNode> column = colsIter.next();
                        String colKey = column.getKey();
                        
                        JsonNode arcData = column.getValue();
                        net.addArc(rowKey, colKey, arcData.get("multiplicity").asInt());
                    }
                }

                return net;
            } catch (Exception ex) {
                throw new IOException("Error while parsing petri net", ex);
            }
        }

        @Override
        public Class<?> handledType() {
            return PetriNet.class;
        }
    }
    
    public static class NetSerializer extends JsonSerializer<PetriNet>
    {
        @Override
        public void serialize(PetriNet net, JsonGenerator jg, SerializerProvider sp) throws IOException, JsonProcessingException {
            try {
                Set<Place> places = net.getPlaces();
                Set<Transition> transitions = net.getTransitions();
                JSONObject jsonPlaces = new JSONObject();
                for (Place p : places)
                {
                    String id = p.getId();
                    double xCoord = p.getxCoord();
                    double yCoord = p.getyCoord();
                    JSONObject jsonPosition = new JSONObject();
                    jsonPosition.put("x", xCoord);
                    jsonPosition.put("y", yCoord);
                    
                    JSONObject jsonPlace = new JSONObject();
                    jsonPlace.put("position", jsonPosition);
                    jsonPlaces.put(id, jsonPlace);
                }
                
                JSONObject jsonTransitions = new JSONObject();
                for (Transition t : transitions)
                {
                    String id = t.getId();
                    double xCoord = t.getxCoord();
                    double yCoord = t.getyCoord();
                    JSONObject jsonPosition = new JSONObject();
                    jsonPosition.put("x", xCoord);
                    jsonPosition.put("y", yCoord);
                    
                    JSONObject jsonTrans = new JSONObject();
                    jsonTrans.put("position", jsonPosition);
                    jsonTransitions.put(id, jsonTrans);
                }
                
                JSONObject jsonPetriNet = new JSONObject();
                jsonPetriNet.put("places", jsonPlaces);
                jsonPetriNet.put("transitions", jsonTransitions);
                
                jg.writeRawValue(jsonPetriNet.toString());
                
            } catch (Exception ex) {
                throw new IOException("Error while serializing petri net", ex);
            } 
        }

        @Override
        public Class<PetriNet> handledType() {
            return PetriNet.class;
        }
    }

    public PNModule() {
        addDeserializer(PetriNet.class, new NetDeserializer());
        addSerializer(new NetSerializer());
    }
}
