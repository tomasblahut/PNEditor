package cz.diploma.projectstorage.database;

import java.sql.Blob;
import javax.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.engine.jdbc.LobCreator;

public class HibernateUtil {

    public static Blob createBlob(EntityManager ses, byte[] data) {
        Session session = (Session) ses.getDelegate();
        LobCreator c = Hibernate.getLobCreator(session);
        Blob blob = c.createBlob(data);
        return blob;
    }
}
