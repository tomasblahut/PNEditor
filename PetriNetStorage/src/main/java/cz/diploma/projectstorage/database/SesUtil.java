package cz.diploma.projectstorage.database;

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.EntityManager;

public class SesUtil {

    private static final Logger log = Logger.getLogger(SesUtil.class.getName());

    public static void commitTransaction(EntityManager ses) {
        try {
            ses.getTransaction().commit();
        } catch (Exception ex) {
            log.log(Level.SEVERE, "Error while commiting transaction", ex);
        }
    }

    public static void closeSes(EntityManager ses) {
        try {
            if (ses.isOpen() && ses.getTransaction() != null && ses.getTransaction().isActive()) {
                rollback(ses);
            }
        } catch (Throwable ex) {
            log.log(Level.SEVERE, "Error while closing session", ex);
        }

        try {
            if (ses.isOpen()) {
                ses.close();
            }
        } catch (Throwable ex) {
            log.log(Level.SEVERE, "Error while closing session", ex);
        }
    }

    public static void rollback(EntityManager ses) {
        if (ses != null && ses.isOpen() && ses.getTransaction() != null && ses.getTransaction().isActive()) {
            try {
                ses.getTransaction().rollback();
            } catch (Throwable ex) {
                log.log(Level.SEVERE, "Error while rollbacking transaction", ex);
            }
        }
    }
}
