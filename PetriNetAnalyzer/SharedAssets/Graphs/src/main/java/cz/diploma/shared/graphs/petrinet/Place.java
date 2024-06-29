package cz.diploma.shared.graphs.petrinet;

import cz.diploma.shared.graphs.GraphNode;
import cz.diploma.shared.interfaces.HasName;

public class Place extends GraphNode implements HasName {

    private String name;
    private int tokens;

    public Place(String id) {
        this.id = id;
    }

    public Place(String id, double xCoord, double yCoord) {
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

    public int getTokens() {
        return tokens;
    }

    public void setTokens(int tokens) {
        this.tokens = tokens;
    }
}
