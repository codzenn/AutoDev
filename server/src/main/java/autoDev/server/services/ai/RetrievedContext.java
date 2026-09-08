package autoDev.server.services.ai;

import autoDev.server.dto.CitationDto;

import java.util.List;

public record RetrievedContext(
        List<CitationDto> citations,
        String contextText) {
}
