package com.chapyo.place.batch;

import com.chapyo.place.dto.PlaceEmbeddingData;
import com.chapyo.place.repository.PlaceMapper;
import org.springframework.batch.item.ItemReader;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PlaceEmbeddingReader implements ItemReader<PlaceEmbeddingData> {

    private static final int PAGE_SIZE = 50;

    private final PlaceMapper placeMapper;
    private List<PlaceEmbeddingData> buffer = new ArrayList<>();
    private int offset = 0;
    private boolean done = false;

    public PlaceEmbeddingReader(PlaceMapper placeMapper) {
        this.placeMapper = placeMapper;
    }

    @Override
    public PlaceEmbeddingData read() {
        if (buffer.isEmpty() && !done) {
            List<PlaceEmbeddingData> page = placeMapper.findAll(offset, PAGE_SIZE);
            if (page.isEmpty()) {
                done = true;
                return null;
            }
            buffer.addAll(page);
            offset += page.size();
        }

        if (buffer.isEmpty()) return null;
        return buffer.removeFirst();
    }
}