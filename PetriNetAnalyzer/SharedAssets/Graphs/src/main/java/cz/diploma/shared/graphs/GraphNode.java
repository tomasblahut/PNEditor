package cz.diploma.shared.graphs;

import cz.diploma.shared.interfaces.HasId;

public class GraphNode implements HasId {

    protected String id;
    protected double xCoord;
    protected double yCoord;

    public GraphNode() {

    }

    public GraphNode(String id) {
        this.id = id;
    }

    public GraphNode(String id, double xCoord, double yCoord) {
        this.id = id;
        this.xCoord = xCoord;
        this.yCoord = yCoord;
    }

    @Override
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public double getxCoord() {
        return xCoord;
    }

    public void setxCoord(double xCoord) {
        this.xCoord = xCoord;
    }

    public double getyCoord() {
        return yCoord;
    }

    public void setyCoord(double yCoord) {
        this.yCoord = yCoord;
    }
}
