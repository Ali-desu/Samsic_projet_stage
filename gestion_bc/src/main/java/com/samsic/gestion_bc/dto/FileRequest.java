package com.samsic.gestion_bc.dto;

import lombok.*;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileRequest {

    private MultipartFile file;
    private String fileName;
    private String fileType;

}
