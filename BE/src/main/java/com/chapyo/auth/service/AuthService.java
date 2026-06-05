package com.chapyo.auth.service;

import com.chapyo.auth.dto.request.PasswordResetRequest;
import com.chapyo.auth.dto.request.SignupRequest;
import com.chapyo.auth.exception.AuthErrorCode;
import com.chapyo.common.exception.CustomException;
import com.chapyo.common.jwt.JwtUtil;
import com.chapyo.user.entity.User;
import com.chapyo.user.repository.UserMapper;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserMapper userMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    public Map<String, String> reissue(String refreshToken) {

        if (refreshToken == null) {
            throw new CustomException(AuthErrorCode.TOKEN_NOT_FOUND);
        }

        jwtUtil.validate(refreshToken);  // isValid() 대신 validate()로 변경

        if (!"refresh".equals(jwtUtil.getType(refreshToken))) {
            throw new CustomException(AuthErrorCode.INVALID_TOKEN);
        }

        if (tokenBlacklistService.isBlacklisted(refreshToken)) {
            throw new CustomException(AuthErrorCode.BLACKLISTED_TOKEN);
        }

        Long userId = jwtUtil.getUserId(refreshToken);
        String savedToken = tokenBlacklistService.getRefreshToken(userId);

        if (!refreshToken.equals(savedToken)) {
            throw new CustomException(AuthErrorCode.TOKEN_MISMATCH);
        }

        String role = jwtUtil.getRole(refreshToken);
        String newAccessToken = jwtUtil.generateAccessToken(userId, role);

        log.debug("Access Token 재발급 - userId: {}", userId);

        return Map.of("accessToken", newAccessToken);
    }

    public void signup(SignupRequest request) {

        // 이메일 중복 확인
        userMapper.findByEmail(request.getEmail()).ifPresent(u -> {
            throw new CustomException(AuthErrorCode.DUPLICATE_EMAIL);
        });

        User user = User.builder()
                .nickname(request.getNickname())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userMapper.insert(user);
    }

    public void resetPassword(PasswordResetRequest request) {
        User user = userMapper.findByNicknameAndEmail(request.getNickname(), request.getEmail())
                .orElseThrow(() -> new CustomException(AuthErrorCode.USER_NOT_FOUND));

        userMapper.updatePassword(user.getUserId(), passwordEncoder.encode(request.getNewPassword()));
    }
}
