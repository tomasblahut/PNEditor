package cz.diploma.analysis.testing;

public enum TestResultStatus {

    PASS, FAIL, UNDECIDABLE;

    public TestResultStatus logicalAnd(TestResultStatus... statuses) {
        TestResultStatus resultStatus = UNDECIDABLE;

        boolean allPasses = true;
        for (TestResultStatus status : statuses) {
            if (PASS != status) {
                allPasses = false;
            }

            if (FAIL == status) {
                resultStatus = FAIL;
                break;
            }
        }

        if (allPasses) {
            resultStatus = PASS;
        }

        return resultStatus;
    }

    public static TestResultStatus logicalOr(TestResultStatus... statuses) {
        TestResultStatus resultStatus = UNDECIDABLE;

        for (TestResultStatus status : statuses) {
            if (UNDECIDABLE != status) {
                resultStatus = status;
                break;
            }
        }

        return resultStatus;
    }
}
