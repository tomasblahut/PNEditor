package cz.diploma.projectstorage.api;

import cz.diploma.projectstorage.database.DatabaseConnector;
import cz.diploma.projectstorage.database.HibernateUtil;
import cz.diploma.projectstorage.database.SesUtil;
import cz.diploma.projectstorage.pojo.Project;
import cz.diploma.shared.utils.StreamUtils;
import java.sql.Blob;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.EntityManager;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

@Path("/projectStorage")
public class ProjectStorage {

    @Path("/getProjectList")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<ProjectEntry> getProjectList() throws Exception {
        EntityManager ses = null;
        try {
            ses = DatabaseConnector.getSession();
            List<Project> projects = ses.createNamedQuery("Project.findAll").getResultList();

            List<ProjectEntry> projectEntries = new ArrayList<>();
            for (Project project : projects) {
                projectEntries.add(ProjectEntry.fromProjectPOJO(project));
            }

            return projectEntries;
        } finally {
            SesUtil.closeSes(ses);
        }
    }

    @Path("/getProject")
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public ProjectEntry getProject(@QueryParam("projectGUID") String projectGUID) throws Exception {
        EntityManager ses = null;
        try {
            ses = DatabaseConnector.getSession();
            List<Project> projects = ses.createNamedQuery("Project.findByGUID")
                    .setParameter("guid", projectGUID)
                    .getResultList();
            Project project = projects.isEmpty() ? null : projects.iterator().next();
            ProjectEntry projectEntry = null;

            if (project != null) {
                projectEntry = ProjectEntry.fromProjectPOJO(project);

                Blob netData = project.getBinaryData();
                String netStr = StreamUtils.blobToString(netData);
                projectEntry.setNetData(netStr);
            }

            return projectEntry;
        } finally {
            SesUtil.closeSes(ses);
        }
    }

    @Path("/saveProject")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public void saveProject(ProjectEntry projEntry) throws Exception {
        EntityManager ses = null;
        try {
            ses = DatabaseConnector.getSession();

            List<Project> projects = ses.createNamedQuery("Project.findByGUID")
                    .setParameter("guid", projEntry.getGuid())
                    .getResultList();
            Project project = projects.isEmpty() ? null : projects.iterator().next();
            if (project == null) {
                project = projEntry.toProjectPOJO();
            }

            Blob netBlob = HibernateUtil.createBlob(ses, projEntry.getNetData().getBytes());
            project.setBinaryData(netBlob);

            ses.merge(project);
            SesUtil.commitTransaction(ses);
        } finally {
            SesUtil.closeSes(ses);
        }
    }

    @Path("/deleteProject")
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public void deleteProject(String projectGUID) throws Exception {
        EntityManager ses = null;
        try {
            ses = DatabaseConnector.getSession();

            List<Project> projects = ses.createNamedQuery("Project.findByGUID")
                    .setParameter("guid", projectGUID)
                    .getResultList();
            Project project = projects.isEmpty() ? null : projects.iterator().next();
            if (project != null) {
                ses.remove(project);
                SesUtil.commitTransaction(ses);
            }
        } finally {
            SesUtil.closeSes(ses);
        }
    }
}
