package cz.diploma.projectstorage.api;

import cz.diploma.projectstorage.pojo.Project;
import org.joda.time.LocalDateTime;

public class ProjectEntry {

    private String name;
    private String guid;
    private LocalDateTime lastUpdate;
    private String netData;

    public static ProjectEntry fromProjectPOJO(Project project) {
        ProjectEntry entry = new ProjectEntry();

        entry.setName(project.getName());
        entry.setGuid(project.getGuid());
        entry.setLastUpdate(project.getLastUpdate());

        return entry;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGuid() {
        return guid;
    }

    public void setGuid(String guid) {
        this.guid = guid;
    }

    public String getNetData() {
        return netData;
    }

    public void setNetData(String netData) {
        this.netData = netData;
    }

    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public Project toProjectPOJO() {
        Project project = new Project();
        project.setName(name);
        project.setGuid(guid);
        project.setLastUpdate(LocalDateTime.now());
        return project;
    }
}
