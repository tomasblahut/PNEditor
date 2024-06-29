package cz.diploma.server.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import cz.diploma.analysis.methods.cycles.PNCycle;
import java.io.IOException;
import org.json.JSONObject;

public class CyclesModule extends SimpleModule {

    public static class PNCycleSerializer extends JsonSerializer<PNCycle> {

        @Override
        public void serialize(PNCycle cycle, JsonGenerator jg, SerializerProvider serializers) throws IOException, JsonProcessingException {
            try {
                JSONObject cycleJson = new JSONObject();

                for (String componentId : cycle.getComponentIds()) {
                    cycleJson.append("componentIds", componentId);
                }

                jg.writeRawValue(cycleJson.toString());
            } catch (Exception ex) {
                throw new IOException("Error while serializing cycles", ex);
            }
        }

        @Override
        public Class<PNCycle> handledType() {
            return PNCycle.class;
        }
    }

    public CyclesModule() {
        addSerializer(new PNCycleSerializer());
    }
}
