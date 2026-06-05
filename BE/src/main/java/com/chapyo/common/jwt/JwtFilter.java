package com.chapyo.common.jwt;

import com.chapyo.auth.exception.AuthErrorCode;
import com.chapyo.auth.service.TokenBlacklistService;
import com.chapyo.common.exception.CustomException;
import com.chapyo.common.exception.ErrorCode;
import com.chapyo.common.response.BaseResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null) {
            try {
                jwtUtil.validate(token);
            } catch (CustomException e) {
                sendErrorResponse(response, e.getErrorCode());
                return;
            }

            if (tokenBlacklistService.isBlacklisted(token)) {
                sendErrorResponse(response, AuthErrorCode.BLACKLISTED_TOKEN);
                return;
            }

            if (!"access".equals(jwtUtil.getType(token))) {
                sendErrorResponse(response, AuthErrorCode.INVALID_TOKEN);
                return;
            }

            Long userId = jwtUtil.getUserId(token);
            String role = jwtUtil.getRole(token);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userId,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("SecurityContext 저장 완료 - userId: {}, role: {}", userId, role);
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

    private void sendErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(
                objectMapper.writeValueAsString(BaseResponse.fail(errorCode))
        );
    }
}