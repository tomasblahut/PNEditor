package cz.diploma.analysis.methods.classification;

import cz.diploma.shared.interfaces.HasPriority;

public enum NetSubclass implements HasPriority {

    ORDINARY {

                @Override
                public String toString() {
                    return "Ordinary";
                }

                @Override
                public int getPriority() {
                    return 0;
                }

            },
    STATE_MACHINE {

                @Override
                public String toString() {
                    return "State machine";
                }

                @Override
                public int getPriority() {
                    return 1;
                }

            },
    MARKED_GRAPH {

                @Override
                public String toString() {
                    return "Marked graph";
                }

                @Override
                public int getPriority() {
                    return 2;
                }

            },
    FREE_CHOICE {

                @Override
                public String toString() {
                    return "Free choice";
                }

                @Override
                public int getPriority() {
                    return 3;
                }

            };
}
