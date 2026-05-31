import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, company_slug } = await req.json();

    if (!session_id || !company_slug) {
      return new Response(JSON.stringify({ error: "Missing session_id or company_slug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🤖 Processing question generation for session=${session_id}, company=${company_slug}...`);

    // 1. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const groqApiKey = Deno.env.get("GROQ_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase server credentials.");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch Cached DSA Questions for Company
    const { data: cacheData, error: cacheErr } = await supabase
      .from("question_cache")
      .select("questions_json, fallback_hints_json")
      .eq("company_slug", company_slug)
      .maybeSingle();

    if (cacheErr) {
      throw new Error(`Failed to fetch question cache: ${cacheErr.message}`);
    }

    let dsaQuestions = [];
    let fallbackHints = [];

    if (cacheData) {
      dsaQuestions = cacheData.questions_json || [];
      fallbackHints = cacheData.fallback_hints_json || [];
    }

    // Get top 5 questions by frequency
    const topDsaQuestions = dsaQuestions
      .sort((a: any, b: any) => (b.frequency || 0) - (a.frequency || 0))
      .slice(0, 5);

    let parsedDsaHints = [];
    let generationSuccess = false;

    // 3. Invoke Groq API for Brute/Optimal hints generation (with 1 retry)
    if (groqApiKey && topDsaQuestions.length > 0) {
      const prompt = `
        You are an expert technical interviewer. For each of the following LeetCode/DSA questions targeting ${company_slug}, generate short, concise, and structured hints:
        1. **Brute Force Approach**: 1-2 sentence description.
        2. **Optimal Approach**: 1-2 sentence description.
        3. **Time Complexity**: Big-O notation.
        4. **Space Complexity**: Big-O notation.

        Questions:
        ${topDsaQuestions.map((q: any) => `- [ID: ${q.id}] ${q.title} (${q.difficulty} difficulty)`).join("\n")}

        Respond strictly with a valid JSON array of objects. Do not wrap in markdown code blocks like \`\`\`json.
        JSON format:
        [
          {
            "id": "question_id_here",
            "title": "question_title_here",
            "bruteForce": "brute force description",
            "optimal": "optimal description",
            "timeComplexity": "O(N)",
            "spaceComplexity": "O(1)"
          }
        ]
      `;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`📡 Dispatching prompt to Groq API (Attempt ${attempt}/2)...`);
          
          const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model: "llama3-8b-8192", // Standard Llama 3.1 8B on Groq
              messages: [{ role: "user", content: prompt }],
              temperature: 0.2,
              max_tokens: 1200,
            }),
          });

          if (!groqResponse.ok) {
            throw new Error(`Groq returned error status: ${groqResponse.status}`);
          }

          const groqData = await groqResponse.json();
          const jsonText = groqData.choices?.[0]?.message?.content?.trim();
          
          // Clean JSON if groq wrapped it in markdown code fences anyway
          const cleanJsonText = jsonText
            .replace(/^```json/, "")
            .replace(/^```/, "")
            .replace(/```$/, "")
            .trim();

          parsedDsaHints = JSON.parse(cleanJsonText);
          if (Array.isArray(parsedDsaHints) && parsedDsaHints.length > 0) {
            generationSuccess = true;
            console.log(`✅ Groq hints generated successfully.`);
            break;
          }
        } catch (err: any) {
          console.warn(`⚠️ Groq Attempt ${attempt} failed:`, err.message);
          if (attempt === 1) {
            // Wait 3 seconds before retrying
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }
      }
    }

    // 4. Handle Fallbacks if Groq completely fails
    if (!generationSuccess) {
      console.warn("⚠️ Groq generation failed. Activating local cache fallback hints.");
      if (fallbackHints && fallbackHints.length > 0) {
        parsedDsaHints = fallbackHints;
      } else {
        // Absolute base fallback in case cache is empty
        parsedDsaHints = topDsaQuestions.map((q: any) => ({
          id: q.id,
          title: q.title,
          bruteForce: "Brute-force simulation of the constraints. Standard recursion or nesting.",
          optimal: "Optimize using two-pointers, hash maps, sliding windows, or sorting.",
          timeComplexity: "O(N) typical",
          spaceComplexity: "O(1) auxiliary",
        }));
      }
    }

    // 5. Append HR & Project Questions tailored to the company
    const hrQuestions = [
      `Why do you want to join ${company_slug} specifically? What values of ours resonate with you?`,
      "Tell me about a time you resolved a major technical conflict with a teammate.",
      "Describe a situation where you had to quickly adapt to a new technology under a tight deadline."
    ];

    const projectQuestions = [
      "Walk me through the architecture of your most proud technical project. What was the biggest scaling challenge?",
      "If you had to redesign your project from scratch today, what technical stack changes would you make and why?",
      "How did you handle state management and data privacy constraints in your recent projects?"
    ];

    // 6. Update sessions row
    const finalQuestionSheet = {
      dsa: parsedDsaHints,
      hr: hrQuestions,
      projects: projectQuestions,
      generatedAt: new Date().toISOString(),
      fallbackUsed: !generationSuccess,
    };

    const { error: updateErr } = await supabase
      .from("sessions")
      .update({ questions_json: finalQuestionSheet })
      .eq("id", session_id);

    if (updateErr) {
      throw updateErr;
    }

    console.log(`🎉 Session ${session_id} questions sheet fully populated!`);

    return new Response(JSON.stringify({ success: true, fallback: !generationSuccess }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("❌ Edge Function generate-questions failed:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
