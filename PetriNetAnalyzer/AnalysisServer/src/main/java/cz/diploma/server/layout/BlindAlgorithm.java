package cz.diploma.server.layout;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

/**
 *
 * @author Petr
 */
public class BlindAlgorithm {
    private static  int gridX = 8;
    private static  int gridY = 6;
    
    private PetriNet originalNet;
    private int minX;
    private int minY;
    private int maxX;
    private int maxY;
    
    private List<IndividualGraph> graphs;
    private PetriNet bestGraph;

    public BlindAlgorithm(PetriNet petriNet) {
        this.originalNet = petriNet;
        this.minX = 50;
        this.minY = 50;
        this.maxX = 1000;
        this.maxY = 1000;
        this.graphs = new ArrayList<>();
    }

    public BlindAlgorithm(PetriNet petriNet, int minX, int minY, int maxX, int maxY) {
        this.originalNet = petriNet;
        this.minX = minX;
        this.minY = minY;
        this.maxX = maxX;
        this.maxY = maxY;
        this.graphs = new ArrayList<>();
    }
    
    /**
     * Calculates bounds of the individual graphs. The bounds are obtained from the coordinations of Petri net objects. <br><br>
     * If the calculated dimensions of the area are too small, they are recalculated by using number of Petri net objects. There is a minimum width and height of the area 
     * depending on the number of Petri net objects. This mechanism ensures that there is enough space for all objects in the generated individual graphs.
     * 
     */
    public void calculateBounds () {
        int tempMinX = Integer.MAX_VALUE, tempMinY = Integer.MAX_VALUE, tempMaxX = 0, tempMaxY = 0;
        
        int numOfNodes = getOriginalNet().getPlaces().size() + getOriginalNet().getTransitions().size();
        
        for (Place p : getOriginalNet().getPlaces()) {
            if (p.getxCoord() < tempMinX) {
                tempMinX = (int) p.getxCoord();
            }
            if (p.getxCoord() > tempMaxX) {
                tempMaxX = (int) p.getxCoord();
            }
            if (p.getyCoord() < tempMinY) {
                tempMinY = (int) p.getyCoord();
            }
            if (p.getyCoord() > tempMaxY) {
                tempMaxY = (int) p.getyCoord();
            }
        }
        
        for (Transition t : getOriginalNet().getTransitions()) {
            if (t.getxCoord() < tempMinX) {
                tempMinX = (int) t.getxCoord();
            }
            if (t.getxCoord() > tempMaxX) {
                tempMaxX = (int) t.getxCoord();
            }
            if (t.getyCoord() < tempMinY) {
                tempMinY = (int) t.getyCoord();
            }
            if (t.getyCoord() > tempMaxY) {
                tempMaxY = (int) t.getyCoord();
            }
        }
        
        int dimension = (int) Math.sqrt(numOfNodes) + 1;
        int xDimension = dimension * 200;
        int yDimension = dimension * 140;
        
        gridX = dimension + 3;
        gridY = dimension + 1;
        
        int shiftX = tempMinX - 100;
        int shiftY = tempMinY - 100;
        
        if (tempMaxX - tempMinX < xDimension) {
            tempMaxX = tempMinX + xDimension;
        }
        if (tempMaxY - tempMinY < yDimension) {
            tempMaxY = tempMinY + yDimension;
        }
        
        setMinX(tempMinX - shiftX);
        setMinY(tempMinY - shiftY);
        setMaxX(tempMaxX - shiftX);
        setMaxY(tempMaxY - shiftY);
    }
    
    /**
     * Generates the specified amount of graphs. It also adds original graph into the List of generated graphs, so the original one can be chosen as the best 
     * if there will be no better alternative. 
     * 
     * @param count The amount of graphs that will be generated.
     */
    public void generateIndividualGraphs (int count) {
        IndividualGraph original = new IndividualGraph(originalNet);
        original.calculateFitness();
        graphs.add(original);
        for (int i = 0; i < count; i++)
        {
            graphs.add(generateIndividualGraph(originalNet, minX, minY, maxX, maxY));
        }
    }
    
    /**
     * Finds the best graph out of all generated graphs. The best graph is the one with the lowest value of fitness.
     */
    public void findBestGraph () {
        IndividualGraph tempBest = graphs.get(0);
        for (IndividualGraph ig : graphs)
        {
            if (ig.getFitness() < tempBest.getFitness())
            {
                tempBest = ig;
            }
        }
        bestGraph = tempBest.getGraph();
    }
    
    /**
     * Generates new coordinations for all places and transitions. Every coordination is generated using psuedorandom int generator Random and adjusted acording to a grid. <br>
     * Then this method creates new Petri net representation, new IndividualGraph and it calculates the fitness value of this IndividualGraph.
     * 
     * @param petriNet The original Petri net.
     * @param minX The minimum value of X coordination.
     * @param minY The minimum value of Y coordination.
     * @param maxX The maximum value of X coordination.
     * @param maxY The maximum value of Y coordination.
     * @return Individual graph with newly generated coordinations of places and transitions and with its fitness value.
     */
    private IndividualGraph generateIndividualGraph (PetriNet petriNet, int minX, int minY, int maxX, int maxY) {
        Random rand = new Random();
        int randomX = 0, randomY = 0;
        int newX = 0, newY = 0;
        
        int stepX = (maxX - minX) / gridX;
        int stepY = (maxY - minY) / gridY;
        
        Set<Place> newPlaces = new LinkedHashSet<>();
        Set<Transition> newTransitions = new LinkedHashSet<>();
        
        for (Place p : petriNet.getPlaces()) {
            randomX = rand.nextInt(maxX - minX) + minX;
            randomY = rand.nextInt(maxY - minY) + minY;
            int iX = minX;
            int iY = minY;
            
            while (randomX >= iX) {
                if (randomX <= (iX + stepX)) {
                    newX = iX;
                }
                iX += stepX;
            }
            while (randomY >= iY) {
                if (randomY <= (iY + stepY)) {
                    newY = iY;
                }
                iY += stepY;
            }
            
            newPlaces.add(new Place(p.getId(), newX, newY));
        }
        
        for (Transition t : petriNet.getTransitions()) {
            randomX = rand.nextInt(maxX - minX) + minX;
            randomY = rand.nextInt(maxY - minY) + minY;
            int iX = minX;
            int iY = minY;
            
            while (randomX >= iX) {
                if (randomX <= (iX + stepX)) {
                    newX = iX;
                }
                iX += stepX;
            }
            while (randomY >= iY) {
                if (randomY <= (iY + stepY)) {
                    newY = iY;
                }
                iY += stepY;
            }
            newTransitions.add(new Transition(t.getId(), newX, newY));
        }
        PetriNet net = new PetriNet(newPlaces, newTransitions, petriNet.getArcs());
        IndividualGraph newGraph = new IndividualGraph(net);
        newGraph.calculateFitness();
        return newGraph;
    }

    public PetriNet getOriginalNet() {
        return originalNet;
    }

    public void setOriginalNet(PetriNet originalNet) {
        this.originalNet = originalNet;
    }

    public int getMinX() {
        return minX;
    }

    public void setMinX(int minX) {
        this.minX = minX;
    }

    public int getMinY() {
        return minY;
    }

    public void setMinY(int minY) {
        this.minY = minY;
    }

    public int getMaxX() {
        return maxX;
    }

    public void setMaxX(int maxX) {
        this.maxX = maxX;
    }

    public int getMaxY() {
        return maxY;
    }

    public void setMaxY(int maxY) {
        this.maxY = maxY;
    }

    public List<IndividualGraph> getGraphs() {
        return graphs;
    }

    public void setGraphs(List<IndividualGraph> graphs) {
        this.graphs = graphs;
    }
    
    public void addGraph (IndividualGraph graph) {
        this.graphs.add(graph);
    }
    
    public PetriNet getBestGraph() {
        return bestGraph;
    }

    public void setBestGraph(PetriNet bestGraph) {
        this.bestGraph = bestGraph;
    }
    
}
