import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FatigueData {
  perclos: number;
  blinkRate: number;
  blinkPattern: string;
  yawnCount: number;
  yawnFrequency: number;
  headPose: { pitch: number; yaw: number; roll: number };
  noddingDetected: boolean;
  alertLevel: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fatigueData } = await req.json() as { fatigueData: FatigueData };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert driver fatigue analyst. Analyze the provided fatigue metrics and give a natural language assessment with personalized recommendations.

Be concise but thorough. Focus on:
1. Current fatigue state interpretation
2. Risk assessment
3. Specific, actionable recommendations
4. Warning signs to watch for

Format your response as JSON with these fields:
- analysis: A 2-3 sentence natural language assessment of current fatigue state
- riskLevel: "low" | "moderate" | "high" | "critical"
- recommendations: Array of 3-4 specific actionable recommendations
- warningSign: The most concerning indicator if any
- encouragement: A brief motivational message`;

    const userPrompt = `Analyze these driver fatigue metrics:

PERCLOS (eye closure percentage): ${fatigueData.perclos}%
Blink Rate: ${fatigueData.blinkRate} blinks/min
Blink Pattern: ${fatigueData.blinkPattern}
Yawn Count: ${fatigueData.yawnCount}
Yawn Frequency: ${fatigueData.yawnFrequency}/min
Head Pose - Pitch: ${fatigueData.headPose.pitch}°, Yaw: ${fatigueData.headPose.yaw}°, Roll: ${fatigueData.headPose.roll}°
Nodding Detected: ${fatigueData.noddingDetected ? "Yes" : "No"}
Current Alert Level: ${fatigueData.alertLevel}

Provide your analysis as a JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch {
      analysisResult = {
        analysis: content,
        riskLevel: fatigueData.alertLevel === "critical" ? "critical" : 
                   fatigueData.alertLevel === "severe" ? "high" :
                   fatigueData.alertLevel === "fatigued" ? "moderate" : "low",
        recommendations: ["Stay hydrated", "Take regular breaks", "Maintain good posture"],
        warningSign: fatigueData.noddingDetected ? "Head nodding detected" : null,
        encouragement: "Stay safe on the road!"
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Fatigue analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
