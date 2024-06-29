package cz.diploma.shared.utils;

public class TimeMeter {

    private long time;
    private int indentLevel = 0;

    public TimeMeter() {
    }

    public TimeMeter(int indentLevel) {
        this();
        this.indentLevel = indentLevel;
    }

    public void setIndentLevel(int indentLevel) {
        this.indentLevel = indentLevel;
    }

    public void start() {
        time = System.currentTimeMillis();
    }

    public void performStamp(String message) {
        long curTime = System.currentTimeMillis();

        String msg = "";
        for (int index = 0; index < indentLevel; index++) {
            msg += "\t";
        }
        msg += "Measuring " + message + " it took: " + (curTime - time) + " ms";
        System.out.println(msg);
        time = curTime;
    }
}
