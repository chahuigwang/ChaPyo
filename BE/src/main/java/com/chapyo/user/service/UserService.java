package com.chapyo.user.service;

import com.chapyo.user.dto.response.UserInfoResponse;

public interface UserService {

    UserInfoResponse getMyInfo(Long userId);
}
