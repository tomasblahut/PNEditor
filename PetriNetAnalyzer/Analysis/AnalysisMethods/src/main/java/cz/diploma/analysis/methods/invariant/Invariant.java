package cz.diploma.analysis.methods.invariant;

import java.util.HashMap;
import java.util.Map;

public class Invariant {

    private final Map<String, Integer> struct = new HashMap();

    public Invariant() {
    }

    public int getItem(String id) {
        return struct.get(id);
    }

    public void setItem(String id, int val) {
        struct.put(id, val);
    }

    public Map<String, Integer> getStruct() {
        return struct;
    }

    public boolean isTrivial() {
        boolean trivial = true;

        for (Integer value : struct.values()) {
            trivial = value == 0;
            if (!trivial) {
                break;
            }
        }

        return trivial;
    }

    public Invariant adjustData(String id, int value) {
        Invariant clone = new Invariant();
        clone.struct.putAll(struct);

        int curVal = struct.get(id);
        clone.struct.put(id, curVal + value);

        return clone;
    }
}
