package com.chapyo.trip.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TripItemOrderRequest {

    @Schema(description = "변경할 순서 목록")
    @NotNull
    private List<ItemOrder> itemOrders;

    @Getter
    @NoArgsConstructor
    public static class ItemOrder {

        @Schema(description = "아이템 ID", example = "1")
        @NotNull
        private Long itemId;

        @Schema(description = "순서", example = "1")
        @NotNull
        private Integer order;
    }
}
