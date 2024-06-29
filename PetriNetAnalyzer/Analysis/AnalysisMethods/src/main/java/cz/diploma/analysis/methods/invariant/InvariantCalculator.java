package cz.diploma.analysis.methods.invariant;

import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.interfaces.HasName;
import cz.diploma.shared.utils.CollectionUtils;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javafx.util.Pair;

public class InvariantCalculator {

    private final PetriNet net;

    public InvariantCalculator(PetriNet net) {
        this.net = net;
    }

    public List<PInvariant> calculatePInvariants() throws Exception {
        Matrix incidency = Matrix.incidency(net);
        Matrix invMatrix = calculateInvariants(incidency);

        List<PInvariant> invariants = new ArrayList();
        if (!invMatrix.isZeroLenght()) {
            List<Place> places = CollectionUtils.sortedList(net.getPlaces(), HasName.comparator);
            int rows = invMatrix.getRowDimension();
            int cols = invMatrix.getColDimension();

            for (int row = 0; row < rows; row++) {
                PInvariant invariant = new PInvariant();

                int system = 0;
                for (int col = 0; col < cols; col++) {
                    Place place = places.get(col);
                    int invVal = invMatrix.get(row, col);

                    system += invVal * place.getTokens();
                    invariant.setItem(place.getId(), invVal);
                }

                invariant.setSystem(system);
                invariants.add(invariant);
            }
        }

        return invariants;
    }

    public List<TInvariant> calculateTInvariants() throws Exception {
        Matrix incidency = Matrix.incidency(net);
        incidency.transpose();
        Matrix invMatrix = calculateInvariants(incidency);

        List<TInvariant> invariants = new ArrayList();
        if (!invMatrix.isZeroLenght()) {
            List<Transition> transitions = CollectionUtils.sortedList(net.getTransitions(), HasName.comparator);
            SysTInvCalculator sysCalc = new SysTInvCalculator(net);

            int rows = invMatrix.getRowDimension();
            int cols = invMatrix.getColDimension();

            for (int row = 0; row < rows; row++) {
                TInvariant invariant = new TInvariant();
                for (int col = 0; col < cols; col++) {
                    Transition transition = transitions.get(col);
                    invariant.setItem(transition.getId(), invMatrix.get(row, col));
                }

                sysCalc.calculateSystemInvariants(invariant);
                invariants.add(invariant);
            }
        }

        return invariants;
    }

    private Matrix calculateInvariants(Matrix incidency) throws Exception {
        Matrix identity = Matrix.identity(incidency.getRowDimension());

        List<Pair<Integer, Integer>> positiveComponents = new ArrayList();
        List<Pair<Integer, Integer>> negativeComponents = new ArrayList();

        while (!incidency.isZeroLenght()) {
            findCombinationRows(incidency, positiveComponents, negativeComponents);

            if (!positiveComponents.isEmpty() && !negativeComponents.isEmpty()) {
                generateLinearCombinations(incidency, identity, positiveComponents, negativeComponents);
            }

            alterMatrices(incidency, identity, positiveComponents, negativeComponents);
        }

        transformRowsToCanonicalForm(identity);
        removeCoveringRows(identity);

        return identity;
    }

    private void findCombinationRows(Matrix matrix, List<Pair<Integer, Integer>> positive, List<Pair<Integer, Integer>> negative) {
        positive.clear();
        negative.clear();

        int rows = matrix.getRowDimension();
        for (int row = 0; row < rows; row++) {
            int val = matrix.get(row, 0);

            if (val > 0) {
                positive.add(new Pair(row, val));
            } else if (val < 0) {
                negative.add(new Pair(row, val));
            }
        }
    }

    private void generateLinearCombinations(Matrix incidency, Matrix identity, List<Pair<Integer, Integer>> positive, List<Pair<Integer, Integer>> negative) throws Exception {
        List<int[]> incidencyNewRows = new ArrayList();
        List<int[]> identityNewRows = new ArrayList();

        for (Pair<Integer, Integer> positiveRow : positive) {
            int posVal = positiveRow.getValue();

            for (Pair<Integer, Integer> negativeRow : negative) {
                int negVal = negativeRow.getValue();

                int higherVal;
                int higherIndex;
                int lowerVal;
                int lowerIndex;

                if (Math.abs(posVal) > Math.abs(negVal)) {
                    higherVal = posVal;
                    higherIndex = positiveRow.getKey();
                    lowerVal = negVal;
                    lowerIndex = negativeRow.getKey();
                } else {
                    higherVal = negVal;
                    higherIndex = negativeRow.getKey();
                    lowerVal = posVal;
                    lowerIndex = positiveRow.getKey();
                }

                if (higherVal % lowerVal == 0) {
                    int rowMultiplicator = Math.abs(higherVal / lowerVal);
                    incidencyNewRows.add(incidency.calculateRowAddition(higherIndex, lowerIndex, rowMultiplicator));
                    identityNewRows.add(identity.calculateRowAddition(higherIndex, lowerIndex, rowMultiplicator));
                }
            }
        }

        incidency.addRows(incidencyNewRows);
        identity.addRows(identityNewRows);
    }

    private void alterMatrices(Matrix incidency, Matrix identity, List<Pair<Integer, Integer>> positive, List<Pair<Integer, Integer>> negative) throws Exception {
        Set<Integer> rows = new HashSet<Integer>();
        for (Pair<Integer, Integer> row : positive) {
            rows.add(row.getKey());
        }

        for (Pair<Integer, Integer> row : negative) {
            rows.add(row.getKey());
        }

        if (!rows.isEmpty()) {
            int[] rowsToRemove = new int[rows.size()];
            int index = 0;
            for (Integer row : rows) {
                rowsToRemove[index] = row;
                index++;
            }
            incidency.removeRow(rowsToRemove);
            identity.removeRow(rowsToRemove);
        }

        if (!incidency.isZeroLenght()) {
            incidency.removeCol(0);
        }
    }

    private void transformRowsToCanonicalForm(Matrix matrix) {
        if (!matrix.isZeroLenght()) {
            int rows = matrix.getRowDimension();
            int cols = matrix.getColDimension();

            for (int row = 0; row < rows; row++) {
                int gcd = gcd(matrix.getRow(row));
                if (gcd > 1) {
                    for (int col = 0; col < cols; col++) {
                        int val = matrix.get(row, col);
                        matrix.set(row, col, val / gcd);
                    }
                }
            }
        }
    }

    private void removeCoveringRows(Matrix matrix) throws Exception {
        Set<Integer> rowsToRemove = new HashSet();
        int rowCount = matrix.getRowDimension();

        List<int[]> matrixRows = new ArrayList();

        for (int row = 0; row < rowCount; row++) {
            matrixRows.add(matrix.getRow(row));
        }

        for (int row = 0; row < rowCount; row++) {
            int[] curRow = matrixRows.get(row);
            for (int checkRow = 0; checkRow < rowCount; checkRow++) {
                if (rowsToRemove.contains(checkRow) || row == checkRow) {
                    continue;
                }

                int[] curCheckRow = matrixRows.get(checkRow);
                if (covers(curRow, curCheckRow)) {
                    rowsToRemove.add(row);
                    break;
                }
            }
        }

        if (!rowsToRemove.isEmpty()) {
            int[] rowsToRemoveArray = new int[rowsToRemove.size()];
            int index = 0;
            for (Integer rowToRemove : rowsToRemove) {
                rowsToRemoveArray[index] = rowToRemove;
                index++;
            }
            matrix.removeRow(rowsToRemoveArray);
        }
    }

    /**
     * Checks that vector one covers vector two. One >= Two
     *
     * @param one
     * @param two
     * @return
     * @throws Exception
     */
    private boolean covers(int[] one, int[] two) throws Exception {
        if (one.length != two.length) {
            throw new Exception("Vectors must have same length");
        }

        boolean covers = true;
        for (int index = 0; index < one.length; index++) {
            if (one[index] < two[index]) {
                covers = false;
                break;
            }
        }

        return covers;
    }

    private int gcd(int... values) {
        int result = values[0];
        for (int i = 1; i < values.length; i++) {
            result = gcd(result, values[i]);
        }
        return result;
    }

    private int gcd(int a, int b) {
        while (b > 0) {
            int temp = b;
            b = a % b; // % is remainder
            a = temp;
        }
        return a;
    }
}
