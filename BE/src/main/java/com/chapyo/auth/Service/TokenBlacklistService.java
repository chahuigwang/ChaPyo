package com.chapyo.auth.service;

import com.chapyo.common.jwt.JwtUtil;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;
    private final JwtUtil jwtUtil;

    private static final String BLACKLIST_PREFIX = "blacklist:";
    private static final String REFRESH_PREFIX = "refresh:";

    // 로그인 시 Refresh Token 저장
    public void saveRefreshToken(Long userId, String refreshToken) {
        long expiration = jwtUtil.getRemaining(refreshToken);
        redisTemplate.opsForValue().set(
                REFRESH_PREFIX + userId,
                refreshToken,
                expiration,
                TimeUnit.MILLISECONDS
        );
        log.debug("Refresh Token 저장 - userId: {}", userId);
    }

    // 로그아웃 시 블랙리스트 등록
    public void addBlacklist(String accessToken, String refreshToken) {
        long accessRemaining = jwtUtil.getRemaining(accessToken);
        long refreshRemaining = jwtUtil.getRemaining(refreshToken);

        if (accessRemaining > 0) {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + accessToken,
                    "logout",
                    accessRemaining,
                    TimeUnit.MILLISECONDS
            );
        }

        if (refreshRemaining > 0) {
            redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + refreshToken,
                    "logout",
                    refreshRemaining,
                    TimeUnit.MILLISECONDS
            );
        }

        log.debug("블랙리스트 등록 완료");
    }

    // 블랙리스트 여부 확인
    public boolean isBlacklisted(String token) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(BLACKLIST_PREFIX + token)
        );
    }

    // Refresh Token 조회
    public String getRefreshToken(Long userId) {
        return redisTemplate.opsForValue().get(REFRESH_PREFIX + userId);
    }

    // Refresh Token 삭제 (로그아웃 시)
    public void deleteRefreshToken(Long userId) {
        redisTemplate.delete(REFRESH_PREFIX + userId);
        log.debug("Refresh Token 삭제 - userId: {}", userId);
    }
}
