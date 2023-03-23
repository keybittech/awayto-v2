package kbt;

import java.net.HttpURLConnection;

import org.apache.http.HttpEntity;
import org.apache.http.client.entity.EntityBuilder;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.util.EntityUtils;
import org.jboss.logging.Logger;
import org.json.JSONObject;
import org.keycloak.authentication.FormContext;
import org.keycloak.models.ClientModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;

public final class BackchannelAuth {
  private BackchannelAuth() {
  }

  private static final Logger log = Logger.getLogger(CustomEventListenerProvider.class);

  public static String getClientSecret(RealmModel realm) {
    String clientId = System.getenv("KC_API_CLIENT_ID");
    ClientModel client = realm.getClientByClientId(clientId);
    if (client != null) {
      return client.getSecret();
    } else {
      return null;
    }
  }

  public static JSONObject postApi(String endpoint, JSONObject payload, RealmModel realm, KeycloakSession session) {
    JSONObject response = new JSONObject();
    response.put("success", false);
    
    try {
      
      HttpPost httpPost = new HttpPost("https://127.0.0.1/api" + endpoint);
      httpPost.setHeader("x-backchannel-id", getClientSecret(realm));
      httpPost.setEntity(EntityBuilder.create().setText(payload.toString())
          .setContentType(ContentType.APPLICATION_JSON).build());

      try (CloseableHttpResponse httpPostResponse = session
          .getProvider(org.keycloak.connections.httpclient.HttpClientProvider.class)
          .getHttpClient().execute(httpPost)) {
        try {
          HttpEntity entity = httpPostResponse.getEntity();
          if (entity != null) {
            response = new JSONObject(EntityUtils.toString(entity));
            response.put("success", httpPostResponse.getStatusLine().getStatusCode() == HttpURLConnection.HTTP_OK);
            return response;
          }
        } finally {
          EntityUtils.consumeQuietly(httpPostResponse.getEntity());
        }
      } catch (Exception e) {
        log.warn(e.getMessage(), e);
      }
    } catch (Exception e) {
      log.warn(e.getMessage(), e);
    }

    return response;
  }
}
