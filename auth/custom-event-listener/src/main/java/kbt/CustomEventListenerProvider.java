package kbt;

import java.net.HttpURLConnection;
import java.util.Arrays;

import org.json.JSONObject;
import org.apache.http.HttpEntity;
import org.apache.http.client.entity.EntityBuilder;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;

import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;

public class CustomEventListenerProvider implements EventListenerProvider {

  private static final Logger log = Logger.getLogger(CustomEventListenerProvider.class);

  private final KeycloakSession session;

  public CustomEventListenerProvider(KeycloakSession session) {
    this.session = session;
  }

  @Override
  public void onEvent(Event event) {

    EventType[] eventTypes = new EventType[] {
        // EventType.REGISTER,
        EventType.LOGIN,
        EventType.LOGOUT,
        EventType.LOGIN_ERROR,
        EventType.REGISTER_ERROR,
        EventType.RESET_PASSWORD,
        EventType.SEND_VERIFY_EMAIL,
        EventType.UPDATE_PROFILE
    };

    if (Arrays.stream(eventTypes).anyMatch(e -> e == event.getType())) {


      JSONObject eventPayload = new JSONObject(event);
      String realmId = event.getRealmId();
      RealmModel realm = session.realms().getRealm(realmId);

      log.infof("## NEW %s EVENT", event.getType() + ": " + eventPayload.toString());

      HttpPost request = new HttpPost("https://127.0.0.1/api/auth/webhook");
      request.setHeader("x-backchannel-id", BackchannelAuth.getClientSecret(realm));
      request.setEntity(EntityBuilder.create().setText(eventPayload.toString())
          .setContentType(ContentType.APPLICATION_JSON).build());

      try (CloseableHttpResponse response = session
        .getProvider(org.keycloak.connections.httpclient.HttpClientProvider.class)
        .getHttpClient()
        .execute(request)) {
        try {
          if (response.getStatusLine().getStatusCode() == HttpURLConnection.HTTP_OK) {
            log.infof("XXXXXXXXXXXXXX Sent %s into webhook SUCCESS", event.getId());
          } else {
            HttpEntity entity = response.getEntity();
            if (entity != null) {
              String responseBody = EntityUtils.toString(entity);
              JSONObject json = new JSONObject(responseBody);
              String reason = json.getString("reason");
              log.infof("XXXXXXXXXXXXXX Webhook failure " + event.getId() + " " + reason);
            }
          }
        } finally {
          EntityUtils.consumeQuietly(response.getEntity());
        }
      } catch (Exception e) {
        log.warn(e.getMessage(), e);
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
