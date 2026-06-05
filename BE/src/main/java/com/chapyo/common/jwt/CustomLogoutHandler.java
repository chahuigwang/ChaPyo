package com.chapyo.common.jwt;

import com.chapyo.auth.service.TokenBlacklistService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CustomLogoutHandler implements LogoutHandler {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    public void logout(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) {

        // Access Token 추출
        String accessToken = resolveAccessToken(request);

        // Refresh Token 추출 (HttpOnly 쿠키)
        String refreshToken = resolveRefreshToken(request);

        if (accessToken == null || refreshToken == null) {
            log.warn("로그아웃 실패 - 토큰 없음");
            return;
        }

        // 블랙리스트 등록
        tokenBlacklistService.addBlacklist(accessToken, refreshToken);

        // Redis에서 Refresh Token 삭제
        Long userId = jwtUtil.getUserId(accessToken);
        tokenBlacklistService.deleteRefreshToken(userId);

        // Refresh Token 쿠키 삭제
        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);

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
