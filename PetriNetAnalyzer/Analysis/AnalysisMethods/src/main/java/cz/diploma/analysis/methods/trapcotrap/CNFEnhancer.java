package cz.diploma.analysis.methods.trapcotrap;

import aima.core.logic.propositional.parsing.AbstractPLVisitor;
import aima.core.logic.propositional.parsing.ast.ComplexSentence;
import aima.core.logic.propositional.parsing.ast.Connective;
import aima.core.logic.propositional.parsing.ast.PropositionSymbol;
import aima.core.logic.propositional.parsing.ast.Sentence;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CNFEnhancer extends AbstractPLVisitor<Object> {

    private final SentenceFinder disFinder = new SentenceFinder(Connective.OR);
    private final SentenceFinder conjFinder = new SentenceFinder(Connective.AND);

    @Override
    public Sentence visitBinarySentence(ComplexSentence sentence, Object arg) {
        Sentence corrected = null;
        Connective connective = sentence.getConnective();

        if (Connective.OR.equals(connective)) {
            corrected = handleOrColapsing(sentence);
        } else if (Connective.AND.equals(connective)) {
            corrected = handleAndColapsing(sentence);
        }

        return corrected;
    }

    private Sentence handleOrColapsing(ComplexSentence sentence) {
        List<Sentence> disjuncts = new ArrayList<>();

        Sentence alpha = sentence.getSimplerSentence(0);
        if (alpha.isBinarySentence()) {
            alpha.accept(disFinder, disjuncts);
        } else {
            disjuncts.add(alpha);
        }

        Sentence beta = sentence.getSimplerSentence(1);
        if (beta.isBinarySentence()) {
            beta.accept(disFinder, disjuncts);
        } else {
            disjuncts.add(beta);
        }

        return repairDisjuncts(disjuncts);
    }

    private Sentence repairDisjuncts(List<Sentence> disjuncts) {
        List<Sentence> actDisjuncts = new ArrayList<>();
        Set<Integer> toSkip = new HashSet<>();
        boolean convertToTrue = false;

        for (int index = 0; index < disjuncts.size(); index++) {
            Sentence disjunct = alterDisjunct(disjuncts.get(index));
            if (disjunct == null || toSkip.contains(index)) {
                continue;
            }
            actDisjuncts.add(disjunct);
            convertToTrue = disjunct.isPropositionSymbol() && ((PropositionSymbol) disjunct).isAlwaysTrue();

            if (!convertToTrue) {
                for (int toCheckIndex = index + 1; toCheckIndex < disjuncts.size(); toCheckIndex++) {
                    Sentence toCheck = disjuncts.get(toCheckIndex);
                    if (disjuncts.equals(toCheck)) {
                        toSkip.add(toCheckIndex);
                    } else {
                        if (disjunct.isNotSentence() && !toCheck.isNotSentence()) {
                            Sentence disjunctInside = disjunct.getSimplerSentence(0);
                            convertToTrue = disjunctInside.equals(toCheck);
                        } else if (!disjunct.isNotSentence() && toCheck.isNotSentence()) {
                            Sentence toCheckInside = toCheck.getSimplerSentence(0);
                            convertToTrue = toCheckInside.equals(disjunct);
                        }
                    }

                    if (convertToTrue) {
                        break;
                    }
                }
            }

            if (convertToTrue) {
                break;
            }
        }

        return convertToTrue ? PropositionSymbol.TRUE : Sentence.newDisjunction(actDisjuncts);
    }

    private Sentence alterDisjunct(Sentence disjunct) {
        Sentence result = disjunct;

        PropositionSymbol propo = result.isPropositionSymbol() ? (PropositionSymbol) result : null;
        if (propo == null && disjunct.isNotSentence()) {
            Sentence innerSentence = disjunct.getSimplerSentence(0);
            if (innerSentence.isPropositionSymbol()) {
                propo = (PropositionSymbol) innerSentence;
            }
        }

        if (PropositionSymbol.FALSE.equals(propo)) {
            result = disjunct.isNotSentence() ? PropositionSymbol.TRUE : null;
        } else if (PropositionSymbol.TRUE.equals(propo)) {
            result = disjunct.isNotSentence() ? null : propo;
        }

        return result;
    }

    private Sentence handleAndColapsing(ComplexSentence sentence) {
        List<Sentence> conjuncts = new ArrayList<>();

        Sentence alpha = sentence.getSimplerSentence(0);
        if (alpha.isBinarySentence()) {
            alpha.accept(conjFinder, conjuncts);
        } else {
            conjuncts.add(alpha);
        }

        Sentence beta = sentence.getSimplerSentence(1);
        if (beta.isBinarySentence()) {
            beta.accept(conjFinder, conjuncts);
        } else {
            conjuncts.add(beta);
        }

        conjuncts = processConjuncts(conjuncts);
        return repairConjuncts(conjuncts);
    }

    private List<Sentence> processConjuncts(List<Sentence> conjuncts) {
        List<Sentence> conjResults = new ArrayList<>();
        for (Sentence conjunct : conjuncts) {
            conjResults.add(conjunct.accept(this, null));
        }
        return conjResults;
    }

    private Sentence repairConjuncts(List<Sentence> conjuncts) {
        List<Sentence> actConjuncts = new ArrayList<>();
        Set<Integer> toSkip = new HashSet<>();
        boolean convertToFalse = false;

        for (int index = 0; index < conjuncts.size(); index++) {
            Sentence conjunct = alterConjunct(conjuncts.get(index));
            if (conjunct == null || toSkip.contains(index)) {
                continue;
            }
            actConjuncts.add(conjunct);
            convertToFalse = conjunct.isPropositionSymbol() && ((PropositionSymbol) conjunct).isAlwaysFalse();

            if (!convertToFalse) {
                for (int toCheckIndex = index + 1; toCheckIndex < conjuncts.size(); toCheckIndex++) {
                    Sentence toCheck = conjuncts.get(toCheckIndex);
                    if (conjunct.equals(toCheck)) {
                        toSkip.add(toCheckIndex);
                    } else {
                        if (conjunct.isNotSentence() && !toCheck.isNotSentence()) {
                            Sentence conjunctInside = conjunct.getSimplerSentence(0);
                            convertToFalse = conjunctInside.equals(toCheck);
                        } else if (!conjunct.isNotSentence() && toCheck.isNotSentence()) {
                            Sentence toCheckInside = toCheck.getSimplerSentence(0);
                            convertToFalse = toCheckInside.equals(conjunct);
                        }
                    }

                    if (convertToFalse) {
                        break;
                    }
                }
            }

            if (convertToFalse) {
                break;
            }
        }

        return convertToFalse ? PropositionSymbol.FALSE : Sentence.newConjunction(actConjuncts);
    }

    private Sentence alterConjunct(Sentence conjunct) {
        Sentence result = conjunct;

        PropositionSymbol propo = result.isPropositionSymbol() ? (PropositionSymbol) result : null;
        if (propo == null && conjunct.isNotSentence()) {
            Sentence innerSentence = conjunct.getSimplerSentence(0);
            if (innerSentence.isPropositionSymbol()) {
                propo = (PropositionSymbol) innerSentence;
            }
        }

        if (PropositionSymbol.FALSE.equals(propo)) {
            result = conjunct.isNotSentence() ? null : propo;
        } else if (PropositionSymbol.TRUE.equals(propo)) {
            result = conjunct.isNotSentence() ? PropositionSymbol.FALSE : null;
        }

        return result;
    }
}
