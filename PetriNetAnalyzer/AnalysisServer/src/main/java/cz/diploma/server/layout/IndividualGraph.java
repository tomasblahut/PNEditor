package cz.diploma.server.layout;

import cz.diploma.shared.graphs.petrinet.PetriNet;

/**
 *
 * @author Petr
 */
public class IndividualGraph {
    private PetriNet graph;
    private double fitness;

    public IndividualGraph(PetriNet graph) {
        this.graph = graph;
        this.fitness = Double.MAX_VALUE;
    }
    
    public void calculateFitness() {
        this.fitness = FitnessCalculator.calculateFitness(this);
    }

    public PetriNet getGraph() {
        return graph;
    }

    public void setGraph(PetriNet graph) {
        this.graph = graph;
    }

    public double getFitness() {
        return fitness;
    }

    public void setFitness(double fitness) {
        this.fitness = fitness;
    }
    
    
}
