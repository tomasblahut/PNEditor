package cz.diploma.shared.utils;

public class NumberUtils {

    public static int getVal(Integer intObj) {
        return intObj == null ? 0 : intObj;
    }

    public static boolean isTrue(Boolean boolObj) {
        return boolObj != null && boolObj;
    }
}
