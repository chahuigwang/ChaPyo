package com.chapyo.place.batch;

import com.chapyo.place.dto.PlaceEmbeddingData;
import org.springframework.ai.document.Document;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class EmbeddingJobConfig {

    @Bean
    public Job embeddingJob(JobRepository jobRepository, Step embedPlacesStep) {
        return new JobBuilder("embeddingJob", jobRepository)
                .start(embedPlacesStep)
                .build();
    }

    @Bean
    public Step embedPlacesStep(
            JobRepository jobRepository,
            PlatformTransactionManager transactionManager,
            PlaceEmbeddingReader reader,
            PlaceEmbeddingProcessor processor,
            PlaceEmbeddingWriter writer
    ) {
        return new StepBuilder("embedPlacesStep", jobRepository)
                .<PlaceEmbeddingData, Document>chunk(50, transactionManager)
                .reader(reader)
                .processor(processor)
                .writer(writer)
                .build();
    }
}