package cz.diploma.projectstorage.pojo;

import java.io.Serializable;
import java.sql.Blob;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.Type;
import org.joda.time.LocalDateTime;

@Entity
@NamedQueries({
    @NamedQuery(name = "Project.findAll", query = "SELECT ent FROM Project ent"),
    @NamedQuery(name = "Project.findByGUID", query = "SELECT ent FROM Project ent WHERE ent.guid = :guid")
})
public class Project implements Serializable {

    protected String id;
    //--
    protected String name;
    protected String guid;
    protected LocalDateTime lastUpdate;
    protected Blob binaryData;

    @Id
    @GeneratedValue(generator = "hibernate-uuid")
    @GenericGenerator(name = "hibernate-uuid", strategy = "org.hibernate.id.UUIDGenerator")
    public String getId() {
        return id;
    }

    protected void setId(String id) {
        this.id = id;
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

    @Type(type = "org.jadira.usertype.dateandtime.joda.PersistentLocalDateTime")
    public LocalDateTime getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(LocalDateTime lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(nullable = false)
    public Blob getBinaryData() {
        return binaryData;
    }

    public void setBinaryData(Blob binaryData) {
        this.binaryData = binaryData;
    }
}
