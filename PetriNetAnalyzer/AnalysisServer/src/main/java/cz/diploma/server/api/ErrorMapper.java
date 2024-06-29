package cz.diploma.server.api;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

@Provider
public class ErrorMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable e) {
        System.err.println("Error: " + e.getMessage());
        e.printStackTrace(System.err);
        return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).type(MediaType.TEXT_PLAIN).build();
    }
}
