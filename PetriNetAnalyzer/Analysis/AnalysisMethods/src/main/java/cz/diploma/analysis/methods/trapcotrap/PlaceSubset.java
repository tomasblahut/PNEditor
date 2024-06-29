package cz.diploma.analysis.methods.trapcotrap;

import java.util.HashSet;
import java.util.Set;

public class PlaceSubset {

    private final Set<String> placeIds = new HashSet<>();

    public PlaceSubset(Set<String> placeIds) {
        if (placeIds != null) {
            this.placeIds.addAll(placeIds);
        }
    }

    public Set<String> getPlaceIds() {
        return placeIds;
    }
}
