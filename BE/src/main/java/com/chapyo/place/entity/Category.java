package com.chapyo.place.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    private String code;
    private String name;
    private String parentCode;
}
