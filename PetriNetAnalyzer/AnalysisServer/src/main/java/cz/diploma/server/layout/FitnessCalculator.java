package cz.diploma.server.layout;

import com.google.common.collect.Table.Cell;
import cz.diploma.shared.graphs.GraphNode;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.utils.CollectionUtils;
import java.awt.geom.Line2D;
import java.awt.geom.Rectangle2D;
import java.util.Set;

/**
 *
 * @author Petr
 */
public final class FitnessCalculator {

    private FitnessCalculator(){}
    
    /**
     * Calculates the fitness of the IndividualGraph
     * 
     * @param graph IndividualGraph representing the Petri net.
     * @return The fitness value.
     */
    public static int calculateFitness (IndividualGraph graph) {
        PetriNet pn = graph.getGraph();
        int fitness = 0;
        
        fitness += calculateNodeProximity(pn.getPlaces(), pn.getTransitions()) * 100;
        fitness += calculateEdgeCrosses(pn) * 15;
        fitness += calculateLineCrossingObjectFitness(pn) * 50;
        fitness += calculateLineLengthFitness(pn);
        fitness += calculateLineAnglesFitness(pn);
        
        return fitness;
    }
    
    /**
     * Calculates the amount of crossings between Petri net objects and arcs.
     * 
     * @param net Petri net.
     * @return The amount of crossings.
     */
    private static int calculateLineCrossingObjectFitness (PetriNet net) {
        int crossCount = 0;
        GraphNode src, dest;
        
        for (Cell<String, String, Arc> c : net.getArcs().cellSet()) {
            src = getPetriNetObject(c.getRowKey(), net);
            dest = getPetriNetObject(c.getColumnKey(), net);
            Line2D edge = new Line2D.Double(src.getxCoord(), src.getyCoord(), dest.getxCoord(), dest.getyCoord());
            
            for (Place p : net.getPlaces()) {
                if (p.getId().equals(src.getId()) || p.getId().equals(dest.getId())) {
                    continue;
                }
                Rectangle2D place = new Rectangle2D.Double(p.getxCoord() - 20, p.getyCoord() - 20, 40, 40);
                if (edge.intersects(place)) {
                    crossCount++;
                }
            }
            
            for (Transition t : net.getTransitions()) {
                if (t.getId().equals(src.getId()) || t.getId().equals(dest.getId())) {
                    continue;
                }
                Rectangle2D transition = new Rectangle2D.Double(t.getxCoord() - 10, t.getyCoord() - 20, 20, 40);
                if (edge.intersects(transition)) {
                    crossCount++;
                }
            }
        }
        return crossCount;
    }
    
    /**
     * Calculates the fitness of angles between all arcs of Petri net graph. 
     * 
     * @param net Petri net.
     * @return The fitness value of angles between arcs of the Petri net.
     */
    private static int calculateLineAnglesFitness (PetriNet net) {
        int fitness = 0;
        GraphNode src1, dest1, src2, dest2;
        
        for (Cell<String, String, Arc> c : net.getArcs().cellSet()) {
            src1 = getPetriNetObject(c.getRowKey(), net);
            dest1 = getPetriNetObject(c.getColumnKey(), net);
            
            for (Cell<String, String, Arc> c2 : net.getArcs().cellSet()) {
                src2 = getPetriNetObject(c2.getRowKey(), net);
                dest2 = getPetriNetObject(c2.getColumnKey(), net);
                
                if (src1.getId().equals(src2.getId()) && dest1.getId().equals(dest2.getId())) {
                    continue;
                }
                
                if ( (src1.getId().equals(src2.getId())) || (src1.getId().equals(dest2.getId())) 
                        || (src2.getId().equals(dest1.getId())) || (dest1.getId().equals(dest2.getId())) ) {
                    Line2D edge1 = new Line2D.Double(src1.getxCoord(), src1.getyCoord(), dest1.getxCoord(), dest1.getyCoord());
                    Line2D edge2 = new Line2D.Double(src2.getxCoord(), src2.getyCoord(), dest2.getxCoord(), dest2.getyCoord());
                    double angle = angleBetween2Lines(edge1, edge2);
                    if (angle < 0) {
                        angle += 360;
                    }
                    
                    int eval = evaluateAngles(angle);
                    fitness += eval;
                }
            }
        }
        fitness /= 2;
        return fitness;
    }
    
    private static double angleBetween2Lines(Line2D line1, Line2D line2) {
        double angle1 = Math.toDegrees(Math.atan2(line1.getY1() - line1.getY2(),
                                   line1.getX1() - line1.getX2()));
        double angle2 = Math.toDegrees(Math.atan2(line2.getY1() - line2.getY2(),
                                   line2.getX1() - line2.getX2()));
        return angle1-angle2;
    }
    
    /**
     * Calculates the fitness of arc lengths of the Petri net.
     * 
     * @param net Petri net.
     * @return The fitness value.
     */
    private static int calculateLineLengthFitness (PetriNet net) {
        int fitness = 0;
        double length;
        
        GraphNode src1, dest1;
        
        for (Cell<String, String, Arc> c : net.getArcs().cellSet()) {
            src1 = getPetriNetObject(c.getRowKey(), net);
            dest1 = getPetriNetObject(c.getColumnKey(), net);
            
            length = Math.sqrt( Math.pow(src1.getxCoord() - dest1.getxCoord(), 2) + Math.pow(src1.getyCoord() - dest1.getyCoord(), 2) );
            int evaluation = evaluateLineLength(length);
            fitness += evaluation;
        }
        return fitness;
    }
    
    /**
     * Evaluates the length of the arc. Too short lines or too long lines are penalized. The ideal length is set to be between 150 and 250. If the arc has length in this range,
     * the evaluation is negative, which lowers the fitness value of the graph.
     * 
     * @param length Length of the arc.
     * @return Evaluation of the arc length.
     */
    private static int evaluateLineLength (double length) {
        int evaluation = 0;
        
        if (length < 5) {
            evaluation += 8;
        }
        else if (length < 10) {
            evaluation += 7;
        }
        else if (length < 20) {
            evaluation += 6;
        }
        else if (length < 30) {
            evaluation += 5;
        }
        else if (length < 40) {
            evaluation += 4;
        }
        else if (length < 50) {
            evaluation += 3;
        }
        else if (length < 80) {
            evaluation += 2;
        }
        else if (length < 150) {
            evaluation++;
        }
        else if (length >= 150 && length <= 250) {
            evaluation -= 3;
        }
        else if (length > 250) {
            evaluation++;
        }
        else if (length > 400) {
            evaluation += 5;
        }
        else if (length > 550) {
            evaluation += 10;
        }
        
        return evaluation;
    }
    
    /**
     * Evaluates the angle between two arcs. The small angles or big angles are penalized. The "nice" angles got negative evaluation, 
     * which lowers the fitness value of the graph. "Nice" angles are 45 deg., 180 deg. and especially 90/270 deg. 
     * 
     * @param angle Angle between two arcs. 
     * @return Evaluation of the angle between two arcs.
     */
    private static int evaluateAngles (double angle) {
        int evaluation = 0;
        if ((angle < 30) ||  (angle > 330) ){
            evaluation += 2;
        }
        else if ((angle < 20) ||  (angle > 340) ){
            evaluation += 4;
        }
        else if ((angle < 10) ||  (angle > 350) ){
            evaluation = evaluation + 7;
        }
        else if ((angle < 5) ||  (angle > 355) ){
            evaluation = evaluation + 10;
        }

        if (angle == 180) {
            evaluation -= 10;
        }
        else if (angle == 90 || angle == 270) {
            evaluation -= 20;
        }
        else if (angle == 45) {
            evaluation -= 8;
        }
        else {
            evaluation++;
        }

        return evaluation;
    }
    
    /**
     * Calculates the amount of crossings between arcs. 
     * 
     * @param net Petri net.
     * @return The amount of crossings between arcs of Petri net.
     */
    private static int calculateEdgeCrosses (PetriNet net) {
        int count = 0;
        GraphNode src1, dest1, src2, dest2;
        
        for (Cell<String, String, Arc> c : net.getArcs().cellSet()) {
            src1 = getPetriNetObject(c.getRowKey(), net);
            dest1 = getPetriNetObject(c.getColumnKey(), net);
            
            for (Cell<String, String, Arc> c2 : net.getArcs().cellSet()) {
                src2 = getPetriNetObject(c2.getRowKey(), net);
                dest2 = getPetriNetObject(c2.getColumnKey(), net);
                
                if ( (!src1.getId().equals(src2.getId())) && (!src1.getId().equals(dest2.getId())) 
                        && (!src2.getId().equals(dest1.getId())) && (!dest1.getId().equals(dest2.getId())) ) {
                    Line2D edge1 = new Line2D.Double(src1.getxCoord(), src1.getyCoord(), dest1.getxCoord(), dest1.getyCoord());
                    Line2D edge2 = new Line2D.Double(src2.getxCoord(), src2.getyCoord(), dest2.getxCoord(), dest2.getyCoord());
                    if (edge1.intersectsLine(edge2)) {
                        count++;
                    }
                }
            }
        }
        return count / 2;
    }
    
    private static GraphNode getPetriNetObject (String id, PetriNet net) {
        GraphNode pnObj = CollectionUtils.findById(net.getPlaces(), id);
        if (pnObj == null) {
            pnObj = CollectionUtils.findById(net.getTransitions(), id);
        }

        return pnObj;
    }
    
    /**
     * Calculates the amount of objects that are too close to each other. It detects any two objects that are closer to each other than the minimum distance. <br>
     * Every pair of these objects is counted as 1.
     * 
     * @param places Set of places of the Petri net.
     * @param transitions Set of transitions of the Petri net.
     * @return The amount of objects too close to each other.
     */
    private static int calculateNodeProximity (Set<Place> places, Set<Transition> transitions) {
        int ppCount = 0;
        int ptCount = 0;
        int ttCount = 0;
        int count = 0;
        int minDistance = 70;
        for (Place p : places) {
            for (Place p2 : places) {
                if (!p.getId().equals(p2.getId())) {
                    if ((Math.abs(p.getxCoord() - p2.getxCoord()) <= minDistance) && (Math.abs(p.getyCoord() - p2.getyCoord()) <= minDistance)) {
                        ppCount++;
                    }
                }
            }
            
            for (Transition t : transitions) {
                if ((Math.abs(p.getxCoord() - t.getxCoord()) <= minDistance) && (Math.abs(p.getyCoord() - t.getyCoord()) <= minDistance)) {
                    ptCount++;
                }
            }
        }
        
        for (Transition t : transitions) {
            for (Transition t2 : transitions) {
                if (!t.getId().equals(t2.getId())) {
                    if ((Math.abs(t.getxCoord() - t2.getxCoord()) <= minDistance) && (Math.abs(t.getyCoord() - t2.getyCoord()) <= minDistance)) {
                        ttCount++;
                    }
                }
            }
        }
        count = (ppCount / 2) + (ttCount / 2) + ptCount;
        return count;
    }
}
