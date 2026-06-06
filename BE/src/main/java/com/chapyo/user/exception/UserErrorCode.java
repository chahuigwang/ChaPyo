package com.chapyo.user.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum UserErrorCode implements ErrorCode {

    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "USER_001", "존재하지 않는 사용자입니다."),
    INVALID_PASSWORD(HttpStatus.UNAUTHORIZED, "USER_002", "비밀번호가 일치하지 않습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
