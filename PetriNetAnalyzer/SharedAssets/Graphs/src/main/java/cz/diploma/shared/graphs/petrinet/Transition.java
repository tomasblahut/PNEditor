package cz.diploma.shared.graphs.petrinet;

import cz.diploma.shared.graphs.GraphNode;
import cz.diploma.shared.interfaces.HasName;

public class Transition extends GraphNode implements HasName {

    private String name;

    public Transition(String id) {
        this.id = id;
    }

    public Transition(String id, double xCoord, double yCoord) {
        super(id, xCoord, yCoord);
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }
}
