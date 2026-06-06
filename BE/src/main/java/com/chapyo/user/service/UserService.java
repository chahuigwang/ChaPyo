package com.chapyo.user.service;

import com.chapyo.user.dto.request.UpdatePasswordRequest;
import com.chapyo.user.dto.request.UpdateProfileRequest;
import com.chapyo.user.dto.response.UserInfoResponse;

public interface UserService {

    UserInfoResponse getMyInfo(Long userId);
    void updateProfile(Long userId, UpdateProfileRequest request);
    void updatePassword(Long userId, UpdatePasswordRequest request);
}
