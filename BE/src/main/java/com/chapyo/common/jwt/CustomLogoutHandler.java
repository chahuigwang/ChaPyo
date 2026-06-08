package com.chapyo.common.jwt;

import com.chapyo.auth.exception.AuthErrorCode;
import com.chapyo.auth.service.TokenBlacklistService;
import com.chapyo.common.response.BaseResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutHandler implements LogoutHandler {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;
    private final ObjectMapper objectMapper;

    @Override
    public void logout(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {

        String accessToken = resolveAccessToken(request);
        String refreshToken = resolveRefreshToken(request);

        if (accessToken == null || refreshToken == null) {
            log.warn("로그아웃 실패 - 토큰 없음");
            try {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        objectMapper.writeValueAsString(BaseResponse.fail(AuthErrorCode.TOKEN_NOT_FOUND))
                );
            } catch (IOException e) {
                log.error("응답 작성 실패: {}", e.getMessage());
            }
            return;
        }

        tokenBlacklistService.addBlacklist(accessToken, refreshToken);

        Long userId = jwtUtil.getUserId(accessToken);
        tokenBlacklistService.deleteRefreshToken(userId);

        ResponseCookie cookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();

        response.addHeader("Set-Cookie", cookie.toString());

        log.debug("로그아웃 완료 - userId: {}", userId);
    }

    private String resolveAccessToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private String resolveRefreshToken(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie cookie : request.getCookies()) {
            if ("refreshToken".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
