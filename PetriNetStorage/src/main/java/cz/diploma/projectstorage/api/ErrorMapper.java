package cz.diploma.projectstorage.api;

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

@Provider
public class ErrorMapper implements ExceptionMapper<Throwable> {

    private final Logger log = Logger.getLogger(getClass().getName());

    @Override
    public Response toResponse(Throwable e) {
        log.log(Level.SEVERE, "Error while processing API request", e);

        e.printStackTrace(System.err);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).type(MediaType.TEXT_PLAIN).build();
    }
}
