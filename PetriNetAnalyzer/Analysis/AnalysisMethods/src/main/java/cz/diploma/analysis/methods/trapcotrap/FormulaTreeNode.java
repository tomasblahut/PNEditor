package cz.diploma.analysis.methods.trapcotrap;

import aima.core.logic.propositional.parsing.ast.Sentence;
import cz.diploma.shared.graphs.tree.TreeNode;
import java.util.ArrayList;
import java.util.List;

public class FormulaTreeNode extends TreeNode<FormulaTreeNode> {

    private final List<Sentence> conjuncts = new ArrayList<>();
    private int processedConjunctsCount = 0;

    public FormulaTreeNode() {
        super();
    }

    public FormulaTreeNode(FormulaTreeNode parent) {
        super(parent);
        this.conjuncts.addAll(parent.getConjuncts());
    }

    public List<Sentence> getConjuncts() {
        return conjuncts;
    }

    public int getProcessedConjunctsCount() {
        return processedConjunctsCount;
    }

    public void setProcessedConjunctsCount(int processedConjunctsCount) {
        this.processedConjunctsCount = processedConjunctsCount;
    }

    public void incrementProcessedCount() {
        this.processedConjunctsCount++;
    }

    public boolean containsNegationOf(Sentence sentence) {
        boolean contains = false;
        for (Sentence conjunct : conjuncts) {
            if (sentence.isNotSentence() && !conjunct.isNotSentence()) {
                Sentence sentenceInside = sentence.getSimplerSentence(0);
                contains = sentenceInside.equals(conjunct);
            } else if (!sentence.isNotSentence() && conjunct.isNotSentence()) {
                Sentence conjunctInside = conjunct.getSimplerSentence(0);
                contains = conjunctInside.equals(sentence);
            }

            if (contains) {
                break;
            }
        }
        return contains;
    }
}
