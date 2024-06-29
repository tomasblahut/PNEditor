package cz.diploma.projectstorage.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import java.io.IOException;
import org.joda.time.LocalDateTime;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

public class JodaModule extends SimpleModule {

    private static class LocalDateTimeSerializer extends JsonSerializer<LocalDateTime> {

        private final DateTimeFormatter formatter = DateTimeFormat.forPattern("dd.MM.yyyy HH:mm");

        @Override
        public void serialize(LocalDateTime value, JsonGenerator jg, SerializerProvider serializers) throws IOException, JsonProcessingException {
            String dtStr = formatter.print(value);
            jg.writeRawValue("\"" + dtStr + "\"");
        }

        @Override
        public Class<LocalDateTime> handledType() {
            return LocalDateTime.class;
        }
    }

    public JodaModule() {
        addSerializer(LocalDateTime.class, new LocalDateTimeSerializer());
    }
}
