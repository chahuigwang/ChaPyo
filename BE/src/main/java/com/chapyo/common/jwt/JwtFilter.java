package com.chapyo.common.jwt;

import com.chapyo.auth.service.TokenBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        log.debug("요청 URL: {}", request.getRequestURI());
        log.debug("추출된 토큰: {}", token);

        if (token != null && jwtUtil.isValid(token) && !tokenBlacklistService.isBlacklisted(token)) {
            log.debug("토큰 유효 - 타입: {}", jwtUtil.getType(token));
            // ...
        } else {
            log.debug("토큰 없음 or 유효하지 않음 or 블랙리스트");
        }

        if (token != null && jwtUtil.isValid(token) && !tokenBlacklistService.isBlacklisted(token)) {

            // access 토큰인지 확인
            if (!"access".equals(jwtUtil.getType(token))) {
                sendUnauthorized(response, "Access Token이 아닙니다.");
                return;
            }

            // SecurityContext에 인증 정보 저장
            Long userId = jwtUtil.getUserId(token);
            String role = jwtUtil.getRole(token);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("SecurityContext 저장 완료 - userId: {}, role: {}", userId, role);  // 추가
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                "{\"message\": \"" + message + "\"}"
        );
    }
}
