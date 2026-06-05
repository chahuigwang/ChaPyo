package com.chapyo.auth.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum AuthErrorCode implements ErrorCode {

    TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "AUTH_001", "토큰이 없습니다."),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_002", "유효하지 않은 토큰입니다."),
    BLACKLISTED_TOKEN(HttpStatus.UNAUTHORIZED, "AUTH_003", "이미 로그아웃된 토큰입니다."),
    TOKEN_MISMATCH(HttpStatus.UNAUTHORIZED, "AUTH_004", "토큰이 일치하지 않습니다."),
    DUPLICATE_EMAIL(HttpStatus.CONFLICT, "AUTH_005", "이미 사용 중인 이메일입니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
