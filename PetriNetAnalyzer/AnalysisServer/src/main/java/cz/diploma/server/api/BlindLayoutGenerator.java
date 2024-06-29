package cz.diploma.server.api;

import cz.diploma.server.layout.BlindAlgorithm;
import cz.diploma.shared.graphs.petrinet.PetriNet;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Petr
 */
@Path("/blindLayoutGenerator")
public class BlindLayoutGenerator {
    
    /**
     *
     * @param petriNet - Object representation of the Petri net
     * @return Petri net with the newly generated coordination of all places and transitions <br>
     *      (it contains only necessary information about the objects - IDs and coordinations).
     * @throws Exception
     */
    @POST
    @Path("/blindLayout")
    @Consumes(MediaType.APPLICATION_JSON)
    public PetriNet blindLayout(PetriNet petriNet) throws Exception {
        
        BlindAlgorithm ba = new BlindAlgorithm(petriNet);
        ba.calculateBounds();
        ba.generateIndividualGraphs(10000);
        ba.findBestGraph();
        
        return ba.getBestGraph();
    }
    
}
