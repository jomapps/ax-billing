# Moondream2 Vision Model Documentation

> Moondream2 is a highly efficient open-source vision language model that combines powerful image understanding capabilities with a remarkably small footprint.

## Overview

- **Endpoint**: `https://fal.run/fal-ai/moondream2/visual-query`
- **Model ID**: `fal-ai/moondream2/visual-query`
- **Category**: Vision Language Model
- **Kind**: Inference API
- **Tags**: Vision, OCR, Image Analysis

## API Information

This model can be used via HTTP API or client libraries for image analysis and text extraction.

### Input Schema

The API accepts the following input parameters:

- **`image_url`** (`string`, _required_):
  URL of the image to be processed
  - Examples: "https://llava-vl.github.io/static/images/monalisa.jpg"

- **`prompt`** (`string`, _required_):
  Query to be asked about the image

**Required Parameters Example**:

```json
{
  "image_url": "https://media.ft.tc/media/vehicle-AX-20250908-5336-1757438371929.jpg",
  "prompt": "Analyze this vehicle image and extract the license plate number and vehicle type"
}
```

### Output Schema

The API returns the following output format:

- **`output`** (`string`, _required_):
  Text response for the given query

**Example Response**:

```json
{
  "output": "This is a white sedan with license plate ABC-123"
}
```

## Usage Examples

### JavaScript (Node.js)

```javascript
import { fal } from "@fal-ai/client";

// Configure API key
fal.config({
  credentials: process.env.FAL_KEY
});

const result = await fal.subscribe("fal-ai/moondream2/visual-query", {
  input: {
    image_url: "https://media.ft.tc/media/vehicle-photo.jpg",
    prompt: "Extract the license plate number and identify the vehicle type"
  },
  logs: true,
  onQueueUpdate: (update) => {
    if (update.status === "IN_PROGRESS") {
      update.logs.map((log) => log.message).forEach(console.log);
    }
  },
});

console.log(result.data.output);
```

### cURL

```bash
curl --request POST \
  --url https://fal.run/fal-ai/moondream2/visual-query \
  --header "Authorization: Key $FAL_KEY" \
  --header "Content-Type: application/json" \
  --data '{
     "image_url": "https://media.ft.tc/media/vehicle-photo.jpg",
     "prompt": "Extract the license plate number and identify the vehicle type"
   }'
```

## Vehicle Recognition Use Case

For our car wash billing system, we use Moondream2 to:

1. **Extract License Plate Numbers**: Identify and read license plate text from vehicle photos
2. **Classify Vehicle Types**: Determine vehicle category (sedan, SUV, hatchback, etc.)
3. **Quality Assessment**: Evaluate image clarity and confidence levels

### Recommended Prompts

```javascript
// License plate extraction
const licensePlatePrompt = `
Analyze this vehicle image and extract the following information:
1. License plate number (extract the exact text)
2. Vehicle type (classify as: sedan, suv, hatchback, mpv, pickup, motorcycle, heavy_bike, van, truck)

Please respond in JSON format:
{
  "licensePlate": "extracted license plate text",
  "vehicleType": "sedan|suv|hatchback|mpv|pickup|motorcycle|heavy_bike|van|truck",
  "confidence": 0.95
}
`;
```

## Error Handling

Common error scenarios:
- **Invalid image URL**: Ensure image is accessible and in supported format
- **API rate limits**: Implement retry logic with exponential backoff
- **Poor image quality**: Provide fallback to manual input

## Performance Notes

- **Response time**: Typically 2-5 seconds for image analysis
- **Image formats**: Supports JPEG, PNG, WebP
- **Image size**: Optimal size 1-5MB for best performance
- **Concurrent requests**: Rate limited per API key

## Integration with Vehicle Processing Service

The model integrates with our `VehicleProcessingService` to provide:
- Automatic license plate recognition
- Vehicle type classification
- Confidence scoring for AI predictions
- Fallback to manual input when confidence is low

## Additional Resources

- [Model Playground](https://fal.ai/models/fal-ai/moondream2/visual-query)
- [API Documentation](https://fal.ai/models/fal-ai/moondream2/visual-query/api)
- [fal.ai Platform Documentation](https://docs.fal.ai)
- [JavaScript Client Documentation](https://docs.fal.ai/clients/javascript)
