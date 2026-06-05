package com.chapyo.auth.controller;

import com.chapyo.auth.dto.request.LoginRequest;
import com.chapyo.auth.dto.request.PasswordResetRequest;
import com.chapyo.auth.dto.request.SignupRequest;
import com.chapyo.auth.service.AuthService;
import com.chapyo.common.response.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Auth", description = "인증 관련 API")
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "로그인")
    @SecurityRequirements
    @PostMapping("/login")
    public ResponseEntity<BaseResponse<?>> login(@RequestBody LoginRequest request) {
        // LoginFilter가 처리하므로 여기는 실행되지 않음
        return null;
    }

    @Operation(summary = "로그아웃")
    @PostMapping("/logout")
    public ResponseEntity<BaseResponse<?>> logout() {
        // LogoutHandler가 처리하므로 여기는 실행되지 않음
        return null;
    }

    @Operation(summary = "Access Token 재발급")
    @PostMapping("/reissue")
    public ResponseEntity<BaseResponse<?>> reissue(HttpServletRequest request) {
        String refreshToken = resolveRefreshToken(request);
        return ResponseEntity.ok(BaseResponse.success(authService.reissue(refreshToken)));
    }

    @Operation(summary = "회원가입")
    @SecurityRequirements
    @PostMapping("/signup")
    public ResponseEntity<BaseResponse<?>> signup(@RequestBody @Valid SignupRequest request) {
        authService.signup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success("회원가입이 완료되었습니다."));
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

    @Operation(summary = "비밀번호 재설정")
    @SecurityRequirements
    @PostMapping("/password")
    public ResponseEntity<BaseResponse<?>> resetPassword(@RequestBody @Valid PasswordResetRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(BaseResponse.success("비밀번호가 재설정되었습니다."));
    }
}
