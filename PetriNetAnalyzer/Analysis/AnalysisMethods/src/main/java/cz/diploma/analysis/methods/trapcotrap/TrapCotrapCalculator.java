package cz.diploma.analysis.methods.trapcotrap;

import aima.core.logic.propositional.parsing.ast.ComplexSentence;
import aima.core.logic.propositional.parsing.ast.Connective;
import aima.core.logic.propositional.parsing.ast.PropositionSymbol;
import aima.core.logic.propositional.parsing.ast.Sentence;
import aima.core.logic.propositional.visitors.ConvertToCNF;
import com.google.common.collect.BiMap;
import com.google.common.collect.HashBasedTable;
import com.google.common.collect.HashBiMap;
import com.google.common.collect.HashMultimap;
import com.google.common.collect.LinkedListMultimap;
import com.google.common.collect.Multimap;
import com.google.common.collect.Table;
import cz.diploma.shared.graphs.petrinet.Arc;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import cz.diploma.shared.graphs.petrinet.Place;
import cz.diploma.shared.graphs.petrinet.Transition;
import cz.diploma.shared.interfaces.HasId;
import cz.diploma.shared.utils.CollectionUtils;
import cz.diploma.shared.utils.NumberUtils;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Stack;

public class TrapCotrapCalculator {

    private final PetriNet net;
    private final BiMap<String, String> placeLiteralMap = HashBiMap.create(); //PlaceId <-> literal name
    //--
    private Sentence cotrapFormula;
    private Sentence trapFormula;

    public TrapCotrapCalculator(PetriNet net) {
        this.net = net;
    }

    public void initFormulas() {
        List<Sentence> cotrapConjuncts = new ArrayList<>();
        List<Sentence> trapConjuncts = new ArrayList<>();

        for (Place place : CollectionUtils.sortedList(net.getPlaces(), HasId.idComparator)) {
            placeLiteralMap.put(place.getId(), "x" + placeLiteralMap.size());
        }

        for (Transition transition : net.getTransitions()) {
            Map<Place, Arc> inputArcs = net.findConnectedPlaces(transition, true);
            List<Place> inputPlaces = CollectionUtils.sortedList(inputArcs.keySet(), HasId.idComparator);

            List<Sentence> inputPropositions = new ArrayList<>();
            for (Place place : inputPlaces) {
                String literal = placeLiteralMap.get(place.getId());
                inputPropositions.add(new PropositionSymbol(literal));
            }

            Map<Place, Arc> outputArcs = net.findConnectedPlaces(transition, false);
            List<Place> outputPlaces = CollectionUtils.sortedList(outputArcs.keySet(), HasId.idComparator);

            List<Sentence> outputPropositions = new ArrayList<>();
            for (Place place : outputPlaces) {
                String literal = placeLiteralMap.get(place.getId());
                outputPropositions.add(new PropositionSymbol(literal));
            }

            Sentence outputImplicant = Sentence.newDisjunction(outputPropositions);
            Sentence inputImplicants = Sentence.newDisjunction(inputPropositions);

            cotrapConjuncts.add(new ComplexSentence(outputImplicant, Connective.IMPLICATION, inputImplicants));
            trapConjuncts.add(new ComplexSentence(inputImplicants, Connective.IMPLICATION, outputImplicant));
        }

        cotrapFormula = Sentence.newConjunction(cotrapConjuncts);
        trapFormula = Sentence.newConjunction(trapConjuncts);
    }

    public List<PlaceSubset> calculateCotraps() {
        Sentence cotrapCnf = convertToCNF(cotrapFormula);
        return calculate(cotrapCnf);
    }

    public List<PlaceSubset> calcuateTraps() {
        Sentence trapCnf = convertToCNF(trapFormula);
        return calculate(trapCnf);
    }

    private List<PlaceSubset> calculate(Sentence cnf) {
        Multimap<Sentence, Sentence> clausules = indexByConjuncts(cnf);
        Multimap<Integer, Sentence> orderedClausules = sortByVariables(clausules);
        orderedClausules = reorderVariables(orderedClausules);

        List<List<Sentence>> primeImplicants = calculatePrimeImplicants(orderedClausules);
        return generatePlaceSubsets(primeImplicants);
    }

    private List<PlaceSubset> generatePlaceSubsets(List<List<Sentence>> implicants) {
        List<String> sortedLiterals = new ArrayList<>(placeLiteralMap.values());
        Collections.sort(sortedLiterals);

        Stack<SubsetIteration> nodeStack = new Stack<>();
        TernaryTree tree = new TernaryTree(new TernaryTreeNode());

        List<PlaceSubset> placeSubsets = new ArrayList<>();
        for (List<Sentence> implicant : implicants) {
            TernaryBoolean[] implicantVector = buildImplicantVector(implicant, sortedLiterals);

            SubsetIteration mainIteration = new SubsetIteration();
            mainIteration.setTreeNode(tree.getRoot());
            nodeStack.add(mainIteration);

            while (!nodeStack.isEmpty()) {
                SubsetIteration curIter = nodeStack.pop();
                TernaryTreeNode curNode = curIter.getTreeNode();

                int nodeLevel = curNode.getLevel();
                if (nodeLevel == sortedLiterals.size()) {
                    Set<String> subset = curIter.getPlaceIds();
                    if (curIter.isNewBranch() && !subset.isEmpty()) {
                        placeSubsets.add(new PlaceSubset(subset));
                    }
                } else {
                    TernaryBoolean vectorComponent = implicantVector[nodeLevel];
                    if (TernaryBoolean.BOTH.equals(vectorComponent)) {
                        SubsetIteration branchIter = new SubsetIteration(curIter);
                        descendInTree(branchIter, tree, curNode, false);
                        nodeStack.push(branchIter);
                        vectorComponent = TernaryBoolean.TRUE;
                    }

                    boolean vectorVal = TernaryBoolean.TRUE.equals(vectorComponent);
                    if (vectorVal) {
                        String placeLiteral = sortedLiterals.get(nodeLevel);
                        curIter.getPlaceIds().add(placeLiteralMap.inverse().get(placeLiteral));
                    }
                    descendInTree(curIter, tree, curNode, vectorVal);
                    nodeStack.add(curIter);
                }
            }
        }

        return placeSubsets;
    }

    private void descendInTree(SubsetIteration iteration, TernaryTree tree, TernaryTreeNode curNode, boolean value) {
        TernaryTreeNode childNode = curNode.findChildWithValue(value);
        boolean childExisted = childNode != null;
        if (!childExisted) {
            iteration.markAsNewBranch();
            childNode = tree.createChildFor(curNode, value);
        }
        iteration.setTreeNode(childNode);
    }

    private TernaryBoolean[] buildImplicantVector(List<Sentence> implicant, List<String> sortedLiterals) {
        Map<String, Sentence> implLiterals = new HashMap<>();
        for (Sentence sentence : implicant) {
            PropositionSymbol propoSymbol;
            if (sentence.isNotSentence()) {
                propoSymbol = (PropositionSymbol) sentence.getSimplerSentence(0);
            } else {
                propoSymbol = (PropositionSymbol) sentence;
            }

            implLiterals.put(propoSymbol.getSymbol(), sentence);
        }

        TernaryBoolean[] implVector = new TernaryBoolean[sortedLiterals.size()];
        for (int index = 0; index < sortedLiterals.size(); index++) {
            String placeLiteral = sortedLiterals.get(index);
            Sentence sentence = implLiterals.get(placeLiteral);

            TernaryBoolean vectorComponent = TernaryBoolean.BOTH;
            if (sentence != null) {
                vectorComponent = sentence.isNotSentence() ? TernaryBoolean.FALSE : TernaryBoolean.TRUE;
            }
            implVector[index] = vectorComponent;
        }
        return implVector;
    }

    private List<List<Sentence>> calculatePrimeImplicants(Multimap<Integer, Sentence> orderedClausules) {
        FormulaTreeNode root = new FormulaTreeNode();
        Stack<FormulaTreeNode> nodeStack = new Stack<>();
        nodeStack.add(root);

        Multimap<Integer, Sentence> openBranches = HashMultimap.create();
        List<List<Sentence>> primeImplicants = new ArrayList<>();

        while (!nodeStack.isEmpty()) {
            FormulaTreeNode curNode = nodeStack.peek();
            int nodeLevel = curNode.getLevel();

            List<Sentence> levelClausules = (List) orderedClausules.get(nodeLevel);
            if (levelClausules == null || levelClausules.isEmpty()) {
                primeImplicants.add(curNode.getConjuncts());
                nodeStack.pop();
            } else {
                int clausulesCount = levelClausules.size();
                boolean pop = true;

                for (int processedConjuncts = curNode.getProcessedConjunctsCount(); processedConjuncts < clausulesCount; processedConjuncts++) {
                    if (processedConjuncts == 0) {
                        if (shouldExcludeLevel(levelClausules, curNode)) {
                            FormulaTreeNode childNode = new FormulaTreeNode(curNode);
                            nodeStack.add(childNode);

                            curNode.setProcessedConjunctsCount(clausulesCount);
                            curNode.addChild(childNode);
                            pop = false;
                            break;
                        }
                        openBranches.putAll(nodeLevel, levelClausules);
                    }

                    Sentence nextConjunct = levelClausules.get(processedConjuncts);
                    openBranches.remove(nodeLevel, nextConjunct);
                    curNode.incrementProcessedCount();

                    if (!shouldExcludeBranch(curNode, nextConjunct, openBranches)) {
                        FormulaTreeNode childNode = new FormulaTreeNode(curNode);
                        childNode.getConjuncts().add(nextConjunct);
                        nodeStack.add(childNode);

                        curNode.addChild(childNode);
                        pop = false;
                        break;
                    }
                }

                if (pop) {
                    nodeStack.pop();
                }
            }
        }

        return primeImplicants;
    }

    private boolean shouldExcludeLevel(List<Sentence> levelClausules, FormulaTreeNode curNode) {
        return !Collections.disjoint(levelClausules, curNode.getConjuncts());
    }

    private boolean shouldExcludeBranch(FormulaTreeNode curNode, Sentence nextConjunct, Multimap<Integer, Sentence> openBranches) {
        boolean excludeBranch = curNode.containsNegationOf(nextConjunct);
        if (!excludeBranch) {
            for (int level : openBranches.keySet()) {
                excludeBranch = openBranches.containsEntry(level, nextConjunct);
                if (excludeBranch) {
                    break;
                }
            }
        }
        return excludeBranch;
    }

    private Multimap<Sentence, Sentence> indexByConjuncts(Sentence sentence) {
        List<Sentence> conjuncts = new ArrayList<>();
        sentence.accept(new SentenceFinder(Connective.AND), conjuncts);

        List<Sentence> disjuncts = new ArrayList<>();
        SentenceFinder disjunctFinder = new SentenceFinder(Connective.OR);

        Multimap<Sentence, Sentence> clausules = LinkedListMultimap.create();
        for (Sentence conjunct : conjuncts) {
            disjuncts.clear();
            conjunct.accept(disjunctFinder, disjuncts);
            clausules.putAll(conjunct, disjuncts);
        }
        return clausules;
    }

    private Sentence convertToCNF(Sentence sentence) {
        Sentence cnf = ConvertToCNF.convert(sentence);
        return cnf.accept(new CNFEnhancer(), null);
    }

    private Multimap<Integer, Sentence> sortByVariables(Multimap<Sentence, Sentence> sentences) {
        Set<Sentence> nonProcessed = new HashSet<>(sentences.keySet());
        Set<Sentence> visitedLiterals = new HashSet<>();
        Multimap<Integer, Sentence> orderedClausules = LinkedListMultimap.create();

        int sentencesKeyCount = sentences.keySet().size();
        int curIndex = 0;
        while (curIndex < sentencesKeyCount) {
            Sentence minClausule = null;
            int minNumber = -1;

            for (Sentence clausule : nonProcessed) {
                Collection<Sentence> disjuncts = sentences.get(clausule);
                int nonVisitedLiterals = 0;

                for (Sentence disjunct : disjuncts) {
                    if (!visitedLiterals.contains(disjunct)) {
                        nonVisitedLiterals++;
                    }
                }

                if (minNumber == -1 || minNumber > nonVisitedLiterals) {
                    minClausule = clausule;
                    minNumber = nonVisitedLiterals;
                }
            }

            nonProcessed.remove(minClausule);
            Collection<Sentence> disjuncts = sentences.get(minClausule);
            visitedLiterals.addAll(disjuncts);
            orderedClausules.putAll(curIndex, disjuncts);

            curIndex++;
        }

        return orderedClausules;
    }

    private Multimap<Integer, Sentence> reorderVariables(Multimap<Integer, Sentence> sentences) {
        Table<Sentence, Integer, Integer> literalOccurence = HashBasedTable.create();

        int sentencesKeyCount = sentences.keySet().size();
        Set<Sentence> occuredSentences = new HashSet<>();

        for (int orderIndex = sentencesKeyCount - 1; orderIndex > 0; orderIndex--) {
            Collection<Sentence> disjuncts = sentences.get(orderIndex);
            occuredSentences.addAll(disjuncts);

            for (Sentence disjunct : occuredSentences) {
                Integer prevAmount = NumberUtils.getVal(literalOccurence.get(disjunct, orderIndex));
                int curAmount = disjuncts.contains(disjunct) ? ++prevAmount : prevAmount;
                literalOccurence.put(disjunct, orderIndex - 1, curAmount);
            }
        }

        Multimap<Integer, Sentence> orderedVariables = LinkedListMultimap.create();
        Map<Sentence, Integer> occurenceInNextClausules = new HashMap<>();

        for (int orderIndex = 0; orderIndex < sentencesKeyCount; orderIndex++) {
            Collection<Sentence> disjuncts = sentences.get(orderIndex);

            occurenceInNextClausules.clear();
            for (Sentence disjunct : disjuncts) {
                Integer occurence = literalOccurence.get(disjunct, orderIndex);
                occurenceInNextClausules.put(disjunct, occurence == null ? 0 : occurence);
            }

            orderedVariables.putAll(orderIndex, CollectionUtils.sortedKeysByValue(occurenceInNextClausules));
        }

        return orderedVariables;
    }
}
