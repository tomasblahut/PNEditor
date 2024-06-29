package cz.diploma.server.api;

import cz.diploma.server.analysis.AnalysisRequest;
import cz.diploma.server.analysis.AnalysisRequestProcessor;
import cz.diploma.server.analysis.AnalysisResponse;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;

@Path("/netAnalysis")
public class NetAnalysis {

    @POST
    @Path("/analyzeNet")
    @Consumes(MediaType.APPLICATION_JSON)
    public AnalysisResponse analyzeNet(AnalysisRequest analysisRequest) throws Exception {
        AnalysisRequestProcessor processor = new AnalysisRequestProcessor(analysisRequest);
        return processor.processRequest();
    }
}
