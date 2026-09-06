package autoDev.server.security;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import autoDev.server.entity.User;
import lombok.Getter;
import org.jspecify.annotations.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.core.user.OAuth2User;

public class AppUserPrincipal implements OAuth2User {

    @Getter
    private final User user;
    private final Map<String, Object> attributes;

    public AppUserPrincipal(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    public UUID getId() {
        return user.getId();
    }

    @Override
    public @NonNull Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public @NonNull Collection<? extends GrantedAuthority> getAuthorities() {
        return AuthorityUtils.createAuthorityList("ROLE_USER");
    }

    @Override
    public @NonNull String getName() {
        return user.getId().toString();
    }
}