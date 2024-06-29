package cz.diploma.shared.interfaces;

import java.util.Comparator;

public interface HasPriority {

    public static final Comparator<HasPriority> priorityComparator = new Comparator<HasPriority>() {

        @Override
        public int compare(HasPriority hp1, HasPriority hp2) {
            return hp1.getPriority() - hp2.getPriority();
        }
    };

    public int getPriority();
}
