package com.chapyo.common.response;

import com.chapyo.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;

@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BaseResponse<T> {

    private final boolean success;
    private final String message;
    private final T data;

    private BaseResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
    }

    // 성공 - 데이터만
    public static <T> BaseResponse<T> success(T data) {
        return new BaseResponse<>(true, null, data);
    }
    
    // 성공 - 메시지만
    public static <T> BaseResponse<T> success(String message) {
        return new BaseResponse<>(true, message, null);
    }
    
    // 성공 - 메시지 + 데이터
    public static <T> BaseResponse<T> success(String message, T data) {
        return new BaseResponse<>(true, message, data);
    }

    // 실패
    public static <T> BaseResponse<T> fail(ErrorCode errorCode) {
        return new BaseResponse<>(false, errorCode.getMessage(), null);
    }
}
