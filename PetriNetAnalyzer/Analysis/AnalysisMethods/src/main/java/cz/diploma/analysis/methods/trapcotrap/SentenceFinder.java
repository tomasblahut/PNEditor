package cz.diploma.analysis.methods.trapcotrap;

import aima.core.logic.propositional.parsing.AbstractPLVisitor;
import aima.core.logic.propositional.parsing.ast.ComplexSentence;
import aima.core.logic.propositional.parsing.ast.Connective;
import aima.core.logic.propositional.parsing.ast.PropositionSymbol;
import aima.core.logic.propositional.parsing.ast.Sentence;
import java.util.List;

public class SentenceFinder extends AbstractPLVisitor<List<Sentence>> {

    private final Connective toSearch;

    public SentenceFinder(Connective toSearch) {
        this.toSearch = toSearch;
    }

    @Override
    public Sentence visitBinarySentence(ComplexSentence sentence, List<Sentence> disjuncts) {
        if (sentence.getConnective() == toSearch) {
            sentence.getSimplerSentence(0).accept(this, disjuncts);
            sentence.getSimplerSentence(1).accept(this, disjuncts);
        } else {
            disjuncts.add(sentence);
        }
        return sentence;
    }

    @Override
    public Sentence visitPropositionSymbol(PropositionSymbol proposition, List<Sentence> disjuncts) {
        disjuncts.add(proposition);
        return proposition;
    }

    @Override
    public Sentence visitUnarySentence(ComplexSentence sentence, List<Sentence> disjuncts) {
        disjuncts.add(sentence);
        return sentence;
    }
}
