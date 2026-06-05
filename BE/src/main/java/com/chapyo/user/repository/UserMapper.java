package com.chapyo.user.repository;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

import com.chapyo.user.entity.User;

@Mapper
public interface UserMapper {

	Optional<User> findByEmail(String email);
	void insert(User user);
}
