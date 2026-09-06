package autoDev.server.security;

import org.jspecify.annotations.NonNull;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import autoDev.server.entity.User;
import autoDev.server.services.UserService;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private final UserService userService;
    private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();

    @Override
    public OAuth2User loadUser(@NonNull OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User githubUser = delegate.loadUser(userRequest);

        String accessToken = userRequest.getAccessToken().getTokenValue();
        String scopes = String.join(",", userRequest.getAccessToken().getScopes());

        User user = userService.upsertFromGitHub(githubUser.getAttributes() , accessToken , scopes);
        return new AppUserPrincipal(user , githubUser.getAttributes());
    }
}