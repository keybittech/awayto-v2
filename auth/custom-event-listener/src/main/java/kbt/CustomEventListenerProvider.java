package kbt;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.util.Arrays;

import org.json.JSONObject;
import org.apache.http.client.entity.EntityBuilder;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;
import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.connections.httpclient.HttpClientProvider;

public class CustomEventListenerProvider implements EventListenerProvider {

    private static final Logger log = Logger.getLogger(CustomEventListenerProvider.class);

    private final KeycloakSession session;

    public CustomEventListenerProvider(KeycloakSession session) {
        this.session = session;
    }

    @Override
    public void onEvent(Event event) {

        EventType[] eventTypes = new EventType [] {
            EventType.REGISTER,
            EventType.LOGIN,
            EventType.LOGOUT,
            EventType.LOGIN_ERROR,
            EventType.REGISTER_ERROR,
            EventType.RESET_PASSWORD,
            EventType.SEND_VERIFY_EMAIL,
            EventType.UPDATE_PROFILE
        };

        if (Arrays.stream(eventTypes).anyMatch(e -> e == event.getType())) {

            log.infof("## NEW %s EVENT", event.getType());

            try {
                JSONObject eventPayload = new JSONObject(event);

                HttpPost request = new HttpPost("https://127.0.0.1/api/auth/webhook");
                
                request.setEntity(EntityBuilder.create().setText(eventPayload.toString()).setContentType(ContentType.APPLICATION_JSON).build());

                HttpClientProvider provider = session.getProvider(org.keycloak.connections.httpclient.HttpClientProvider.class);
                CloseableHttpClient client = provider.getHttpClient();

                try (CloseableHttpResponse response = client.execute(request)) {
                    try {
                        int responseCode =  response.getStatusLine().getStatusCode();
                        if (responseCode == HttpURLConnection.HTTP_OK) {
                          log.infof("Sent %s into webhook", event.getId());
                        } else {
                            log.infof("Received Status Code: %s", responseCode);
                        }
                    } finally {
                        EntityUtils.consumeQuietly(response.getEntity());
                    }
                } catch (Throwable t) {
                    log.warn(t.getMessage(), t);
                    throw t;
                }
            
                // URL api = new URL();
                // HttpURLConnection con = (HttpURLConnection) api.openConnection();
                // con.setRequestMethod("POST");
                // con.setRequestProperty("Content-Type", "application/json");
                // con.setDoOutput(true);

                // OutputStream os = con.getOutputStream();
                // os.write(postUser.toString().getBytes());
                // os.flush();
                // os.close();

                // int responseCode = con.getResponseCode();

                // if (responseCode == HttpURLConnection.HTTP_OK) {
                //   log.infof("Registered %s into webhook", event.getUserId());
                // }

            } catch (IOException e) {
                log.error("Failed to send registration to webhook", e);
            }
        }
    }

    @Override
    public void onEvent(AdminEvent adminEvent, boolean b) {

    }

    @Override
    public void close() {

    }
}
