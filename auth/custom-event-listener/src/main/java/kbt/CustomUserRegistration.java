package kbt;

import java.util.ArrayList;
import java.util.List;

import javax.ws.rs.core.MultivaluedHashMap;
import javax.ws.rs.core.MultivaluedMap;
import javax.ws.rs.ext.Provider;

import org.jboss.logging.Logger;
import org.jboss.resteasy.spi.HttpRequest;
import org.json.JSONObject;
import org.keycloak.utils.RegexUtils;
import org.keycloak.authentication.FormContext;
import org.keycloak.authentication.ValidationContext;
import org.keycloak.authentication.forms.RegistrationUserCreation;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.utils.FormMessage;

@Provider
public class CustomUserRegistration extends RegistrationUserCreation {

  private static final Logger log = Logger.getLogger(CustomEventListenerProvider.class);

  @Override
  public String getId() {
    return "custom-registration-user-creation";
  }

  @Override
  public String getDisplayType() {
    return "Custom Registration User Creation";
  }

  @Override
  public void buildPage(FormContext context, LoginFormsProvider form) {
    KeycloakSession session = context.getSession();

    HttpRequest request = context.getHttpRequest();
    MultivaluedMap<String, String> queryParams = request.getUri().getQueryParameters();

    String groupCode = queryParams.getFirst("group_code");
    Boolean failedValidation = groupCode == null;

    if (failedValidation) {
      try {
        groupCode = request != null ? request.getDecodedFormParameters().getFirst("groupCode") : null;
      } catch (Exception e) {
      }
    }

    Boolean suppliedCode = groupCode != null && groupCode.length() > 0;

    if (suppliedCode) {
      String groupName = (String) session.getAttribute("groupName");
      String allowedDomains = (String) session.getAttribute("allowedDomains");

      if (groupName == null || allowedDomains == null || groupCode != (String) session.getAttribute("groupCode")) {
        // This block is getting basic group code info
        JSONObject registerInfoPayload = new JSONObject();
        registerInfoPayload.put("groupCode", groupCode);
        JSONObject response = BackchannelAuth.postApi("/auth/register/validate", registerInfoPayload,
            context.getRealm(), session);

        if (response.getBoolean("success")) {
          groupName = response.getString("name").replaceAll("_", " ");
          allowedDomains = response.getString("allowedDomains").replaceAll(",", ", ");
          session.setAttribute("groupCode", groupCode);
          session.setAttribute("groupName", groupName);
          session.setAttribute("allowedDomains", allowedDomains);
        } else if (response.getString("reason").contains("BAD_GROUP")) {
          form.setErrors(List.of(new FormMessage("groupCode", "invalidGroup")));
        }
      }

      if (!failedValidation) {
        MultivaluedMap<String, String> formData = new MultivaluedHashMap<String, String>();
        formData.putSingle("groupCode", groupCode);
        form.setFormData(formData);
      }

      form
          .setAttribute("groupName", groupName)
          .setAttribute("allowedDomains", allowedDomains);

    } else {
      session.removeAttribute("groupCode");
      session.removeAttribute("groupName");
      session.removeAttribute("allowedDomains");
    }

  }

  @Override
  public void validate(ValidationContext context) {
    KeycloakSession session = context.getSession();
    MultivaluedMap<String, String> formData = context.getHttpRequest().getDecodedFormParameters();

    if (formData.containsKey("groupCode")) {
      String groupCode = formData.getFirst("groupCode");
      String email = formData.getFirst("email");

      String groupName = (String) session.getAttribute("groupName");
      String allowedDomains = (String) session.getAttribute("allowedDomains");

      List<FormMessage> validationErrors = new ArrayList<>();

      Boolean suppliedCode = groupCode != null && groupCode.length() > 0;

      if ((groupName == null || allowedDomains == null) && suppliedCode) {

        if (!RegexUtils.valueMatchesRegex("[a-zA-Z0-9]{8}", groupCode)) {
          validationErrors.add(new FormMessage("groupCode", "invalidGroup"));
        } else {

          if (groupCode != session.getAttribute("groupCode")) {

            // Get group information for registration
            JSONObject registerInfoPayload = new JSONObject();
            registerInfoPayload.put("groupCode", groupCode);
            JSONObject response = BackchannelAuth.postApi("/auth/register/validate", registerInfoPayload,
                context.getRealm(), context.getSession());

            if (false == response.getBoolean("success")) {

              String reason = response.getString("reason");

              if (reason.contains("BAD_GROUP")) {
                validationErrors.add(new FormMessage("groupCode", "invalidGroup"));
              }
            } else {
              groupName = response.getString("name");
              allowedDomains = response.getString("allowedDomains");
              session.setAttribute("groupName", groupName);
              session.setAttribute("allowedDomains", allowedDomains);
            }
          }
        }
      }

      if (allowedDomains != null) {
        List<String> domains = List.of(allowedDomains.split(","));

        if (email == null || email.contains("@") && !domains.contains(email.split("@")[1])) {
          validationErrors.add(new FormMessage("email", "invalidEmail"));
        }
      } else if (suppliedCode) {
        validationErrors.add(new FormMessage("groupCode", "invalidGroup"));
      }

      if (!validationErrors.isEmpty()) {
        context.error("VALIDATION_ERROR");
        context.validationError(formData, validationErrors);
        return;
      }
    }
    super.validate(context);
  }

}
