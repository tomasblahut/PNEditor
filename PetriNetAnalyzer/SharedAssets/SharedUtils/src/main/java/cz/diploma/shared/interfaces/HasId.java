package cz.diploma.shared.interfaces;

import java.util.Comparator;

public interface HasId {
    public static final Comparator<HasId> idComparator = new Comparator<HasId>() {
        @Override
        public int compare(HasId h1, HasId h2) {
            return h1.getId().compareTo(h2.getId());
        }
    };

    public String getId();
}
