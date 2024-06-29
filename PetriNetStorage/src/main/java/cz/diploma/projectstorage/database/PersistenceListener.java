package cz.diploma.projectstorage.database;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

public class PersistenceListener implements ServletContextListener {

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        DatabaseConnector.initEMF();
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        DatabaseConnector.disposeEMF();
    }

}
