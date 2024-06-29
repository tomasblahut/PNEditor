package cz.diploma.projectstorage.database;

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;

public class DatabaseConnector {

    private static final Logger log = Logger.getLogger(DatabaseConnector.class.getName());
    //--
    private static EntityManagerFactory emf;

    public static void initEMF() {
        try {
            System.out.println("Creating EMF");
            emf = Persistence.createEntityManagerFactory("cz.diploma.project.storage");
        } catch (Exception ex) {
            log.log(Level.SEVERE, "Error while creating entity manager factory", ex);
        }
    }

    public static EntityManager getSession() {
        EntityManager ses = emf.createEntityManager();
        ses.getTransaction().begin();
        return ses;
    }

    public static void disposeEMF() {
        try {
            if (emf != null) {
                System.out.println("Disposing EMF");
                emf.close();
            }
        } catch (Exception ex) {
            log.log(Level.SEVERE, "Error while closing entity manager factory", ex);
        }
    }
}
