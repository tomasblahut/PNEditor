package cz.diploma.shared.utils;

import java.util.Comparator;
import java.util.Map.Entry;

public class MapByValueComparator<T, E extends Comparable<? super E>> implements Comparator<Entry<T, E>> {

    @Override
    public int compare(Entry<T, E> e1, Entry<T, E> e2) {
        return (e1.getValue()).compareTo(e2.getValue());
    }
}
