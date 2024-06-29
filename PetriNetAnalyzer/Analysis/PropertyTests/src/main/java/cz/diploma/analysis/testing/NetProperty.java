package cz.diploma.analysis.testing;

import cz.diploma.shared.interfaces.HasPriority;
import cz.diploma.shared.utils.StringUtils;

public enum NetProperty implements HasPriority {

    BOUNDEDNESS {

                @Override
                protected String getStringID() {
                    return "boundedness";
                }

                @Override
                public String toString() {
                    return "Boundedness";
                }

                @Override
                public int getPriority() {
                    return 0;
                }
            },
    SAFETY {

                @Override
                protected String getStringID() {
                    return "safety";
                }

                @Override
                public String toString() {
                    return "Safety";
                }

                @Override
                public int getPriority() {
                    return 1;
                }
            },
    CONSERVATIVENESS {

                @Override
                protected String getStringID() {
                    return "conservativeness";
                }

                @Override
                public String toString() {
                    return "Conservativeness";
                }

                @Override
                public int getPriority() {
                    return 2;
                }
            },
    REPETITIVENESS {

                @Override
                protected String getStringID() {
                    return "repetitiveness";
                }

                @Override
                public String toString() {
                    return "Repetitiveness";
                }

                @Override
                public int getPriority() {
                    return 3;
                }
            },
    LIVENESS {

                @Override
                protected String getStringID() {
                    return "liveness";
                }

                @Override
                public String toString() {
                    return "Liveness";
                }

                @Override
                public int getPriority() {
                    return 4;
                }
            },
    REVERSIBILITY {

                @Override
                protected String getStringID() {
                    return "reversibility";
                }

                @Override
                public String toString() {
                    return "Reversibility";
                }

                @Override
                public int getPriority() {
                    return 5;
                }
            },
    DEADLOCK_FREE {

                @Override
                protected String getStringID() {
                    return "deadlockFree";
                }

                @Override
                public String toString() {
                    return "Deadlock free";
                }

                @Override
                public int getPriority() {
                    return 6;
                }

            },
    REACHABILITY {

                @Override
                protected String getStringID() {
                    return "reachability";
                }

                @Override
                public String toString() {
                    return "Reachability";
                }

                @Override
                public int getPriority() {
                    return 7;
                }

            };

    protected abstract String getStringID();

    public static NetProperty parse(String propertyId) {
        NetProperty type = null;
        if (!StringUtils.isNullOrEmpty(propertyId)) {
            for (NetProperty propType : NetProperty.values()) {
                if (propertyId.equals(propType.getStringID())) {
                    type = propType;
                    break;
                }
            }
        }

        return type;
    }
}
