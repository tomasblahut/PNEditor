package cz.diploma.shared.utils;

import cz.diploma.shared.interfaces.HasId;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

public class CollectionUtils {

    public static final MapByValueComparator mapComparator = new MapByValueComparator();

    //--

    public static <T extends HasId> Set<String> exthractIds(Collection<T> data) {
        Set<String> ids = new LinkedHashSet<>();
        for (T obj : data) {
            ids.add(obj.getId());
        }
        return ids;
    }

    public static <T extends HasId> T findById(Collection<T> data, String id) {
        HasId result = null;

        if (!StringUtils.isNullOrEmpty(id)) {
            for (HasId obj : data) {
                if (id.equals(obj.getId())) {
                    result = obj;
                    break;
                }
            }
        }

        return (T) result;
    }

    public static <T extends HasId> boolean containsById(Collection<T> data, T toSearch) {
        if (toSearch != null && !StringUtils.isNullOrEmpty(toSearch.getId())) {
            String id = toSearch.getId();
            for (HasId obj : data) {
                if (id.equals(obj.getId())) {
                    return true;
                }
            }
        }

        return false;
    }

    public static <T extends HasId> void sortById(List<T> data) {
        Collections.sort(data, HasId.idComparator);
    }

    public static <T extends HasId> Map<String, T> mapById(Collection<T> data) {
        Map<String, T> resultMap = new HashMap<String, T>();
        for (T item : data) {
            resultMap.put(item.getId(), item);
        }
        return resultMap;
    }

    public static <T> List<T> sortedList(Collection<T> values, Comparator<? super T> comparator) {
        List<T> sorted = new ArrayList(values);
        Collections.sort(sorted, comparator);
        return sorted;
    }

    public static <T extends Comparable> List<T> sortedList(Collection<T> values) {
        List<T> sorted = new ArrayList(values);
        Collections.sort(sorted);
        return sorted;
    }

    public static <K, V extends Comparable<? super V>> List<K> sortedKeysByValue(Map<K, V> map) {
        List<Entry<K, V>> entryList = new LinkedList<>(map.entrySet());
        Collections.sort(entryList, mapComparator);

        List<K> result = new ArrayList<>();
        for (Entry<K, V> entry : entryList) {
            result.add(entry.getKey());
        }
        return result;
    }
}
