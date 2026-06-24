package com.chapyo.library.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum LibraryErrorCode implements ErrorCode {

    LIBRARY_NOT_FOUND(HttpStatus.NOT_FOUND, "LIBRARY_001", "존재하지 않는 라이브러리입니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "LIBRARY_002", "권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}