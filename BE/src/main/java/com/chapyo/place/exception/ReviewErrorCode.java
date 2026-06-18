package com.chapyo.place.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ReviewErrorCode implements ErrorCode {

    ALREADY_REVIEWED(HttpStatus.CONFLICT, "REVIEW_001", "이미 리뷰를 작성했습니다."),
    REVIEW_NOT_FOUND(HttpStatus.NOT_FOUND, "REVIEW_002", "존재하지 않는 리뷰입니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "REVIEW_003", "리뷰 수정/삭제 권한이 없습니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
