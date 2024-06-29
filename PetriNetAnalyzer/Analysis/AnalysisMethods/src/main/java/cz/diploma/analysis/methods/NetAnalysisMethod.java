package cz.diploma.analysis.methods;

import cz.diploma.shared.utils.StringUtils;

public enum NetAnalysisMethod {

    STATE_SPACE {

                @Override
                public String toString() {
                    return "State space";
                }

                @Override
                public String getStringID() {
                    return "stateSpace";
                }
            },
    INVARIANT {

                @Override
                public String toString() {
                    return "Invariant";
                }

                @Override
                public String getStringID() {
                    return "invariant";
                }
            },
    CLASSIFICATION {

                @Override
                public String toString() {
                    return "Classification";
                }

                @Override
                public String getStringID() {
                    return "classification";
                }
            },
    TRAP_COTRAP {

                @Override
                public String toString() {
                    return "Traps & Cotraps";
                }

                @Override
                public String getStringID() {
                    return "trapCotrap";
                }

            },
    CYCLES {

                @Override
                public String toString() {
                    return "Cycles";
                }

                @Override
                public String getStringID() {
                    return "cycles";
                }

            },
    NMRT {
        @Override
        public String toString() {
            return "New Modified Reachability Tree";
        }
        
        @Override
        public String getStringID() {
            return "nmrt";
        }
                
        };

    public abstract String getStringID();

    public static NetAnalysisMethod parse(String propertyId) {
        NetAnalysisMethod type = null;
        if (!StringUtils.isNullOrEmpty(propertyId)) {
            for (NetAnalysisMethod propType : NetAnalysisMethod.values()) {
                if (propertyId.equals(propType.getStringID())) {
                    type = propType;
                    break;
                }
            }
        }

        return type;
    }

}
