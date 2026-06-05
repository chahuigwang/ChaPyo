package com.chapyo.auth.service;

import com.chapyo.auth.security.CustomUserDetails;
import com.chapyo.user.entity.User;
import com.chapyo.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userMapper.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("존재하지 않는 이메일: {}", email);
                    return new UsernameNotFoundException("존재하지 않는 이메일: " + email);
                });

        return new CustomUserDetails(user);
    }
}
