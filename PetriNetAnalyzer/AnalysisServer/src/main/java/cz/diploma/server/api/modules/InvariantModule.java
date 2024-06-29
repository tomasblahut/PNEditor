package cz.diploma.server.api.modules;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.module.SimpleModule;
import cz.diploma.analysis.methods.invariant.Invariant;
import cz.diploma.analysis.methods.invariant.PInvariant;
import cz.diploma.analysis.methods.invariant.TInvariant;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import org.json.JSONArray;
import org.json.JSONObject;

public class InvariantModule extends SimpleModule {

    public static class InvSerializer extends JsonSerializer<Invariant> {

        @Override
        public void serialize(Invariant invariant, JsonGenerator jg, SerializerProvider serializers) throws IOException, JsonProcessingException {
            try {
                JSONObject invJson = new JSONObject();

                Map<String, Integer> invData = invariant.getStruct();
                for (Entry<String, Integer> entry : invData.entrySet()) {
                    JSONObject entryJson = new JSONObject();
                    entryJson.put("id", entry.getKey());
                    entryJson.put("value", entry.getValue());

                    invJson.append("struct", entryJson);
                }

                if (invariant instanceof PInvariant) {
                    PInvariant pInv = (PInvariant) invariant;
                    invJson.put("system", pInv.getSystem());
                } else if (invariant instanceof TInvariant) {
                    invJson.put("system", new JSONArray());

                    TInvariant tInv = (TInvariant) invariant;
                    for (List<String> transSequence : tInv.getSystem()) {
                        JSONArray sysInvJson = new JSONArray();
                        for (String transId : transSequence) {
                            sysInvJson.put(transId);
                        }
                        invJson.append("system", sysInvJson);
                    }
                }

                jg.writeRawValue(invJson.toString());
            } catch (Exception ex) {
                throw new IOException("Error while serializing invariants", ex);
            }
        }

        @Override
        public Class<Invariant> handledType() {
            return Invariant.class;
        }
    }

    public InvariantModule() {
        addSerializer(new InvSerializer());
    }
}
