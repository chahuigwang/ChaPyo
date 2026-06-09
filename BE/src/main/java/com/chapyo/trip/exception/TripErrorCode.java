package com.chapyo.trip.exception;

import com.chapyo.common.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum TripErrorCode implements ErrorCode {

    TRIP_NOT_FOUND(HttpStatus.NOT_FOUND, "TRIP_001", "존재하지 않는 여행 계획입니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "TRIP_002", "접근 권한이 없습니다."),
    ALREADY_MEMBER(HttpStatus.CONFLICT, "TRIP_003", "이미 멤버입니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "TRIP_004", "존재하지 않는 사용자입니다.");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;
}
