package cz.diploma.shared.graphs.petrinet;

public class Arc {

    private int multiplicity = 1;

    public Arc() {
    }

    public int getMultiplicity() {
        return multiplicity;
    }

    public void setMultiplicity(int multiplicity) {
        this.multiplicity = multiplicity;
    }
}
