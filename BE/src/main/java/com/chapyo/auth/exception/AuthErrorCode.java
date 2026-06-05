package com.chapyo.auth.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_001", "이미 사용 중인 이메일입니다."),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_002", "만료된 토큰입니다."),
    BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_003", "이미 로그아웃된 토큰입니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_004", "유효하지 않은 토큰입니다."),
    TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "AUTH_005", "토큰이 없습니다."),
    TOKEN_MISMATCH(HttpStatus.UNAUTHORIZED, "AUTH_006", "토큰이 일치하지 않습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
