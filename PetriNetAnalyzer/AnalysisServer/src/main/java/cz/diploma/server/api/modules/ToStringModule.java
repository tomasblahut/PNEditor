package cz.diploma.server.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import cz.diploma.analysis.methods.NetAnalysisMethod;
import cz.diploma.analysis.methods.classification.NetSubclass;
import cz.diploma.analysis.testing.NetProperty;
import java.io.IOException;

public class ToStringModule extends SimpleModule {

    public static class ToStringSerializer extends JsonSerializer {

        @Override
        public void serialize(Object value, JsonGenerator jg, SerializerProvider serializers) throws IOException, JsonProcessingException {
            if (value != null) {
                jg.writeRawValue("\"" + value.toString() + "\"");
            }
        }
    }

    public ToStringModule() {
        ToStringSerializer serializer = new ToStringSerializer();

        addSerializer(NetProperty.class, serializer);
        addSerializer(NetSubclass.class, serializer);
        addSerializer(NetAnalysisMethod.class, serializer);
    }
}
