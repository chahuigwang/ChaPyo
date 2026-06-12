package com.chapyo.place.batch;

import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.batch.item.Chunk;
import org.springframework.batch.item.ItemWriter;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class PlaceEmbeddingWriter implements ItemWriter<Document> {

    private final VectorStore vectorStore;

    public PlaceEmbeddingWriter(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    @Override
    public void write(Chunk<? extends Document> chunk) {
        List<Document> documents = new ArrayList<>(chunk.getItems());
        log.info("Chroma에 저장 시도: {}건", documents.size());
        vectorStore.add(documents);
        log.info("Chroma 저장 완료");
    }
}