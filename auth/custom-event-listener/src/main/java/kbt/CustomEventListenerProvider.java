package kbt;

import java.util.Arrays;

import org.json.JSONObject;
import org.jboss.logging.Logger;

import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;

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
        // EventType.REGISTER_ERROR,
        EventType.LOGIN,
        EventType.LOGOUT,
        EventType.LOGIN_ERROR,
        EventType.RESET_PASSWORD,
        EventType.SEND_VERIFY_EMAIL,
        EventType.UPDATE_PROFILE
    };

    if (EventType.REGISTER == event.getType()) {
      handleRegistration(event);
      log.infof("Handled new user registration successfully %s", event.getUserId());
      return;
    }

    if (Arrays.stream(eventTypes).anyMatch(e -> e == event.getType())) {

      JSONObject eventPayload = new JSONObject(event);

      log.infof("## NEW %s EVENT", event.getType() + ": " + eventPayload.toString());

      // Get group information for registration
      JSONObject response = BackchannelAuth.postApi("/auth/webhook", eventPayload,
          session.realms().getRealm(event.getRealmId()), session);

      if (false == response.getBoolean("success")) {
        String reason = response.getString("reason");
        log.info("The event was not successful: " + reason);
      } else {
        log.info("The event was a success!");
      }
    }
  }

  @Override
  public void onEvent(AdminEvent adminEvent, boolean b) {

  }

  @Override
  public void close() {

  }

  private void handleRegistration(Event event) {
    
  }
}
