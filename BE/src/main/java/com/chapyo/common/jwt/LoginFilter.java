package com.chapyo.common.jwt;

import com.chapyo.auth.dto.response.LoginSuccessResponse;
import com.chapyo.auth.exception.AuthErrorCode;
import com.chapyo.auth.service.TokenBlacklistService;
import com.chapyo.auth.dto.request.LoginRequest;
import com.chapyo.auth.security.CustomUserDetails;
import com.chapyo.common.response.BaseResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Slf4j
public class LoginFilter extends UsernamePasswordAuthenticationFilter {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final ObjectMapper objectMapper;

    public LoginFilter(AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            TokenBlacklistService tokenBlacklistService,
            ObjectMapper objectMapper) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.tokenBlacklistService = tokenBlacklistService;
        this.objectMapper = objectMapper;
        setFilterProcessesUrl("/api/v1/auth/login");
    }

    // 로그인 요청에서 email/password 추출 → 인증 시도
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request,
            HttpServletResponse response) throws AuthenticationException {
        try {
            LoginRequest loginRequest = objectMapper.readValue(
                    request.getInputStream(), LoginRequest.class);

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    );

            return authenticationManager.authenticate(authToken);

        } catch (IOException e) {
            log.error("로그인 요청 파싱 실패: {}", e.getMessage());
            throw new AuthenticationServiceException("로그인 요청 파싱 실패");
        }
    }

    // 인증 성공 → 토큰 발급
    @Override
    protected void successfulAuthentication(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain,
            Authentication authentication) throws IOException {
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        Long userId = userDetails.getUserId();
        String role = userDetails.getUser().getRole().name();
        String nickname = userDetails.getUser().getNickname();
        String email = userDetails.getUser().getEmail();

        String accessToken = jwtUtil.generateAccessToken(userId, role);
        String refreshToken = jwtUtil.generateRefreshToken(userId);

        tokenBlacklistService.saveRefreshToken(userId, refreshToken);

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(jwtUtil.getRefreshExpiration() / 1000)
                .sameSite("None")
                .build();

        response.addHeader("Set-Cookie", refreshCookie.toString());

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(
                        BaseResponse.success(LoginSuccessResponse.builder()
                                .accessToken(accessToken)
                                .nickname(nickname)
                                .email(email)
                                .build())
                )
        );

        log.debug("로그인 성공 - userId: {}", userId);
    }

    // 인증 실패 → 401 반환
    @Override
    protected void unsuccessfulAuthentication(HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException failed) throws IOException {
        log.warn("로그인 실패: {}", failed.getMessage());
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(BaseResponse.fail(AuthErrorCode.INVALID_CREDENTIALS))
        );
    }
}
