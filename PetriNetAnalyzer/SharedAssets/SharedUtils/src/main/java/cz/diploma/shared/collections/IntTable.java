package cz.diploma.shared.collections;

import gnu.trove.iterator.TIntIterator;
import gnu.trove.map.TIntObjectMap;
import gnu.trove.map.hash.TIntObjectHashMap;
import gnu.trove.set.TIntSet;
import java.util.Map;

public class IntTable<T> {

    private final TIntObjectMap<T> empty = new TIntObjectHashMap<T>() {

        @Override
        public T put(int key, T value) {
            throw new RuntimeException("This is readonly empty instance, that cannot be added into");
        }

        @Override
        public void putAll(Map<? extends Integer, ? extends T> map) {
            throw new RuntimeException("This is readonly empty instance, that cannot be added into");
        }

        @Override
        public void putAll(TIntObjectMap<? extends T> map) {
            throw new RuntimeException("This is readonly empty instance, that cannot be added into");
        }

        @Override
        public T putIfAbsent(int key, T value) {
            throw new RuntimeException("This is readonly empty instance, that cannot be added into");
        }
    };
    //-
    private final TIntObjectMap<TIntObjectMap<T>> data = new TIntObjectHashMap<>();

    public T get(int rowIndex, int columnIndex) {
        TIntObjectMap<T> row = row(rowIndex);
        return row.get(columnIndex);
    }

    public TIntObjectMap<T> row(int rowIndex) {
        TIntObjectMap<T> row = data.get(rowIndex);
        return row == null ? empty : row;
    }

    public TIntObjectMap<T> column(int columnIndex) {
        TIntObjectMap<T> column = empty;
        TIntSet rowKeySet = data.keySet();
        TIntIterator iterator = rowKeySet.iterator();

        while (iterator.hasNext()) {
            int rowKey = iterator.next();
            TIntObjectMap<T> row = row(rowKey);
            T value = row.get(columnIndex);

            if (value != null) {
                if (column == empty) {
                    column = new TIntObjectHashMap<>();
                }

                column.put(rowKey, value);
            }
        }

        return column;
    }

    public void put(int rowIndex, int columnIndex, T value) {
        if (value == null) {
            return;
        }

        TIntObjectMap<T> row = row(rowIndex);
        if (row == empty) {
            row = new TIntObjectHashMap<>();
            data.put(rowIndex, row);
        }

        row.put(columnIndex, value);
    }

    public T remove(int rowIndex, int columnIndex) {
        T removed = null;

        TIntObjectMap<T> row = row(rowIndex);
        if (row != null) {
            removed = row.remove(columnIndex);
            if (row.isEmpty()) {
                data.remove(rowIndex);
            }
        }

        return removed;
    }

    public int size() {
        int size = 0;

        for (TIntObjectMap<T> row : data.valueCollection()) {
            size += row.size();
        }

        return size;
    }
}
