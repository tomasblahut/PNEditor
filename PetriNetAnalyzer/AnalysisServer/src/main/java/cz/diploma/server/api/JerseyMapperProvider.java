package cz.diploma.server.api;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.diploma.server.api.modules.CyclesModule;
import cz.diploma.server.api.modules.InvariantModule;
import cz.diploma.server.api.modules.PNModule;
import cz.diploma.server.api.modules.StateSpaceModule;
import cz.diploma.server.api.modules.ToStringModule;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

@Provider
public class JerseyMapperProvider implements ContextResolver<ObjectMapper> {

    private final ObjectMapper mapper = new ObjectMapper();

    public JerseyMapperProvider() throws Exception {
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);

        mapper.registerModule(new PNModule());
        mapper.registerModule(new StateSpaceModule());
        mapper.registerModule(new InvariantModule());
        mapper.registerModule(new CyclesModule());
        mapper.registerModule(new ToStringModule());
    }

    @Override
    public ObjectMapper getContext(Class<?> type) {
        return mapper;
    }
}
