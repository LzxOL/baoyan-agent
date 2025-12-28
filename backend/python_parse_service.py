from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import re
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
# uvicorn python_parse_service:app --host 127.0.0.1 --port 8000
load_dotenv()

try:
    from openai import OpenAI
except Exception:
    OpenAI = None

app = FastAPI(title="Agent Parse Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ParseRequest(BaseModel):
    text: str

class MatchRequest(BaseModel):
    items: List[Dict[str, Any]]
    materials: List[Dict[str, Any]]

# --- 工具函数 ---
def extract_json_robust(text: str):
    text = text.strip()
    start = text.find('[')
    end = text.rfind(']')
    if start != -1 and end != -1:
        json_str = text[start : end + 1]
        try:
            return json.loads(json_str)
        except json.JSONDecodeError:
            clean_str = json_str.replace("```json", "").replace("```", "").strip()
            try:
                return json.loads(clean_str)
            except:
                pass
    return None

def get_client():
    key = os.getenv("OPENAI_API_KEY")
    if not key or OpenAI is None:
        return None
    try:
        return OpenAI(
            api_key=key,
            base_url=os.getenv("OPENAI_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
        )
    except TypeError as te:
        # Compatibility issue between installed openai/httpx versions
        print(f"OpenAI client initialization failed (TypeError): {te}")
        return None
    except Exception as e:
        print(f"OpenAI client initialization failed: {e}")
        return None

# --- 1. Parse (解析) 接口 (保持之前优化的版本) ---
@app.post("/parse")
def parse(req: ParseRequest):
    text = req.text or ""
    if not text.strip():
        return []

    client = get_client()
    if not client: return []

    prompt = f"""
You are an expert data cleaning assistant. Extract required materials from text.

Input Text:
\"\"\"{text}\"\"\"

Output Requirements:
1. Output ONLY a valid JSON Array.
2. Object fields: "label" and "category".
3. **Label Cleaning**: REMOVE university names, brackets like "(见附件)", "(需签字)". Keep concise core nouns (e.g., "报名表", "本科成绩单").
4. **Category**: [transcript, english, personal, recommendation, certificate, paper, identity, application_form, other].

Examples:
Input: "（1）《同济大学报名表》（需签字）" -> Output: [{{"label": "报名表", "category": "application_form"}}]
Input: "2. 本科成绩单(带印章)" -> Output: [{{"label": "本科成绩单", "category": "transcript"}}]

Output JSON array:
"""
    try:
        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "qwen-falsh"),
            messages=[
                {"role": "system", "content": "You are a strict parser. Output valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )
        parsed = extract_json_robust(resp.choices[0].message.content)
        return JSONResponse(content=parsed if parsed else [])
    except Exception as e:
        print(f"Parse Error: {e}")
        return JSONResponse(content=[])


# --- 2. Match (匹配) 接口 (核心修正) ---
@app.post("/match")
def match(req: MatchRequest):
    items = req.items or []
    materials = req.materials or []
    
    if not items:
        return JSONResponse(content={"matches": []})

    client = get_client()
    if not client:
        return JSONResponse(content={"matches": []})

    # 1. 构建带有分类语义的精简列表
    category_semantics = {
        "transcript": "成绩单/绩点/排名证明",
        "english": "外语/四六级/托福雅思",
        "personal": "简历/个人陈述/计划书",
        "application_form": "报名表/申请表",
        "certificate": "获奖证书/证明",
        "recommendation": "推荐信",
        "identity": "身份证/学生证",
        "paper": "论文/出版物",
        "other": "其他材料"
    }

    minified_materials = []
    for m in materials:
        cat = m.get("category", "other")
        semantic_tag = category_semantics.get(cat, "其他")
        minified_materials.append({
            "id": m.get("id"),
            "filename": m.get("filename"), 
            "type_hint": semantic_tag
        })
    
    # 2. 基于分类的智能匹配 Prompt
    prompt = f"""
Task: Match "Required Items" to "Available Files" using category-first logic.

Required Items:
{json.dumps(items, ensure_ascii=False)}

Available Files:
{json.dumps(minified_materials, ensure_ascii=False)}

**Category-First Matching Logic (分类优先匹配逻辑):**

1. **Category Mapping (分类映射)**:
   - "本科成绩单/成绩单" → type_hint contains "成绩单"
   - "报名表/申请表" → type_hint contains "报名表"
   - "外语证明/CET/托福" → type_hint contains "外语"
   - "简历/个人陈述" → type_hint contains "简历"
   - "推荐信" → type_hint contains "推荐信"

2. **Two-Stage Matching (两阶段匹配)**:
   Stage 1 - Category Filter: Find files in the correct category first.
   Stage 2 - Content Match: Within the category, match filename content.

3. **Scoring Rules (评分规则)**:
   - Category Match (分类匹配): +50 points if type_hint matches requirement category
   - Filename Match (文件名匹配): +30 points for semantic synonyms
   - Partial Match (部分匹配): +10 points for keyword overlaps

4. **Examples (示例)**:
   - Requirement: "本科成绩单" → Find files with type_hint="成绩单/绩点/排名证明", then check filenames
   - Requirement: "报名表" → Find files with type_hint="报名表/申请表", then match "报名表", "申请表", etc.

5. **Filename De-noising (文件名降噪)**:
   - Ignore university names and personal names in filenames
   - Focus on content keywords: "成绩单", "证明", "CET", "报名表", etc.

Output JSON Structure:
{{
  "matches": [
    {{
      "item_label": "本科成绩单",
      "candidates": [
        {{ "id": "file_id_1", "score": 80, "reason": "Category:成绩单 + Filename contains '成绩'" }},
        {{ "id": "file_id_2", "score": 60, "reason": "Category:成绩单 + Partial filename match" }}
      ]
    }}
  ]
}}

Output JSON only. Prioritize category matches over filename-only matches.
"""

    try:
        print(f"Match API called with {len(items)} items and {len(materials)} materials")
        print(f"Sample materials: {minified_materials[:2] if minified_materials else 'None'}")

        resp = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "qwen-falsh"),
            messages=[
                {"role": "system", "content": "You are a smart assistant. Match files using category-first logic: find correct category first, then match content within category."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
        )

        print(f"LLM Response: {resp.choices[0].message.content[:500]}...")
        
        parsed = extract_json_robust(resp.choices[0].message.content)
        return JSONResponse(content=parsed if parsed else {"matches": []})
            
    except Exception as e:
        print(f"Match Error: {e}")
        return JSONResponse(content={"matches": []})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

