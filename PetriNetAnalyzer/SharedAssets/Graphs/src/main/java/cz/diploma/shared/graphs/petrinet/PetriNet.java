package cz.diploma.shared.graphs.petrinet;

import com.google.common.collect.HashBasedTable;
import com.google.common.collect.Table;
import cz.diploma.shared.graphs.GraphNode;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

public class PetriNet {

    Set<Place> places = new LinkedHashSet<>();
    Set<Transition> transitions = new LinkedHashSet<>();
    Table<String, String, Arc> arcs = HashBasedTable.create(); //Src node Id, Dest node Id, Arc

    public PetriNet() {

    }
    
    public PetriNet(Set<Place> places, Set<Transition> transitions, Table<String, String, Arc> arcs) {
        this.places = places;
        this.transitions = transitions;
        this.arcs = arcs;
    }

    public Set<Place> getPlaces() {
        return places;
    }

    protected void setPlaces(Set<Place> places) {
        this.places = places;
    }

    public Set<Transition> getTransitions() {
        return transitions;
    }

    protected void setTransitions(Set<Transition> transitions) {
        this.transitions = transitions;
    }

    public Table<String, String, Arc> getArcs() {
        return arcs;
    }

    protected void setArcs(Table<String, String, Arc> arcs) {
        this.arcs = arcs;
    }

    public void addPlace(Place place) {
        if (!CollectionUtils.containsById(places, place)) {
            this.places.add(place);
        }
    }

    public void addTransition(Transition transition) {
        if (!CollectionUtils.containsById(transitions, transition)) {
            this.transitions.add(transition);
        }
    }

    public void addArc(String srcId, String destId, int multiplicity) throws Exception {
        GraphNode srcObj = identifyNetObject(srcId);
        GraphNode destObj = identifyNetObject(destId);

        if (arcs.contains(srcObj.getId(), destObj.getId())) {
            throw new Exception("There is already a connection from " + srcId + " to " + destId);
        }

        Arc arc = new Arc();
        arc.setMultiplicity(multiplicity);
        arcs.put(srcObj.getId(), destObj.getId(), arc);
    }

    public Map<Place, Arc> findConnectedPlaces(Transition transition, boolean input) {
        String transId = transition.getId();
        Map<String, Arc> ownConnections = input ? arcs.column(transId) : arcs.row(transId);

        Map<Place, Arc> connectedPlaces = new HashMap<>();
        if (!ownConnections.isEmpty()) {
            Map<String, Place> placeIdMap = CollectionUtils.mapById(places);

            for (Entry<String, Arc> connectedPlace : ownConnections.entrySet()) {
                Arc arc = connectedPlace.getValue();
                Place ownPlace = placeIdMap.get(connectedPlace.getKey());
                connectedPlaces.put(ownPlace, arc);
            }
        }

        return connectedPlaces;
    }

    public Map<Transition, Arc> findConnectedTransitions(Place place, boolean input) {
        String placeId = place.getId();
        Map<String, Arc> ownConnections = input ? arcs.column(placeId) : arcs.row(placeId);

        Map<Transition, Arc> connectedTransitions = new HashMap<>();
        if (!ownConnections.isEmpty()) {
            Map<String, Transition> transitionIdMap = CollectionUtils.mapById(transitions);

            for (Entry<String, Arc> connectedTransition : ownConnections.entrySet()) {
                Arc arc = connectedTransition.getValue();
                Transition ownTransition = transitionIdMap.get(connectedTransition.getKey());
                connectedTransitions.put(ownTransition, arc);
            }
        }

        return connectedTransitions;
    }

    public Map<Transition, Arc> findConnectedTransitions(Place place) {
        Map<Transition, Arc> connectedTransitions = new HashMap<>();
        connectedTransitions.putAll(findConnectedTransitions(place, true));
        connectedTransitions.putAll(findConnectedTransitions(place, false));
        return connectedTransitions;
    }

    private GraphNode identifyNetObject(String id) throws Exception {
        GraphNode pnObj = CollectionUtils.findById(places, id);
        if (pnObj == null) {
            pnObj = CollectionUtils.findById(transitions, id);
        }

        if (pnObj == null) {
            throw new Exception("Petri net does not contain object with id : " + id);
        }

        return pnObj;
    }
}
