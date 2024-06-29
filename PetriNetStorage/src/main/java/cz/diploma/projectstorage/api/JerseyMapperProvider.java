package cz.diploma.projectstorage.api;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import cz.diploma.projectstorage.api.modules.JodaModule;
import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;

@Provider
public class JerseyMapperProvider implements ContextResolver<ObjectMapper> {

    private final ObjectMapper mapper = new ObjectMapper();

    public JerseyMapperProvider() throws Exception {
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(JsonParser.Feature.ALLOW_UNQUOTED_FIELD_NAMES, true);

        mapper.registerModule(new JodaModule());
    }

    @Override
    public ObjectMapper getContext(Class<?> type) {
        return mapper;
    }
}
