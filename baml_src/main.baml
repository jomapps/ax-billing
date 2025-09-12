generator lang_typescript {
  output_type typescript
  output_dir "../src/lib/baml_client"
  version "0.207.0"
}

client<llm> OpenAI {
  provider openai
  options {
    model "gpt-4o"
    api_key env.OPENROUTER_API_KEY
    base_url "https://openrouter.ai/api/v1"
  }
}

client<llm> FAL {
  provider openai
  options {
    model "fal-ai/llavav15-13b"
    api_key env.FAL_KEY
    base_url "https://fal.run"
  }
}

enum VehicleType {
  CAR
  TRUCK
  MOTORCYCLE
  VAN
  SUV
  OTHER
}

enum DamageType {
  SCRATCH
  DENT
  CRACK
  BROKEN_PART
  RUST
  PAINT_DAMAGE
  STRUCTURAL_DAMAGE
  OTHER
}

enum DamageSeverity {
  MINOR
  MODERATE
  SEVERE
  TOTAL_LOSS
}

class VehicleDamage {
  type DamageType
  severity DamageSeverity
  location string
  description string
  estimated_cost_range string?
}

class VehicleAnalysis {
  vehicle_type VehicleType
  make string?
  model string?
  year int?
  color string?
  license_plate string?
  damages VehicleDamage[]
  overall_condition string
  estimated_total_cost string?
  recommendations string[]
  confidence_score float?
}

function AnalyzeVehicleImage(image_url: string) -> VehicleAnalysis {
  client OpenAI
  prompt #"
    Analyze this vehicle image and provide a detailed assessment.
    
    Image: {{ image_url }}
    
    Please identify:
    1. Vehicle type, make, model, year, and color if visible
    2. All visible damages with their type, severity, location, and description
    3. Overall vehicle condition
    4. Estimated repair costs (provide ranges like "$500-$1000")
    5. Recommendations for repairs
    
    Be thorough and accurate in your assessment. If you cannot determine something with confidence, indicate uncertainty.
  "#
}

function GenerateServiceRecommendations(vehicle_analysis: VehicleAnalysis, customer_tier: string) -> string[] {
  client OpenAI
  prompt #"
    Based on this vehicle analysis and customer tier, generate service recommendations:
    
    Vehicle Analysis: {{ vehicle_analysis }}
    Customer Tier: {{ customer_tier }}
    
    Provide specific service recommendations considering:
    - The identified damages and their severity
    - Customer tier (premium customers get more comprehensive options)
    - Cost-effectiveness
    - Safety priorities
    
    Return a list of recommended services with brief explanations.
  "#
}

function EstimateServiceCosts(damages: VehicleDamage[], services: string[]) -> string {
  client OpenAI
  prompt #"
    Estimate costs for these vehicle damages and requested services:

    Damages: {{ damages }}
    Services: {{ services }}

    Provide a detailed cost breakdown including:
    - Individual damage repair costs
    - Service costs
    - Labor estimates
    - Parts estimates
    - Total estimated cost range

    Format as a clear, itemized estimate.
  "#
}

function AnalyzeVehicleDamage(image_url: string, image_type: string) -> VehicleAnalysis {
  client OpenAI
  prompt #"
    Analyze this vehicle image for damage assessment and vehicle information.

    Image: {{ image_url }}
    Image Type: {{ image_type }}

    {% if image_type == "front" %}
    This is a front view of the vehicle. Pay special attention to:
    - Front license plate
    - Front bumper damage
    - Headlight condition
    - Windshield condition
    - Hood damage
    {% elif image_type == "back" %}
    This is a rear view of the vehicle. Pay special attention to:
    - Rear license plate
    - Rear bumper damage
    - Taillight condition
    - Rear windshield condition
    - Trunk/tailgate damage
    {% elif image_type == "left" %}
    This is a left side view of the vehicle. Pay special attention to:
    - Left side doors
    - Left side windows
    - Left side mirrors
    - Side panel damage
    - Wheel condition
    {% elif image_type == "right" %}
    This is a right side view of the vehicle. Pay special attention to:
    - Right side doors
    - Right side windows
    - Right side mirrors
    - Side panel damage
    - Wheel condition
    {% elif image_type == "damage" %}
    This is a close-up damage photo. Provide detailed analysis of:
    - Type of damage (scratch, dent, crack, etc.)
    - Severity assessment
    - Exact location on vehicle
    - Potential cause
    {% elif image_type == "license_plate" %}
    This is a license plate close-up. Focus on:
    - Exact license plate text
    - Plate condition
    - Any damage to the plate
    {% endif %}

    Please provide a comprehensive assessment including:
    1. Vehicle type, make, model, year, and color if visible
    2. License plate number (extract exact text if visible)
    3. All visible damages with type, severity, location, and description
    4. Overall vehicle condition assessment
    5. Estimated repair costs for each damage (provide ranges)
    6. Confidence score for the analysis (0.0 to 1.0)

    Be thorough and accurate. If you cannot determine something with confidence, indicate uncertainty and lower the confidence score accordingly.
  "#
}

function AnalyzeVehicleDamageFal(image_url: string, image_type: string) -> VehicleAnalysis {
  client FAL
  prompt #"
    Analyze this vehicle image for damage assessment and vehicle information.

    Image: {{ image_url }}
    Image Type: {{ image_type }}

    {% if image_type == "front" %}
    This is a front view of the vehicle. Pay special attention to:
    - Front license plate
    - Front bumper damage
    - Headlight condition
    - Windshield condition
    - Hood damage
    {% elif image_type == "back" %}
    This is a rear view of the vehicle. Pay special attention to:
    - Rear license plate
    - Rear bumper damage
    - Taillight condition
    - Rear windshield condition
    - Trunk/tailgate damage
    {% elif image_type == "left" %}
    This is a left side view of the vehicle. Pay special attention to:
    - Left side doors
    - Left side windows
    - Left side mirrors
    - Side panel damage
    - Wheel condition
    {% elif image_type == "right" %}
    This is a right side view of the vehicle. Pay special attention to:
    - Right side doors
    - Right side windows
    - Right side mirrors
    - Side panel damage
    - Wheel condition
    {% elif image_type == "damage" %}
    This is a close-up damage photo. Provide detailed analysis of:
    - Type of damage (scratch, dent, crack, etc.)
    - Severity assessment
    - Exact location on vehicle
    - Potential cause
    {% elif image_type == "license_plate" %}
    This is a license plate close-up. Focus on:
    - Exact license plate text
    - Plate condition
    - Any damage to the plate
    {% endif %}

    Please provide a comprehensive assessment including:
    1. Vehicle type, make, model, year, and color if visible
    2. License plate number (extract exact text if visible)
    3. All visible damages with type, severity, location, and description
    4. Overall vehicle condition assessment
    5. Estimated repair costs for each damage (provide ranges)
    6. Confidence score for the analysis (0.0 to 1.0)

    Be thorough and accurate. If you cannot determine something with confidence, indicate uncertainty and lower the confidence score accordingly.
  "#
}

function AnalyzeVehicleImageFal(image_url: string) -> VehicleAnalysis {
  client FAL
  prompt #"
    Analyze this vehicle image and provide a detailed assessment.

    Image: {{ image_url }}

    Please identify:
    1. Vehicle type, make, model, year, and color if visible
    2. All visible damages with their type, severity, location, and description
    3. Overall vehicle condition
    4. Estimated repair costs (provide ranges like "$500-$1000")
    5. Recommendations for repairs

    Be thorough and accurate in your assessment. If you cannot determine something with confidence, indicate uncertainty.
  "#
}
