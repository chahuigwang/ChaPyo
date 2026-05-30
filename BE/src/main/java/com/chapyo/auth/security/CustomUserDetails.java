package com.chapyo.auth.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.chapyo.user.entity.User;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	private final User user;
	
	// 권한 반환 (USER, ADMIN)
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    // Spring Security에서 username = 식별자, 여기선 email
    @Override
    public String getUsername() {
        return user.getEmail();
    }

    // userId가 필요할 때 꺼내쓰는 용도
    public Long getUserId() {
        return user.getUserId();
    }

}
