package cz.diploma.analysis.methods.invariant;

import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.interfaces.HasName;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class Matrix {

    private int[][] data;

    public Matrix(int rows, int cols) throws Exception {
        if (rows <= 0 || cols <= 0) {
            throw new Exception("Matrix dimensions must be positive");
        }

        this.data = new int[rows][cols];
    }

    public static Matrix incidency(PetriNet net) throws Exception {
        List<Place> places = CollectionUtils.sortedList(net.getPlaces(), HasName.comparator);
        List<Transition> trans = CollectionUtils.sortedList(net.getTransitions(), HasName.comparator);

        int placesCount = places.size();
        int transCount = trans.size();

        Matrix incMat = new Matrix(placesCount, transCount);

        for (int row = 0; row < placesCount; row++) {
            String curPlaceId = places.get(row).getId();
            for (int col = 0; col < transCount; col++) {
                String curTransId = trans.get(col).getId();
                int change = 0;

                Arc inputArc = net.getArcs().get(curTransId, curPlaceId);
                if (inputArc != null) {
                    change = inputArc.getMultiplicity();
                }

                Arc outputArc = net.getArcs().get(curPlaceId, curTransId);
                if (outputArc != null) {
                    change -= outputArc.getMultiplicity();
                }

                incMat.set(row, col, change);
            }
        }

        return incMat;
    }

    public static Matrix identity(int dimension) throws Exception {
        Matrix idenMat = new Matrix(dimension, dimension);
        for (int row = 0; row < dimension; row++) {

            for (int col = 0; col < dimension; col++) {
                int val = row == col ? 1 : 0;
                idenMat.set(row, col, val);
            }
        }
        return idenMat;
    }

    public int get(int row, int col) {
        return this.data[row][col];
    }

    public void set(int row, int col, int val) {
        this.data[row][col] = val;
    }

    public int getRowDimension() {
        return this.data != null ? this.data.length : 0;
    }

    public int getColDimension() {
        return this.data != null && this.data[0] != null ? this.data[0].length : 0;
    }

    public boolean isZeroLenght() {
        return this.data == null;
    }

    public int[] getRow(int index) {
        int cols = getColDimension();
        int rows = getRowDimension();

        if (cols > 0 && index >= 0 && index < rows) {
            int[] row = new int[cols];
            System.arraycopy(this.data[index], 0, row, 0, cols);
            return row;
        }

        return null;
    }

    public void removeRow(int... rowIndex) throws Exception {
        int rows = getRowDimension();
        int cols = getColDimension();
        if (rows - rowIndex.length < 0 || isZeroLenght()) {
            throw new Exception("Cannot reduce matrix bellow zero lenght");
        }

        Set<Integer> rowsToRemove = new HashSet();
        for (int rowToRemove : rowIndex) {
            if (rowToRemove >= 0 && rowToRemove < rows) {
                rowsToRemove.add(rowToRemove);
            }
        }

        int[][] newData = null;
        int newRows = rows - rowsToRemove.size();
        if (newRows > 0) {
            newData = new int[newRows][cols];
            int newRow = 0;
            int newCol = 0;

            for (int row = 0; row < rows; row++) {
                if (rowsToRemove.contains(row)) {
                    continue;
                }

                for (int col = 0; col < cols; col++) {
                    newData[newRow][newCol] = this.data[row][col];
                    newCol++;
                }
                newCol = 0;
                newRow++;
            }
        }

        this.data = newData;
    }

    public void removeCol(int... colIndex) throws Exception {
        int rows = getRowDimension();
        int cols = getColDimension();
        if (cols - colIndex.length < 0 || isZeroLenght()) {
            throw new Exception("Cannot reduce matrix bellow zero lenght");
        }

        Set<Integer> colsToRemove = new HashSet();
        for (int colToRemove : colIndex) {
            if (colToRemove >= 0 && colToRemove < cols) {
                colsToRemove.add(colToRemove);
            }
        }

        int[][] newData = null;
        int newCols = cols - colsToRemove.size();
        if (newCols > 0) {
            newData = new int[rows][newCols];
            int newRow = 0;
            int newCol = 0;

            for (int row = 0; row < rows; row++) {
                for (int col = 0; col < cols; col++) {
                    if (colsToRemove.contains(col)) {
                        continue;
                    }
                    newData[newRow][newCol] = this.data[row][col];
                    newCol++;
                }
                newCol = 0;
                newRow++;
            }
        }

        this.data = newData;
    }

    public int[] calculateRowAddition(int stRowIndex, int ndRowIndex, int multiplicator) throws Exception {
        if (isZeroLenght()) {
            throw new Exception("Cannot add rows of zero lenght matrix");
        }

        int cols = getColDimension();
        int[] newRow = new int[cols];

        for (int col = 0; col < cols; col++) {
            newRow[col] = this.data[stRowIndex][col] + multiplicator * this.data[ndRowIndex][col];
        }

        return newRow;
    }

    public void addRows(Collection<int[]> newRows) throws Exception {
        if (newRows == null || newRows.isEmpty()) {
            return;
        }

        int colLenght = newRows.iterator().next().length;
        int newRowsSize = newRows.size();
        if (isZeroLenght()) {
            this.data = new int[newRowsSize][colLenght];
        }

        int rows = getRowDimension();
        int cols = getColDimension();
        if (cols != colLenght) {
            throw new Exception("Number of columns in matrix and new rows do not match");
        }

        int[][] newData = new int[rows + newRowsSize][cols];
        for (int row = 0; row < rows; row++) {
            for (int col = 0; col < cols; col++) {
                newData[row][col] = this.data[row][col];
            }
        }

        int newRowIndex = rows;
        for (int[] newRow : newRows) {
            for (int col = 0; col < cols; col++) {
                newData[newRowIndex][col] = newRow[col];
            }
            newRowIndex++;
        }

        this.data = newData;
    }

    public void transpose() {
        if (!isZeroLenght()) {
            int rows = getRowDimension();
            int cols = getColDimension();

            int[][] transposed = new int[cols][rows];
            for (int row = 0; row < rows; row++) {
                for (int col = 0; col < cols; col++) {
                    transposed[col][row] = this.data[row][col];
                }
            }

            this.data = transposed;
        }
    }
}
