package cz.diploma.shared.interfaces;

import java.util.Comparator;

public interface HasName {

    public static Comparator<HasName> comparator = new Comparator<HasName>() {

        @Override
        public int compare(HasName hn1, HasName hn2) {
            String nameOne = hn1 == null ? null : hn1.getName();
            String nameTwo = hn2 == null ? null : hn2.getName();

            if (nameOne != null && nameTwo != null) {
                return nameOne.compareTo(nameTwo);
            } else if (nameOne != null && nameTwo == null) {
                return 1;
            } else if (nameOne == null && nameTwo != null) {
                return -1;
            } else {
                return 0;
            }
        }
    };

    public String getName();

    public void setName(String name);
}
