package cz.diploma.shared.utils;

import java.io.Closeable;
import java.io.Reader;
import java.sql.Blob;
import java.util.logging.Level;
import java.util.logging.Logger;

public class StreamUtils {

    private static final Logger log = Logger.getLogger(StreamUtils.class.getName());

    public static String blobToString(Blob blobObject) throws Exception {
        if (blobObject == null || blobObject.length() == 0) {
            return "";
        }
        Reader reader = null;
        try {
            final StringBuilder sb = new StringBuilder("");
            byte[] bytes = blobObject.getBytes(1, (int) blobObject.length());
            sb.append(new String(bytes));
            return sb.toString();
        } finally {
            StreamUtils.closeStream(reader);
        }
    }

    public static void closeStream(Closeable... streams) {
        if (streams != null) {
            for (Closeable stream : streams) {
                if (stream != null) {
                    try {
                        stream.close();
                    } catch (Throwable ex) {
                        log.log(Level.WARNING, "Error while closing stream", ex);
                    }
                }
            }
        }
    }
}
